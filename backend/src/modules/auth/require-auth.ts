import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { AppError } from '../../shared/utils/AppError';
import { getSession } from './auth.service';
import { SESSION_COOKIE } from './session.service';

export type AuthContext = {
  userId: string;
  email: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

/**
 * Middleware d'authentification : lit le cookie de session (ou le header
 * Authorization: Bearer), vérifie la session et expose c.get('auth').
 */
export async function requireAuth(c: Context, next: Next) {
  const cookieToken = getCookie(c, SESSION_COOKIE);
  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? bearerToken;
  if (!token) throw AppError.unauthorized();

  const session = await getSession(token);
  if (!session) throw AppError.unauthorized('Session invalide ou expirée');

  c.set('auth', { userId: session.user.id, email: session.user.email });
  await next();
}
