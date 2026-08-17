import { redis } from '../../infrastructure/redis';
import { AppError } from './AppError';

const RESULT_TTL = 24 * 60 * 60; // 24h
const LOCK_TTL_SECONDS = 15;

/**
 * Idempotence par clé (header `Idempotency-Key`) :
 * - 1ère requête : exécute fn, met en cache le résultat JSON (24h).
 * - Doublon (même clé) : retourne le résultat en cache, sans ré-exécuter.
 * - Requête concurrente en cours : 409 après un court délai.
 *
 * S'applique aux POST critiques (création de post, like, comment, message,
 * swipe, follow…) pour éviter les doublons liés aux retries client.
 */
export async function withIdempotency<T>(
  scope: string,
  idempotencyKey: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (!idempotencyKey) return fn();

  const cacheKey = `idem:${scope}:${idempotencyKey}`;
  const lockKey = `${cacheKey}:lock`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as T;

  const acquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
  if (!acquired) {
    // Doublon concurrent : on attend la fin puis on relit le cache
    await new Promise((r) => setTimeout(r, 400));
    const again = await redis.get(cacheKey);
    if (again) return JSON.parse(again) as T;
    throw AppError.conflict('Requête déjà en cours', 'IDEMPOTENCY_IN_FLIGHT');
  }

  try {
    const result = await fn();
    await redis.set(cacheKey, JSON.stringify(result), 'EX', RESULT_TTL);
    return result;
  } finally {
    await redis.del(lockKey);
  }
}

/** Lit la clé d'idempotence depuis l'en-tête HTTP. */
export function idempotencyKeyFrom(c: { req: { header: (n: string) => string | undefined } }): string | undefined {
  const key = c.req.header('idempotency-key');
  if (!key) return undefined;
  return String(key).slice(0, 128);
}
