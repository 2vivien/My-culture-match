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
const UNREAD_CACHE_TTL = 60; // secondes
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1h

/** Texte d'action lisible selon le type de notification. */
const ACTION_LABEL: Record<NotificationType, string> = {
  comment: 'a commenté votre tradition',
  like: 'a aimé votre tradition',
  invite: 'vous a envoyé une invitation',
  request: 'vous a envoyé une demande',
  match: 'c’est un match !',
  message: 'vous a envoyé un message',
  system: 'système',
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
    avatar: string | null;
    label: string;
    subText?: string;
  };
}

/**
 * Crée une notification en base avec :
 *  - déduplication (pas plus d'1 notif identique par heure, ex: 50 likes sur le même post)
 *  - émission temps réel WS `notification:new`
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return;

  // Déduplication : même destinataire + acteur + type + cible dans l'heure → skip
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

  const [row] = await db
    .insert(schema.notifications)
    .values({
      userId: input.userId,
      actorId: input.actorId,
      type: input.type,
      action: input.action,
      target: input.target,
      metadata: input.metadata,
    })
    .returning();
  if (!row) return;
  notificationsSentTotal.inc();

  await redis.del(unreadCacheKey(input.userId));

  const dto = await toDto(row);
  if (dto) emitToUser(input.userId, 'notification:new', dto);
}

/** Sérialise une notification avec les infos de l'acteur. */
async function toDto(row: schema.Notification): Promise<NotificationDto | null> {
  const actorId = row.actorId;
  const [actor] = actorId
    ? await db.select({ id: schema.users.id, name: schema.users.name, avatar: schema.users.avatar }).from(schema.users).where(eq(schema.users.id, actorId)).limit(1)
    : [];
  const label = actor ? ACTION_LABEL[row.type] ?? row.action ?? '' : '';

  return {
    id: row.id,
    type: row.type,
    action: row.action,
    target: row.target,
    metadata: row.metadata,
    time: row.createdAt.toISOString(),
    isUnread: row.isUnread,
    user: {
      id: actorId ?? '',
      name: actor?.name ?? 'My Culture Match',
      avatar: actor?.avatar ?? null,
      label,
      subText: row.action === 'accept' ? 'a accepté votre demande' : undefined,
    },
  };
}

/** GET /api/notifications — liste paginée (cursor createdAt). */
export async function listNotifications(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ notifications: NotificationDto[]; nextCursor: string | null }> {
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        cursor ? lt(schema.notifications.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;

  const notifications: NotificationDto[] = [];
  for (const row of page) {
    const dto = await toDto(row);
    if (dto) notifications.push(dto);
  }
  return { notifications, nextCursor };
}

/** PATCH /api/notifications/:id — toggle lu / non-lu (owner only). */
export async function setNotificationRead(userId: string, id: string, isUnread: boolean): Promise<{ success: true }> {
  const [row] = await db
    .select({ userId: schema.notifications.userId })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))
    .limit(1);
  if (!row) throw AppError.notFound('Notification introuvable', 'NOTIFICATION_NOT_FOUND');

  await db.update(schema.notifications).set({ isUnread }).where(eq(schema.notifications.id, id));
  await redis.del(unreadCacheKey(userId));
  return { success: true };
}

/** POST /api/notifications/read-all — marque tout lu. */
export async function markAllRead(userId: string): Promise<{ success: true }> {
  await db.update(schema.notifications).set({ isUnread: false }).where(eq(schema.notifications.userId, userId));
  await redis.del(unreadCacheKey(userId));
  return { success: true };
}

/** GET /api/notifications/unread-count — badge (cache Redis 1min). */
export async function getUnreadCount(userId: string): Promise<number> {
  const cached = await redis.get(unreadCacheKey(userId));
  if (cached !== null) return Number(cached);

  const [row] = await db
    .select({ count: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isUnread, true)));

  const value = row?.count ?? 0;
  await redis.set(unreadCacheKey(userId), String(value), 'EX', UNREAD_CACHE_TTL);
  return value;
}

/** POST /api/notifications/:id/accept | /decline — action utilisateur. */
export async function handleNotificationAction(
  userId: string,
  id: string,
  action: 'accept' | 'decline',
): Promise<{ success: true; effect?: string }> {
  const [row] = await db
    .select()
    .from(schema.notifications)
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))
    .limit(1);
  if (!row) throw AppError.notFound('Notification introuvable', 'NOTIFICATION_NOT_FOUND');

  let effect: string | undefined;

  if (row.type === 'request' && row.actorId) {
    // Demande de connexion : accept/decline la relation sous-jacente
    if (action === 'accept') {
      await acceptRequest(userId, row.actorId);
      effect = 'companion';
    } else {
      await declineRequest(userId, row.actorId);
      effect = 'declined';
    }
  } else if (row.type === 'invite' && row.target) {
    // Invitation tribu
    if (action === 'accept') {
      await joinTribe(row.target, userId);
      effect = 'joined';
    }
  } else if (row.type === 'match' && row.metadata && typeof row.metadata === 'object') {
    const conversationId = (row.metadata as Record<string, unknown>).conversationId;
    if (conversationId && typeof conversationId === 'string') effect = conversationId;
  }

  await db.update(schema.notifications).set({ isUnread: false, action: action ?? row.action }).where(eq(schema.notifications.id, id));
  await redis.del(unreadCacheKey(userId));
  return { success: true, effect };
}
