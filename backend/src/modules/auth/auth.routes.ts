import { Hono, type Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { sendOtpSchema, verifyOtpSchema, oauthSchema, twoFactorVerifySchema, switchOtpToOAuthSchema } from './auth.schemas';
import {
  sendOtp,
  verifyOtpAndLogin,
  verifyTwoFactorLogin,
  loginWithOAuth,
  logout,
  getSession,
} from './auth.service';
import { requireAuth } from './require-auth';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './session.service';
import { env } from '../../config/env';

const SESSION_PATH = '/';

function extractIp(c: Context): string {
  const fwd = c.req.header('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return c.req.header('cf-connecting-ip') ?? 'unknown';
}

/** Définit le cookie de session httpOnly, Secure (prod), SameSite=Strict. */
function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: SESSION_PATH,
    maxAge: SESSION_TTL_SECONDS,
  });
}

type LoginResultShape =
  | { token: string; user: unknown; isNewUser: boolean }
  | { twoFactorRequired: true; ticket: string; user: unknown };

function sendLoginResponse(c: Context, result: LoginResultShape) {
  if ('token' in result) setSessionCookie(c, result.token);
  return c.json(result, 200);
}

export const authModule = new Hono()
  .post('/send-otp', zValidator('json', sendOtpSchema), async (c) => {
    const { email } = c.req.valid('json');
    const ip = extractIp(c);
    const result = await sendOtp(email, ip);
    return c.json(result, 200);
  })

  .post('/verify-otp', zValidator('json', verifyOtpSchema), async (c) => {
    const { email, code } = c.req.valid('json');
    const ip = extractIp(c);
    const result = await verifyOtpAndLogin(email, code, {
      ip,
      userAgent: c.req.header('user-agent'),
    });
    return sendLoginResponse(c, result);
  })

  .post('/2fa/verify', zValidator('json', twoFactorVerifySchema), async (c) => {
    const { ticket, code } = c.req.valid('json');
    const ip = extractIp(c);
    const result = await verifyTwoFactorLogin(ticket, code, {
      ip,
      userAgent: c.req.header('user-agent'),
    });
    setSessionCookie(c, result.token);
    return c.json(result, 200);
  })

  .post('/login/switch-otp', zValidator('json', switchOtpToOAuthSchema), async (c) => {
    const ip = extractIp(c);
    const result = await sendOtp(c.req.valid('json').email, ip);
    return c.json(result, 200);
  })

  .post('/google', zValidator('json', oauthSchema), async (c) => {
    const { idToken } = c.req.valid('json');
    const ip = extractIp(c);
    const result = await loginWithOAuth('google', idToken, {
      ip,
      userAgent: c.req.header('user-agent'),
    });
    return sendLoginResponse(c, result);
  })

  .post('/apple', zValidator('json', oauthSchema), async (c) => {
    const { idToken } = c.req.valid('json');
    const ip = extractIp(c);
    const result = await loginWithOAuth('apple', idToken, {
      ip,
      userAgent: c.req.header('user-agent'),
    });
    return sendLoginResponse(c, result);
  })

  .post('/logout', requireAuth, async (c) => {
    const cookieToken = getCookie(c, SESSION_COOKIE);
    const authHeader = c.req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    await logout(cookieToken ?? bearerToken ?? '');
    deleteCookie(c, SESSION_COOKIE, { path: SESSION_PATH });
    return c.json({ success: true }, 200);
  })

  .get('/session', async (c) => {
    const cookieToken = getCookie(c, SESSION_COOKIE);
    const authHeader = c.req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const session = await getSession(cookieToken ?? bearerToken ?? null);
    if (!session) return c.json({ user: null }, 200);
    return c.json({ user: session.user }, 200);
  });
