/**
 * Métriques Love (L8) — logique PURE : aucune dépendance base/redis, uniquement des agrégats.
 * Vie privée : on ne manipule que des compteurs, jamais d'identifiant d'utilisateur
 * ni de contenu de conversation.
 */

/** Compteurs bruts issus des agrégats SQL (love_matches, love_profiles). */
export interface LoveRawCounts {
  /** Lignes `like` (premier like d'une paire + like de réponse). */
  likes: number;
  /** Paires mutuelles (une paire = 2 lignes is_mutual). */
  matches: number;
  /** Refus : un `pass` posé en réponse à une requête reçue. */
  declined: number;
  /** Requêtes sans réponse depuis plus que la durée de vie d'une requête. */
  expired: number;
  /** Requêtes sans réponse, encore valides. */
  pending: number;
  /** Profils Love complétés (questionnaire rempli). */
  questionnairesCompleted: number;
}

export interface LoveFunnel {
  questionnairesCompleted: number;
  requestsSent: number;
  requestsAccepted: number;
  requestsDeclined: number;
  requestsExpired: number;
  requestsPending: number;
  matches: number;
  /** acceptées / envoyées (0..1), null tant qu'aucune requête n'a été envoyée. */
  acceptanceRate: number | null;
  /** acceptées / (acceptées + refusées) : taux sur les requêtes ayant reçu une réponse. */
  answeredAcceptanceRate: number | null;
}

/** Division sûre arrondie à 4 décimales ; null si le dénominateur est nul. */
export function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Math.round((Math.max(0, numerator) / denominator) * 10000) / 10000;
}

/**
 * Entonnoir : une requête envoyée est le premier like d'une paire, donc
 * envoyées = likes − likes de réponse (un par match). Accepter = like réciproque = match.
 */
export function computeFunnel(raw: LoveRawCounts): LoveFunnel {
  const requestsSent = Math.max(0, raw.likes - raw.matches);
  return {
    questionnairesCompleted: raw.questionnairesCompleted,
    requestsSent,
    requestsAccepted: raw.matches,
    requestsDeclined: raw.declined,
    requestsExpired: raw.expired,
    requestsPending: raw.pending,
    matches: raw.matches,
    acceptanceRate: safeRate(raw.matches, requestsSent),
    answeredAcceptanceRate: safeRate(raw.matches, raw.matches + raw.declined),
  };
}
