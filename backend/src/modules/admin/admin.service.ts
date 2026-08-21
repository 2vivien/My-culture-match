import { and, desc, eq, gte, gt, like, or, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { createNotification } from '../notifications/notifications.service';
import { invalidateRoleCache } from '../auth/require-admin';
import type { ReportAction } from './admin.schemas';

const SUSPENSION_DAYS = 7;

/** Log un audit (qui, quoi, quand, pourquoi). */
export async function logAudit(
  actorId: string,
  action: string,
  metadata: Record<string, unknown>,
  meta: { ip?: string; userAgent?: string },
): Promise<void> {
  await db.insert(schema.auditLogs).values({
    userId: actorId,
    action,
    metadata,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });
}

/** Résout l'utilisateur ciblé par un report (post/comment/message → auteur). */
async function resolveReportTargetUser(targetType: string, targetId: string): Promise<string | null> {
  if (targetType === 'user') return targetId;
  if (targetType === 'post') {
    const [row] = await db.select({ authorId: schema.posts.authorId }).from(schema.posts).where(eq(schema.posts.id, targetId)).limit(1);
    return row?.authorId ?? null;
  }
  if (targetType === 'comment') {
    const [row] = await db.select({ userId: schema.comments.userId }).from(schema.comments).where(eq(schema.comments.id, targetId)).limit(1);
    return row?.userId ?? null;
  }
  if (targetType === 'message') {
    const [row] = await db.select({ senderId: schema.messages.senderId }).from(schema.messages).where(eq(schema.messages.id, targetId)).limit(1);
    return row?.senderId ?? null;
  }
  return null;
}

// ── Reports ────────────────────────────────────────────────

export async function listReports(
  opts: { status?: string; cursor?: string; limit?: number },
): Promise<{ reports: Array<Record<string, unknown>>; nextCursor: string | null }> {
  const { status, cursor, limit = 20 } = opts;

  const where = [
    status ? eq(schema.reports.status, status as never) : undefined,
    cursor ? gt(schema.reports.createdAt, new Date(cursor)) : undefined,
  ].filter(Boolean) as Array<ReturnType<typeof eq>>;

  const rows = await db
    .select({
      id: schema.reports.id,
      reporterId: schema.reports.reporterId,
      reporterName: schema.users.name,
      targetType: schema.reports.targetType,
      targetId: schema.reports.targetId,
      reason: schema.reports.reason,
      description: schema.reports.description,
      status: schema.reports.status,
      moderatorId: schema.reports.moderatorId,
      resolution: schema.reports.resolution,
      createdAt: schema.reports.createdAt,
    })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.reporterId))
    .where(where.length > 0 ? and(...where) : undefined)
    .orderBy(desc(schema.reports.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore && page.length > 0 ? new Date(page[page.length - 1]!.createdAt).toISOString() : null;

  return { reports: page.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })), nextCursor };
}

/** Applique une action de modération sur un report (warn | suspend | ban | dismiss). */
export async function takeReportAction(
  reportId: string,
  adminId: string,
  action: ReportAction,
  reason: string | undefined,
  meta: { ip?: string; userAgent?: string },
): Promise<{ id: string; status: string; resolution: string | null }> {
  const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  if (!report) throw AppError.notFound('Report introuvable', 'REPORT_NOT_FOUND');

  const targetUserId = await resolveReportTargetUser(report.targetType, report.targetId);
  const resolution = reason ?? `${action} par la modération`;

  if (action === 'dismiss') {
    await db
      .update(schema.reports)
      .set({ status: 'dismissed', moderatorId: adminId, resolution, resolvedAt: new Date() })
      .where(eq(schema.reports.id, reportId));
  } else {
    if (!targetUserId) throw AppError.badRequest('Cible du report introuvable', 'REPORT_TARGET_MISSING');

    if (action === 'warn') {
      await createNotification({
        userId: targetUserId,
        actorId: adminId,
        type: 'system',
        action: 'moderation.warn',
        target: report.targetId,
        metadata: { reason: resolution, reportId },
      });
    }
    if (action === 'suspend') {
      await db
        .update(schema.users)
        .set({ lockedUntil: new Date(Date.now() + SUSPENSION_DAYS * 24 * 60 * 60 * 1000), updatedAt: new Date() })
        .where(eq(schema.users.id, targetUserId));
      await invalidateRoleCache(targetUserId);
      await createNotification({
        userId: targetUserId,
        actorId: adminId,
        type: 'system',
        action: 'moderation.suspend',
        metadata: { reason: resolution, days: SUSPENSION_DAYS, reportId },
      });
    }
    if (action === 'ban') {
      await banUser(targetUserId, adminId, resolution, undefined, meta);
    }

    await db
      .update(schema.reports)
      .set({ status: 'actioned', moderatorId: adminId, resolution, resolvedAt: new Date() })
      .where(eq(schema.reports.id, reportId));
  }

  await logAudit(adminId, `report.${action}`, { reportId, targetType: report.targetType, targetId: report.targetId, reason: resolution }, meta);

  return { id: report.id, status: action === 'dismiss' ? 'dismissed' : 'actioned', resolution };
}

