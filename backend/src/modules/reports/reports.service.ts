import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { assertCanReadTribePost } from '../tribes/tribes.access';
import type { CreateReportInput } from './reports.schemas';

/** Vérifie que la cible existe. */
async function assertTargetExists(targetType: string, targetId: string, viewerId: string): Promise<void> {
  let exists = false;
  if (targetType === 'user') {
    const [row] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, targetId)).limit(1);
    exists = Boolean(row);
  } else if (targetType === 'post') {
    const [row] = await db.select({ id: schema.posts.id, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, targetId)).limit(1);
    exists = Boolean(row);
    // Un post d'une tribu privée illisible pour le lecteur se comporte comme un post inexistant (pas d'oracle d'existence).
    if (row) await assertCanReadTribePost(row.tribeId, viewerId).catch(() => { exists = false; });
  } else if (targetType === 'comment') {
    const [row] = await db.select({ id: schema.comments.id, tribeId: schema.posts.tribeId }).from(schema.comments)
      .innerJoin(schema.posts, eq(schema.posts.id, schema.comments.postId)).where(eq(schema.comments.id, targetId)).limit(1);
    exists = Boolean(row);
    if (row) await assertCanReadTribePost(row.tribeId, viewerId).catch(() => { exists = false; });
  } else if (targetType === 'place') {
    // Seul un lieu publié (donc visible de tous) se signale ; un lieu en attente ou refusé répond « introuvable ».
    const [row] = await db.select({ id: schema.culturalPlaces.id }).from(schema.culturalPlaces)
      .where(and(eq(schema.culturalPlaces.id, targetId), eq(schema.culturalPlaces.status, 'published'))).limit(1);
    exists = Boolean(row);
  } else if (targetType === 'message') {
    const [row] = await db.select({ id: schema.messages.id }).from(schema.messages).where(eq(schema.messages.id, targetId)).limit(1);
    exists = Boolean(row);
  }
  if (!exists) throw AppError.notFound('Contenu cible introuvable', 'REPORT_TARGET_NOT_FOUND');
}

/** POST /api/reports — crée un signalement (déduplication par cible + statut ouvert). */
export async function createReport(userId: string, input: CreateReportInput): Promise<{ id: string; status: string }> {
  await assertTargetExists(input.targetType, input.targetId, userId);

  if (input.targetType === 'user' && input.targetId === userId) {
    throw AppError.badRequest('Impossible de se signaler soi-même', 'SELF_REPORT');
  }

  const dup = await db
    .select({ id: schema.reports.id })
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.reporterId, userId),
        eq(schema.reports.targetType, input.targetType),
        eq(schema.reports.targetId, input.targetId),
        eq(schema.reports.status, 'open'),
      ),
    )
    .limit(1);
  if (dup[0]) throw AppError.conflict('Report déjà envoyé, en attente de traitement', 'REPORT_DUPLICATE');

  const [row] = await db
    .insert(schema.reports)
    .values({
      reporterId: userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description ?? null,
    })
    .returning();
  if (!row) throw AppError.badRequest('Échec de création du report', 'REPORT_CREATE_FAILED');

  return { id: row.id, status: row.status };
}
