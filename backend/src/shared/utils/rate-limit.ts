import { redis } from '../../infrastructure/redis';

/**
 * Rate limiting par fenêtre fixe (Redis INCR + TTL).
 * Retourne true si la requête est autorisée, false sinon.
 */
export async function rateLimitHit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `rl:${bucket}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (count <= limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const ttl = await redis.ttl(key);
  return { allowed: false, retryAfterSeconds: Math.max(1, ttl) };
}

/** Réinitialise un bucket (utile en test). */
export async function resetRateLimit(bucket: string): Promise<void> {
  await redis.del(`rl:${bucket}`);
}