// ── Utilisateurs ───────────────────────────────────────────

export async function listAdminUsers(
  opts: { search?: string; status?: string; cursor?: string; limit?: number },
): Promise<{ users: Array<Record<string, unknown>>; nextCursor: string | null }> {
  const { search, status, cursor, limit = 20 } = opts;

  const clauses = [];
  if (search) {
    clauses.push(or(like(schema.users.name, `%${search}%`), like(schema.users.username, `%${search}%`), like(schema.users.email, `%${search}%`)));
  }
  if (status === 'banned') clauses.push(sql`${schema.users.bannedAt} IS NOT NULL`);
  if (status === 'suspended') clauses.push(sql`${schema.users.lockedUntil} > now()`);
  if (status === 'active') clauses.push(sql`${schema.users.bannedAt} IS NULL AND (${schema.users.lockedUntil} IS NULL OR ${schema.users.lockedUntil} <= now())`);
  if (cursor) clauses.push(gt(schema.users.createdAt, new Date(cursor)));

  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      email: schema.users.email,
      role: schema.users.role,
      avatar: schema.users.avatar,
      profileCompleted: schema.users.profileCompleted,
      bannedAt: schema.users.bannedAt,
      banReason: schema.users.banReason,
      lockedUntil: schema.users.lockedUntil,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(clauses.length > 0 ? and(...(clauses as never[])) : undefined)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore && page.length > 0 ? new Date(page[page.length - 1]!.createdAt).toISOString() : null;

  return {
    users: page.map((u) => ({
      ...u,
      bannedAt: u.bannedAt ? new Date(u.bannedAt).toISOString() : null,
      lockedUntil: u.lockedUntil ? new Date(u.lockedUntil).toISOString() : null,
      createdAt: new Date(u.createdAt).toISOString(),
    })),
    nextCursor,
  };
}

