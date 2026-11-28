import { sql } from 'drizzle-orm';
import { db } from '../../infrastructure/database';
import { computeFunnel, type LoveFunnel, type LoveRawCounts } from './love.metrics';
import { LOVE_REQUEST_TTL_DAYS } from './love.service';

export interface LoveMetricsSummary {
  generatedAt: string;
  requestTtlDays: number;
  funnel: LoveFunnel;
  /** Recherches IA et cartes affichées : compteurs Prometheus (GET /metrics), non persistés en base. */
  prometheus: { searches: string; cardsDisplayed: string };
}

/**
 * Synthèse admin : agrégats SQL uniquement (aucun identifiant ni contenu renvoyé).
 * Une réponse = ligne inverse (candidat → émetteur) existante dans love_matches.
 */
export async function getLoveMetricsSummary(): Promise<LoveMetricsSummary> {
  const ttl = LOVE_REQUEST_TTL_DAYS;
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM love_matches WHERE action = 'like') AS likes,
      (SELECT (count(*) / 2)::int FROM love_matches WHERE is_mutual) AS matches,
      (SELECT count(*)::int FROM love_matches p
         WHERE p.action = 'pass'
           AND EXISTS (SELECT 1 FROM love_matches l WHERE l.user_id = p.candidate_id AND l.candidate_id = p.user_id AND l.action = 'like' AND NOT l.is_mutual)) AS declined,
      (SELECT count(*)::int FROM love_matches l
         WHERE l.action = 'like' AND NOT l.is_mutual
           AND l.created_at <= now() - make_interval(days => ${ttl})
           AND NOT EXISTS (SELECT 1 FROM love_matches r WHERE r.user_id = l.candidate_id AND r.candidate_id = l.user_id)) AS expired,
      (SELECT count(*)::int FROM love_matches l
         WHERE l.action = 'like' AND NOT l.is_mutual
           AND l.created_at > now() - make_interval(days => ${ttl})
           AND NOT EXISTS (SELECT 1 FROM love_matches r WHERE r.user_id = l.candidate_id AND r.candidate_id = l.user_id)) AS pending,
      (SELECT count(*)::int FROM love_profiles) AS questionnaires
  `);
  const rows = (Array.isArray(result) ? result : (result as unknown as { rows?: unknown[] }).rows ?? []) as Array<Record<string, unknown>>;
  const row = rows[0] ?? {};
  const raw: LoveRawCounts = {
    likes: Number(row.likes ?? 0),
    matches: Number(row.matches ?? 0),
    declined: Number(row.declined ?? 0),
    expired: Number(row.expired ?? 0),
    pending: Number(row.pending ?? 0),
    questionnairesCompleted: Number(row.questionnaires ?? 0),
  };
  return {
    generatedAt: new Date().toISOString(),
    requestTtlDays: ttl,
    funnel: computeFunnel(raw),
    prometheus: { searches: 'love_ai_searches_total', cardsDisplayed: 'love_cards_displayed_total' },
  };
}
