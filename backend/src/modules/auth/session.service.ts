import { createHash, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { env } from '../../config/env';
import { eq } from 'drizzle-orm';

// ── Constantes session ─────────────────────────────────────
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 jours
export const SESSION_COOKIE = 'mcm_session';

const secretKey = new TextEncoder().encode(env.BETTER_AUTH_SECRET);

// ── Clés Redis ─────────────────────────────────────────────
const sessionKey = (jti: string) => `session:${jti}`;
const blacklistKey = (jti: string) => `session:blacklist:${jti}`;

export interface SessionPayload {
  sub: string; // userId
  jti: string; // identifiant unique de session
}

/** Crée un JWT signé HMAC-SHA256 et le stocke dans Redis (TTL 7j) + backup PG. */
export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<string> {
  const jti = randomUUID();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);

  await redis.set(sessionKey(jti), JSON.stringify({ userId, jti }), 'EX', SESSION_TTL_SECONDS);

  // Backup en base (table user_sessions) : hash du token (jamais le JWT brut)
  await db.insert(schema.sessions).values({
    id: jti,
    userId,
    token: createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    ipAddress: meta?.ip,
    userAgent: meta?.userAgent,
  });

  return token;
}

/**
 * Vérifie un token : signature, expiration, existence Redis,
 * et absence de la session dans la blacklist (révocation).
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
    const sub = payload.sub;
    const jti = payload.jti;
    if (!sub || !jti) return null;

    if (await redis.exists(blacklistKey(jti))) return null;
    const stored = await redis.get(sessionKey(jti));
    if (!stored) return null;

    return { sub, jti };
  } catch {
    return null;
  }
}

/** Révoque immédiatement une session : suppression Redis + blacklist du jti. */
export async function revokeSession(token: string): Promise<void> {
  const payload = await verifySession(token);
  if (!payload) return;

  // Blacklist jusqu'à l'expiration initiale pour interdire toute réutilisation du JWT
  const ttl = await redis.ttl(sessionKey(payload.jti));
  await redis.del(sessionKey(payload.jti));
  if (ttl > 0) {
    await redis.set(blacklistKey(payload.jti), '1', 'EX', ttl);
  }

  // Marque le backup PG comme révoqué
  await db.update(schema.sessions).set({ updatedAt: new Date() }).where(eq(schema.sessions.id, payload.jti));
}

/**
 * Révoque toutes les sessions d'un utilisateur (ban/suspension).
 * Utilise l'id de session (jti) stocké en base — pas besoin du JWT brut,
 * uniquement conservé en hash côté client.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const rows = await db
    .select({ id: schema.sessions.id, expiresAt: schema.sessions.expiresAt })
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, userId));

  await Promise.allSettled(
    rows.map(async ({ id: jti, expiresAt }) => {
      const remainingMs = new Date(expiresAt).getTime() - Date.now();
      const ttlSeconds = Math.max(1, Math.ceil(remainingMs / 1000));

      await redis.del(sessionKey(jti));
      await redis.set(blacklistKey(jti), '1', 'EX', ttlSeconds);
      await db.update(schema.sessions).set({ updatedAt: new Date() }).where(eq(schema.sessions.id, jti));
    }),
  );
}
