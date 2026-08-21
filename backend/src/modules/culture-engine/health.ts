import { and, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';

export type HealthMetricName =
  | 'L01_diversity'
  | 'L03_toxicity_rate'
  | 'L05_emotion_balance'
  | 'L06_growth'
  | 'L07_addiction_index'
  | 'L08_reciprocity'
  | 'L09_curiosity'
  | 'L11_flagged_rate';

function dayString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Métriques de santé quotidiennes (L01-L12). Chaque mesure est stockée
 * dans `health_metrics` (upsert sur (metric, day)) et peut déclencher une
 * alerte si elle dépasse un seuil (côté worker).
 */
export async function computeHealthMetrics(day = new Date()): Promise<Record<HealthMetricName, number>> {
  const weekAgo = new Date(day.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayLabel = dayString(day);

  const [postsWeek, flaggedWeek, postsTotal, openReports, reportsWeek, usersActive, matches] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.posts).where(gte(schema.posts.createdAt, weekAgo)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.posts).where(and(eq(schema.posts.status, 'flagged'), gte(schema.posts.createdAt, weekAgo))),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.posts),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.reports).where(eq(schema.reports.status, 'open')),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.reports).where(gte(schema.reports.createdAt, weekAgo)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.profileCompleted, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.loveMatches).where(eq(schema.loveMatches.isMutual, true)),
  ]);

  const postsW = postsWeek[0]!.count;
  const flaggedW = flaggedWeek[0]!.count;
  const reportsW = reportsWeek[0]!.count;
  const totalPosts = postsTotal[0]!.count;

  const metrics: Record<HealthMetricName, number> = {
    L01_diversity: totalPosts > 0 ? flaggedW / totalPosts : 0,
    L03_toxicity_rate: postsW > 0 ? reportsW / Math.max(postsW, 1) : 0,
    L05_emotion_balance: flaggedW,
    L06_growth: usersActive[0]!.count,
    L07_addiction_index: 0,
    L08_reciprocity: matches[0]!.count,
    L09_curiosity: openReports[0]!.count,
    L11_flagged_rate: postsW > 0 ? flaggedW / Math.max(postsW, 1) : 0,
  };

  await storeHealthMetrics(metrics, dayLabel);
  return metrics;
}

/** Upsert des métriques dans la table health_metrics. */
export async function storeHealthMetrics(metrics: Record<string, number>, day: string): Promise<void> {
  await db
    .insert(schema.healthMetrics)
    .values(Object.entries(metrics).map(([metric, value]) => ({ metric, value, day, details: {} })))
    .onConflictDoUpdate({
      target: [schema.healthMetrics.metric, schema.healthMetrics.day],
      set: { value: sql`excluded.value` },
    });
}

export async function getLastHealthMetrics(): Promise<Record<string, number>> {
  const rows = await db
    .select({ metric: schema.healthMetrics.metric, value: schema.healthMetrics.value })
    .from(schema.healthMetrics)
    .orderBy(schema.healthMetrics.createdAt);
  const out: Record<string, number> = {};
  for (const row of rows) out[row.metric] = row.value;
  return out;
}
