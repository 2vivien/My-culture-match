import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { createReport } from '../reports/reports.service';
import type { CreateReportInput } from '../reports/reports.schemas';

async function assertOther(userId: string, targetId: string): Promise<void> {
  if (userId === targetId) throw AppError.badRequest('Cette action ne peut pas cibler votre propre compte', 'SELF_TARGET');
  const [target] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, targetId)).limit(1);
  if (!target) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
}

export async function blockUser(userId: string, targetId: string) {
  await assertOther(userId, targetId);
  await db.insert(schema.blocks).values({ blockerId: userId, blockedId: targetId }).onConflictDoNothing();
  return { success: true, blocked: true };
}

export async function unblockUser(userId: string, targetId: string) {
  await assertOther(userId, targetId);
  await db.delete(schema.blocks).where(and(eq(schema.blocks.blockerId, userId), eq(schema.blocks.blockedId, targetId)));
  return { success: true, blocked: false };
}

export async function listBlockedUsers(userId: string) {
  const rows = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, createdAt: schema.blocks.createdAt })
    .from(schema.blocks).innerJoin(schema.users, eq(schema.users.id, schema.blocks.blockedId)).where(eq(schema.blocks.blockerId, userId));
  return { users: rows };
}

export async function muteUser(userId: string, targetId: string) {
  await assertOther(userId, targetId);
  await db.insert(schema.userMutes).values({ userId, mutedUserId: targetId }).onConflictDoNothing();
  return { success: true, muted: true };
}

export async function unmuteUser(userId: string, targetId: string) {
  await assertOther(userId, targetId);
  await db.delete(schema.userMutes).where(and(eq(schema.userMutes.userId, userId), eq(schema.userMutes.mutedUserId, targetId)));
  return { success: true, muted: false };
}

export async function listMutedUsers(userId: string) {
  const rows = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, createdAt: schema.userMutes.createdAt })
    .from(schema.userMutes).innerJoin(schema.users, eq(schema.users.id, schema.userMutes.mutedUserId)).where(eq(schema.userMutes.userId, userId));
  return { users: rows };
}

export async function report(userId: string, input: CreateReportInput) {
  return createReport(userId, input);
}

export async function createAppeal(userId: string, moderationActionId: string, reason: string) {
  if (!reason.trim()) throw AppError.badRequest('La raison de l’appel est requise', 'APPEAL_REASON_REQUIRED');
  const [action] = await db.select().from(schema.moderationActions).where(and(eq(schema.moderationActions.id, moderationActionId), eq(schema.moderationActions.targetUserId, userId))).limit(1);
  if (!action) throw AppError.notFound('Sanction introuvable', 'MODERATION_ACTION_NOT_FOUND');
  const [existing] = await db.select({ id: schema.moderationAppeals.id }).from(schema.moderationAppeals).where(and(eq(schema.moderationAppeals.userId, userId), eq(schema.moderationAppeals.moderationActionId, moderationActionId), eq(schema.moderationAppeals.status, 'open'))).limit(1);
  if (existing) throw AppError.conflict('Un appel est déjà ouvert pour cette sanction', 'APPEAL_ALREADY_OPEN');
  const [appeal] = await db.insert(schema.moderationAppeals).values({ userId, moderationActionId, reason }).returning();
  return { success: true, appeal };
}

export async function getMyModerationHistory(userId: string) {
  const actions = await db.select().from(schema.moderationActions).where(eq(schema.moderationActions.targetUserId, userId)).orderBy(schema.moderationActions.createdAt);
  const appeals = await db.select().from(schema.moderationAppeals).where(eq(schema.moderationAppeals.userId, userId)).orderBy(schema.moderationAppeals.createdAt);
  return { actions, appeals };
}
