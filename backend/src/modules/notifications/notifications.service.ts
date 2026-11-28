import { and, count, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { notificationsSentTotal } from '../../infrastructure/monitoring/metrics';
import type { NOTIFICATION_TYPE } from '../../shared/constants/enums';
import { emitToUser } from '../../infrastructure/websocket';
import { acceptRequest, declineRequest } from '../connections/connections.service';
import { joinTribe } from '../tribes/tribes.service';

type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export interface CreateNotificationInput {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  action?: string | null;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
}

const unreadCacheKey = (userId: string) => `notifications:unread:${userId}`;
const UNREAD_CACHE_TTL = 60;
const DEDUP_WINDOW_MS = 60 * 60 * 1000;

const ACTION_LABEL: Record<NotificationType, string> = {
  comment: 'a commenté votre post',
  like: 'a aimé votre post',
  invite: 'vous a envoyé une invitation',
  request: 'vous a envoyé une demande',
  match: 'c’est un match !',
  message: 'vous a envoyé un message',
  system: 'système',
};

const SYSTEM_ACTION_LABEL: Record<string, string> = {
  temporal_pending: 'vous a écrit un message temporel à découvrir plus tard',
  nearby_person: 'est près de toi',
  temporal_revealed: 'un message temporel vient d’être révélé dans votre conversation',
};

export interface NotificationDto {
  id: string;
  type: NotificationType;
  action: string | null;
  target: string | null;
  metadata: unknown;
  time: string;
  isUnread: boolean;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    label: string;
    subText?: string;
  };
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return;

  const temporalNotification = input.type === 'system' && (input.action === 'temporal_pending' || input.action === 'temporal_revealed');
  if (!temporalNotification) {
    const recent = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, input.userId),
          input.actorId ? eq(schema.notifications.actorId, input.actorId) : isNull(schema.notifications.actorId),
          eq(schema.notifications.type, input.type),
          input.target ? eq(schema.notifications.target, input.target) : undefined,
          gte(schema.notifications.createdAt, new Date(Date.now() - DEDUP_WINDOW_MS)),
        ),
      )
      .limit(1);
    if (recent[0]) return;
  }

  const [row] = await db
    .insert(schema.notifications)
    .values({ userId: input.userId, actorId: input.actorId, type: input.type, action: input.action, target: input.target, metadata: input.metadata })
    .returning();
  if (!row) return;
  notificationsSentTotal.inc();
  await redis.del(unreadCacheKey(input.userId));
  const dto = await toDto(row);
  if (dto) emitToUser(input.userId, 'notification:new', dto);
}

async function toDto(row: schema.Notification): Promise<NotificationDto | null> {
  const actorId = row.actorId;
  const [actor] = actorId
    ? await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar }).from(schema.users).where(eq(schema.users.id, actorId)).limit(1)
    : [];
  const label = row.type === 'system'
    ? SYSTEM_ACTION_LABEL[row.action ?? ''] ?? row.action ?? ACTION_LABEL.system
    : actor ? ACTION_LABEL[row.type] ?? row.action ?? '' : '';

  return {
    id: row.id,
    type: row.type,
    action: row.action,
    target: row.target,
    metadata: row.metadata,
    time: row.createdAt.toISOString(),
    isUnread: row.isUnread,
    user: { id: actorId ?? '', name: actor?.name ?? 'My Culture Match', username: actor?.username ?? '', avatar: actor?.avatar ?? null, label, subText: row.action === 'accept' ? 'a accepté votre demande' : undefined },
  };
}

export async function listNotifications(userId: string, cursor?: string, limit = 20): Promise<{ notifications: NotificationDto[]; nextCursor: string | null }> {
  const rows = await db.select().from(schema.notifications).where(and(eq(schema.notifications.userId, userId), cursor ? lt(schema.notifications.createdAt, new Date(cursor)) : undefined)).orderBy(desc(schema.notifications.createdAt)).limit(limit + 1);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
  const notifications: NotificationDto[] = [];
  for (const row of page) { const dto = await toDto(row); if (dto) notifications.push(dto); }
  return { notifications, nextCursor };
}

export async function setNotificationRead(userId: string, id: string, isUnread: boolean): Promise<{ success: true }> {
  const [row] = await db.select({ userId: schema.notifications.userId }).from(schema.notifications).where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId))).limit(1);
  if (!row) throw AppError.notFound('Notification introuvable', 'NOTIFICATION_NOT_FOUND');
  await db.update(schema.notifications).set({ isUnread }).where(eq(schema.notifications.id, id));
  await redis.del(unreadCacheKey(userId));
  return { success: true };
}

export async function markAllRead(userId: string): Promise<{ success: true }> {
  await db.update(schema.notifications).set({ isUnread: false }).where(eq(schema.notifications.userId, userId));
  await redis.del(unreadCacheKey(userId));
  return { success: true };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const cached = await redis.get(unreadCacheKey(userId));
  if (cached !== null) return Number(cached);
  const [row] = await db.select({ count: count() }).from(schema.notifications).where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isUnread, true)));
  const value = row?.count ?? 0;
  await redis.set(unreadCacheKey(userId), String(value), 'EX', UNREAD_CACHE_TTL);
  return value;
}

export async function handleNotificationAction(userId: string, id: string, action: 'accept' | 'decline'): Promise<{ success: true; effect?: string }> {
  const [row] = await db.select().from(schema.notifications).where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId))).limit(1);
  if (!row) throw AppError.notFound('Notification introuvable', 'NOTIFICATION_NOT_FOUND');
  let effect: string | undefined;
  if (row.type === 'request' && row.actorId) {
    if (action === 'accept') { await acceptRequest(userId, row.actorId); effect = 'companion'; }
    else { await declineRequest(userId, row.actorId); effect = 'declined'; }
  } else if (row.type === 'invite' && row.target) {
    if (action === 'accept') { await joinTribe(row.target, userId); effect = 'joined'; }
  } else if (row.type === 'match' && row.metadata && typeof row.metadata === 'object') {
    const conversationId = (row.metadata as Record<string, unknown>).conversationId;
    if (conversationId && typeof conversationId === 'string') effect = conversationId;
  }
  await db.update(schema.notifications).set({ isUnread: false, action: action ?? row.action }).where(eq(schema.notifications.id, id));
  await redis.del(unreadCacheKey(userId));
  return { success: true, effect };
}
