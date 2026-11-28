import { env } from '../../config/env';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { evaluateQuota, loveQuotaKey, quotaExceededMessage, secondsUntilMidnightUtc, type LoveQuotaKind, type LoveQuotaState } from './love.quota';

export const loveQuotaLimit = (kind: LoveQuotaKind): number => (kind === 'search' ? env.LOVE_DAILY_SEARCH_LIMIT : env.LOVE_DAILY_REQUEST_LIMIT);

/** Lecture seule de l'état du jour. */
export async function getLoveQuota(kind: LoveQuotaKind, userId: string, now = new Date()): Promise<LoveQuotaState> {
  const used = Number(await redis.get(loveQuotaKey(kind, userId, now))) || 0;
  return evaluateQuota(used, loveQuotaLimit(kind));
}

/**
 * Consomme une unité du quota du jour ; lève une 429 (LOVE_SEARCH_QUOTA / LOVE_REQUEST_QUOTA) au-delà du plafond.
 * Le compteur expire à minuit UTC. Quota illimité (0) : aucun accès Redis.
 */
export async function consumeLoveQuota(kind: LoveQuotaKind, userId: string, now = new Date()): Promise<LoveQuotaState> {
  const limit = loveQuotaLimit(kind);
  if (limit === 0) return evaluateQuota(0, 0);
  const key = loveQuotaKey(kind, userId, now);
  const used = await redis.incr(key);
  if (used === 1) await redis.expire(key, secondsUntilMidnightUtc(now));
  const state = evaluateQuota(used, limit);
  if (state.exceeded) throw AppError.tooMany(quotaExceededMessage(kind, limit), kind === 'search' ? 'LOVE_SEARCH_QUOTA' : 'LOVE_REQUEST_QUOTA');
  return state;
}