/** Bannit un utilisateur (définitif) et révoque ses sessions. */
export async function banUser(
  userId: string,
  adminId: string,
  reason: string,
  _durationDays: number | undefined,
  meta: { ip?: string; userAgent?: string },
): Promise<{ id: string; banned: boolean }> {
  const [user] = await db.select({ id: schema.users.id, role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (user.role === 'superadmin') throw AppError.forbidden('Impossible de bannir un superadmin', 'ADMIN_PROTECTED');

  await db
    .update(schema.users)
    .set({ bannedAt: new Date(), banReason: reason, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  await invalidateRoleCache(userId);

  // Révoque toutes les sessions actives du compte banni (Redis + blacklist)
  const { revokeAllUserSessions } = await import('../auth/session.service');
  await revokeAllUserSessions(userId);

  await createNotification({
    userId,
    actorId: adminId,
    type: 'system',
    action: 'moderation.ban',
    metadata: { reason },
  });
  await logAudit(adminId, 'user.ban', { userId, reason }, meta);

  return { id: userId, banned: true };
}

/** Débannit un utilisateur (réversible, L12). */
export async function unbanUser(
  userId: string,
  adminId: string,
  reason: string | undefined,
  meta: { ip?: string; userAgent?: string },
): Promise<{ id: string; banned: boolean }> {
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  await db
    .update(schema.users)
    .set({ bannedAt: null, banReason: null, lockedUntil: null, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  await invalidateRoleCache(userId);
  await logAudit(adminId, 'user.unban', { userId, reason: reason ?? 'Rétablissement' }, meta);

  return { id: userId, banned: false };
}

// ── Stats globales ─────────────────────────────────────────

export async function getAdminStats(): Promise<Record<string, number>> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [users, activeToday, posts, flaggedPosts, openReports, matches, messages24h] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.users),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(gt(schema.users.lastLoginAt, dayAgo)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.posts).where(gt(schema.posts.createdAt, dayAgo)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.posts).where(eq(schema.posts.status, 'flagged')),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.reports).where(eq(schema.reports.status, 'open')),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.loveMatches).where(eq(schema.loveMatches.isMutual, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.messages).where(gte(schema.messages.createdAt, dayAgo)),
  ]);

  return {
    totalUsers: users[0]!.count,
    activeUsers24h: activeToday[0]!.count,
    newPosts24h: posts[0]!.count,
    flaggedPosts: flaggedPosts[0]!.count,
    openReports: openReports[0]!.count,
    totalMatches: matches[0]!.count,
    messages24h: messages24h[0]!.count,
  };
}

// ── Analytics (charts) ─────────────────────────────────────

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '12m';

function periodToDate(period: AnalyticsPeriod): Date {
  const now = Date.now();
  switch (period) {
    case '7d': return new Date(now - 7 * 86_400_000);
    case '30d': return new Date(now - 30 * 86_400_000);
    case '90d': return new Date(now - 90 * 86_400_000);
    case '12m': return new Date(now - 365 * 86_400_000);
  }
}

function dayLabel(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthLabel(d: Date): string {
  return d.toISOString().slice(0, 7);
}

/** GET /api/admin/analytics — données pour les charts admin. */
export async function getAnalytics(period: AnalyticsPeriod) {
  const since = periodToDate(period);
  const isMonthly = period === '12m';

  // ── 1. Activité quotidienne (ou mensuelle) ──
  const userRows = await db
    .select({
      day: sql<string>`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.users.createdAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.users)
    .where(gte(schema.users.createdAt, since))
    .groupBy(sql`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.users.createdAt})`)
    .orderBy(sql`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.users.createdAt})`);

  const postRows = await db
    .select({
      day: sql<string>`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.posts.createdAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.posts)
    .where(gte(schema.posts.createdAt, since))
    .groupBy(sql`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.posts.createdAt})`)
    .orderBy(sql`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.posts.createdAt})`);

  const msgRows = await db
    .select({
      day: sql<string>`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.messages.createdAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.messages)
    .where(gte(schema.messages.createdAt, since))
    .groupBy(sql`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.messages.createdAt})`)
    .orderBy(sql`date_trunc(${isMonthly ? sql`'month'` : sql`'day'`}, ${schema.messages.createdAt})`);

  // Mapper en map label → count
  const userMap = new Map(userRows.map((r) => [r.day.slice(0, isMonthly ? 7 : 10), r.count]));
  const postMap = new Map(postRows.map((r) => [r.day.slice(0, isMonthly ? 7 : 10), r.count]));
  const msgMap = new Map(msgRows.map((r) => [r.day.slice(0, isMonthly ? 7 : 10), r.count]));

  // Générer les labels de dates manquants
  const activity: Array<{ label: string; utilisateurs: number; posts: number; messages: number }> = [];
  const start = new Date(since);
  const end = new Date();
  const step = isMonthly ? 30 * 86_400_000 : 86_400_000;
  for (let t = start.getTime(); t <= end.getTime(); t += step) {
    const d = new Date(t);
    const key = isMonthly ? monthLabel(d) : dayLabel(d);
    const shortLabel = isMonthly
      ? d.toLocaleDateString('fr-FR', { month: 'short' })
      : d.toLocaleDateString('fr-FR', { weekday: 'short' });
    activity.push({
      label: shortLabel,
      utilisateurs: userMap.get(key) ?? 0,
      posts: postMap.get(key) ?? 0,
      messages: msgMap.get(key) ?? 0,
    });
  }

  // ── 2. Croissance mensuelle (toujours 12 derniers mois) ──
  const growthSince = new Date(Date.now() - 12 * 30 * 86_400_000);
  const growthUserRows = await db
    .select({
      month: sql<string>`to_char(${schema.users.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.users)
    .where(gte(schema.users.createdAt, growthSince))
    .groupBy(sql`to_char(${schema.users.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${schema.users.createdAt}, 'YYYY-MM')`);

  const growthTribeRows = await db
    .select({
      month: sql<string>`to_char(${schema.tribes.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.tribes)
    .where(gte(schema.tribes.createdAt, growthSince))
    .groupBy(sql`to_char(${schema.tribes.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${schema.tribes.createdAt}, 'YYYY-MM')`);

  const growthUserMap = new Map(growthUserRows.map((r) => [r.month, r.count]));
  const growthTribeMap = new Map(growthTribeRows.map((r) => [r.month, r.count]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now() - (11 - i) * 30 * 86_400_000);
    return monthLabel(d);
  });

  const growth = months.map((m) => ({
    month: new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
    utilisateurs: growthUserMap.get(m) ?? 0,
    tribus: growthTribeMap.get(m) ?? 0,
  }));

  // ── 3. Distribution des signalements ──
  const reportRows = await db
    .select({
      reason: schema.reports.reason,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.reports)
    .where(gte(schema.reports.createdAt, since))
    .groupBy(schema.reports.reason);

  const REPORT_LABELS: Record<string, string> = {
    harassment: 'Harcèlement', spam: 'Spam', hate_speech: 'Discours haineux',
    nsfw: 'Contenu NSFW', violence: 'Violence', other: 'Autre',
  };
  const REPORT_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#6b7280'];
  const reportDistribution = reportRows.map((r, i) => ({
    name: REPORT_LABELS[r.reason ?? 'other'] ?? r.reason ?? 'Autre',
    value: r.count,
    color: REPORT_COLORS[i % REPORT_COLORS.length],
  }));

  // ── 4. Distribution des match scores ──
  const scoreRows = await db
    .select({
      range: sql<string>`CASE
        WHEN ${schema.loveMatches.matchScore} < 20 THEN '0-20'
        WHEN ${schema.loveMatches.matchScore} < 40 THEN '20-40'
        WHEN ${schema.loveMatches.matchScore} < 60 THEN '40-60'
        WHEN ${schema.loveMatches.matchScore} < 80 THEN '60-80'
        ELSE '80-100'
      END`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.loveMatches)
    .groupBy(sql`CASE
      WHEN ${schema.loveMatches.matchScore} < 20 THEN '0-20'
      WHEN ${schema.loveMatches.matchScore} < 40 THEN '20-40'
      WHEN ${schema.loveMatches.matchScore} < 60 THEN '40-60'
      WHEN ${schema.loveMatches.matchScore} < 80 THEN '60-80'
      ELSE '80-100'
    END`)
    .orderBy(sql`CASE
      WHEN ${schema.loveMatches.matchScore} < 20 THEN '0-20'
      WHEN ${schema.loveMatches.matchScore} < 40 THEN '20-40'
      WHEN ${schema.loveMatches.matchScore} < 60 THEN '40-60'
      WHEN ${schema.loveMatches.matchScore} < 80 THEN '60-80'
      ELSE '80-100'
    END`);

  const scoreDistribution = ['0-20', '20-40', '40-60', '60-80', '80-100'].map((range) => ({
    range,
    count: scoreRows.find((r) => r.range === range)?.count ?? 0,
  }));

  // ── 5. Engagement par heure (24h) ──
  const engagementRows = await db
    .select({
      hour: sql<string>`extract(hour from ${schema.posts.createdAt})::int`,
      likes: sql<number>`coalesce(sum(${schema.posts.likes}), 0)::int`,
      comments: sql<number>`coalesce(sum(${schema.posts.comments}), 0)::int`,
      shares: sql<number>`coalesce(sum(${schema.posts.shares}), 0)::int`,
    })
    .from(schema.posts)
    .where(gte(schema.posts.createdAt, since))
    .groupBy(sql`extract(hour from ${schema.posts.createdAt})`)
    .orderBy(sql`extract(hour from ${schema.posts.createdAt})`);

  const engagementMap = new Map(engagementRows.map((r) => [String(r.hour), r]));
  const engagement = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}h`,
    likes: engagementMap.get(String(h))?.likes ?? 0,
    comments: engagementMap.get(String(h))?.comments ?? 0,
    shares: engagementMap.get(String(h))?.shares ?? 0,
  }));

  return {
    activity,
    growth,
    reportDistribution,
    scoreDistribution,
    engagement,
  };
}
