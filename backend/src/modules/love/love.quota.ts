/**
 * Quotas quotidiens Love (L6) — logique PURE, sans redis ni env.
 * DÉCISION PRODUIT À VALIDER : les valeurs par défaut (20 recherches IA / 30 requêtes par jour)
 * sont des propositions ; 0 signifie « illimité ». Voir LOVE_DAILY_* dans config/env.ts.
 */

export type LoveQuotaKind = 'search' | 'request';

export interface LoveQuotaState {
  /** Plafond quotidien (0 = illimité). */
  limit: number;
  used: number;
  /** Restant aujourd'hui ; null quand le quota est illimité. */
  remaining: number | null;
  unlimited: boolean;
  exceeded: boolean;
}

/** Date UTC du jour au format YYYY-MM-DD (fait partie de la clé Redis). */
export function utcDayStamp(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Secondes jusqu'à minuit UTC (au moins 1 : un TTL Redis de 0 supprimerait la clé). */
export function secondsUntilMidnightUtc(now: Date): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

export function loveQuotaKey(kind: LoveQuotaKind, userId: string, now: Date): string {
  return `love:quota:${kind}:${utcDayStamp(now)}:${userId}`;
}

/** État du quota pour un compteur donné ; `exceeded` signifie que la dernière action dépasse le plafond. */
export function evaluateQuota(used: number, limit: number): LoveQuotaState {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;
  const safeUsed = Math.max(0, Math.floor(used) || 0);
  if (safeLimit === 0) return { limit: 0, used: safeUsed, remaining: null, unlimited: true, exceeded: false };
  return { limit: safeLimit, used: Math.min(safeUsed, safeLimit), remaining: Math.max(0, safeLimit - safeUsed), unlimited: false, exceeded: safeUsed > safeLimit };
}

/** Message 429 en français, explicite sur la nature du plafond et le moment de la remise à zéro. */
export function quotaExceededMessage(kind: LoveQuotaKind, limit: number): string {
  const what = kind === 'search' ? `${limit} recherche${limit > 1 ? 's' : ''} IA` : `${limit} requête${limit > 1 ? 's' : ''} Love`;
  return `Tu as atteint ta limite quotidienne de ${what}. Le compteur repart à zéro à minuit (UTC), réessaie demain.`;
}
