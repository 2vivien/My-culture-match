import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';

const ADMIN_ROLES = new Set(['admin', 'superadmin']);
const ROLE_CACHE_TTL = 5 * 60; // 5 min

const roleCacheKey = (userId: string) => `role:${userId}`;

/** Rôle de l'utilisateur (cache Redis 5 min, fallback DB). */
export async function getRole(userId: string): Promise<string> {
  const cached = await redis.get(roleCacheKey(userId));
  if (cached) return cached;

  const [user] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  await redis.set(roleCacheKey(userId), user.role, 'EX', ROLE_CACHE_TTL);
  return user.role;
}

/** Invalide le cache de rôle (appelé après un changement de rôle). */
export async function invalidateRoleCache(userId: string): Promise<void> {
  await redis.del(roleCacheKey(userId));
}

/** À placer APRÈS requireAuth : refuse les non-admins (403). */
export async function requireAdmin(c: Context, next: Next) {
  const { userId } = c.get('auth');
  const role = await getRole(userId);
  if (!ADMIN_ROLES.has(role)) {
    throw AppError.forbidden('Accès réservé à l’administration', 'ADMIN_REQUIRED');
  }
  c.set('role', role);
  await next();
}

declare module 'hono' {
  interface ContextVariableMap {
    role: string;
  }
}
