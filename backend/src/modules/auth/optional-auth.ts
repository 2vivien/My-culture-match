import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getSession } from './auth.service';
import { SESSION_COOKIE } from './session.service';

/**
 * Authentification facultative : remplit `c.get('auth')` si une session valide
 * est présente, sinon laisse passer en visiteur. À utiliser uniquement sur les
 * routes publiques en lecture seule.
 */
export async function optionalAuth(c: Context, next: Next) {
  const cookieToken = getCookie(c, SESSION_COOKIE);
  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken ?? bearerToken;
  if (!token) return next();

  try {
    const session = await getSession(token);
    if (session && !session.user.bannedAt) {
      c.set('auth', { userId: session.user.id, email: session.user.email });
    }
  } catch {
    // Session invalide ou expirée : on continue en visiteur.
  }
  return next();
}
