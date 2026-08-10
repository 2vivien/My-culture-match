import { and, desc, eq, inArray, lt, ne, or, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import type { SendMessageInput } from './messages.schemas';
import { emitToUser } from '../../infrastructure/websocket';

const MESSAGE_RATE_LIMIT = 60; // messages / min / user
const messageRateKey = (userId: string) => `rl:messages:${userId}`;

const conversationCacheKey = (id: string) => `conversation:${id}`;
const conversationMessagesKey = (id: string) => `conversation:${id}:messages`;
const unreadTotalKey = (userId: string) => `unread:${userId}`;

export interface ConversationSummary {
  id: string;
  name: string;
  avatar: string | null;
  isGroup: boolean;
  online: boolean;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  participant: { id: string; name: string; avatar: string | null } | null;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: string;
  text: string | null;
  mediaUrl: string | null;
  audioDur: number | null;
  file: { name: string; size: number } | null;
  isRead: boolean;
  createdAt: string;
}

async function isParticipant(conversationId: string, userId: string): Promise<void> {
  const [row] = await db
    .select({ userId: schema.conversationParticipants.userId })
    .from(schema.conversationParticipants)
    .where(
      and(
        eq(schema.conversationParticipants.conversationId, conversationId),
        eq(schema.conversationParticipants.userId, userId),
      ),
    )
    .limit(1);
  if (!row) throw AppError.forbidden('Vous n’êtes pas participant de cette conversation', 'NOT_A_PARTICIPANT');
}

async function isBlocked(a: string, b: string): Promise<boolean> {
  const [row] = await db
    .select({ blockerId: schema.blocks.blockerId })
    .from(schema.blocks)
    .where(
      or(
        and(eq(schema.blocks.blockerId, a), eq(schema.blocks.blockedId, b)),
        and(eq(schema.blocks.blockerId, b), eq(schema.blocks.blockedId, a)),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Création de conversation 1:1 (utilisée par match Love / connexion acceptée). */
export async function createConversationForUsers(a: string, b: string): Promise<{ id: string }> {
  if (a === b) throw AppError.badRequest('Impossible de discuter avec soi-même', 'SELF_CONVERSATION');

  const [conversation] = await db
    .insert(schema.conversations)
    .values({ isGroup: false, name: null, avatar: null, createdById: a })
    .returning({ id: schema.conversations.id });
  if (!conversation) throw AppError.badRequest('Échec de création de la conversation', 'CONVERSATION_CREATE_FAILED');

  await db.insert(schema.conversationParticipants).values([
    { conversationId: conversation.id, userId: a, unreadCount: 0 },
    { conversationId: conversation.id, userId: b, unreadCount: 0 },
  ]);

  await redis.hset(conversationCacheKey(conversation.id), { participants: JSON.stringify([a, b]) });
  return { id: conversation.id };
}

/** POST /api/conversations — création manuelle. */
export async function createConversation(userId: string, participantId: string): Promise<ConversationSummary> {
  if (userId === participantId) throw AppError.badRequest('Impossible de discuter avec soi-même', 'SELF_CONVERSATION');
  if (await isBlocked(userId, participantId)) {
    throw AppError.forbidden('Impossible de démarrer une conversation', 'BLOCKED');
  }

  // Rejoint la conversation 1:1 existante si elle existe déjà
  const existingRows = await db
    .select({ conversationId: schema.conversationParticipants.conversationId })
    .from(schema.conversationParticipants)
    .where(eq(schema.conversationParticipants.userId, userId));
  const candidateIds = existingRows.map((r) => r.conversationId);
  if (candidateIds.length > 0) {
    const [dup] = await db
      .select({ conversationId: schema.conversationParticipants.conversationId })
      .from(schema.conversationParticipants)
      .where(
        and(
          eq(schema.conversationParticipants.userId, participantId),
          inArray(schema.conversationParticipants.conversationId, candidateIds),
        ),
      )
      .limit(1);
    if (dup) {
      return getConversationSummary(dup.conversationId, userId);
    }
  }

  const { id } = await createConversationForUsers(userId, participantId);
  return getConversationSummary(id, userId);
}

async function getConversationSummary(conversationId: string, userId: string): Promise<ConversationSummary> {
  await isParticipant(conversationId, userId);

  const [conversation] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, conversationId))
    .limit(1);
  if (!conversation) throw AppError.notFound('Conversation introuvable', 'CONVERSATION_NOT_FOUND');

  const [me] = await db
    .select({
      unreadCount: schema.conversationParticipants.unreadCount,
      lastReadAt: schema.conversationParticipants.lastReadAt,
    })
    .from(schema.conversationParticipants)
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId)))
    .limit(1);

  const lastMessage = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(desc(schema.messages.createdAt))
    .limit(1);

  const others = await db
    .select({
      userId: schema.conversationParticipants.userId,
      name: schema.users.name,
      avatar: schema.users.avatar,
    })
    .from(schema.conversationParticipants)
    .innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId))
    .where(
      and(
        eq(schema.conversationParticipants.conversationId, conversationId),
        ne(schema.conversationParticipants.userId, userId),
      ),
    );

  const other = others[0] ? { id: others[0].userId, name: others[0].name, avatar: others[0].avatar } : null;
  const online = other ? await isUserOnline(other.id) : false;

  return {
    id: conversationId,
    name: conversation.name ?? other?.name ?? 'Conversation',
    avatar: conversation.avatar ?? other?.avatar ?? null,
    isGroup: conversation.isGroup,
    online,
    lastMessage: lastMessage[0]?.text ?? null,
    lastMessageAt: lastMessage[0]?.createdAt.toISOString() ?? conversation.lastMessageAt.toISOString(),
    unreadCount: me?.unreadCount ?? 0,
    participant: other,
  };
}

async function isUserOnline(userId: string): Promise<boolean> {
  const cached = await redis.get(`presence:${userId}`);
  return cached === 'online';
}

/** GET /api/conversations — liste. */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const rows = await db
    .select({ conversationId: schema.conversationParticipants.conversationId })
    .from(schema.conversationParticipants)
    .where(eq(schema.conversationParticipants.userId, userId))
    .orderBy(desc(schema.conversations.lastMessageAt))
    .innerJoin(schema.conversations, eq(schema.conversations.id, schema.conversationParticipants.conversationId));

  const summaries: ConversationSummary[] = [];
  for (const row of rows) {
    summaries.push(await getConversationSummary(row.conversationId, userId));
  }
  return summaries.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

/** GET /api/conversations/:id/messages — historique paginé (cursor). */
export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<{ messages: ChatMessageDto[]; nextCursor: string | null }> {
  await isParticipant(conversationId, userId);

  const query = db
    .select({
      id: schema.messages.id,
      conversationId: schema.messages.conversationId,
      senderId: schema.messages.senderId,
      senderName: schema.users.name,
      type: schema.messages.type,
      text: schema.messages.text,
      mediaUrl: schema.messages.mediaUrl,
      audioDur: schema.messages.audioDur,
      file: schema.messages.file,
      isRead: schema.messages.isRead,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .innerJoin(schema.users, eq(schema.users.id, schema.messages.senderId))
    .where(
      and(
        eq(schema.messages.conversationId, conversationId),
        cursor ? lt(schema.messages.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(schema.messages.createdAt))
    .limit(limit + 1);

  const rows = await query;
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
  return {
    messages: page.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.senderName,
      type: m.type,
      text: m.text,
      mediaUrl: m.mediaUrl,
      audioDur: m.audioDur,
      file: (m.file as { name: string; size: number } | null) ?? null,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    })),
    nextCursor,
  };
}

/** POST /api/conversations/:id/messages — envoi + WS + compteurs. */
export async function sendMessage(
  conversationId: string,
  userId: string,
  input: SendMessageInput,
): Promise<ChatMessageDto> {
  await isParticipant(conversationId, userId);

  // Rate limit 60 msg/min
  const count = await redis.incr(messageRateKey(userId));
  if (count === 1) await redis.expire(messageRateKey(userId), 60);
  if (count > MESSAGE_RATE_LIMIT) {
    throw AppError.tooMany('Limite de messages atteinte (60/min)', 'MESSAGE_RATE_LIMITED');
  }

  const participants = await db
    .select({ userId: schema.conversationParticipants.userId })
    .from(schema.conversationParticipants)
    .where(eq(schema.conversationParticipants.conversationId, conversationId));

  const [message] = await db
    .insert(schema.messages)
    .values({
      conversationId,
      senderId: userId,
      type: input.type,
      text: input.text,
      mediaUrl: input.mediaUrl ?? null,
      audioDur: input.audioDur ?? null,
      file: input.file ?? null,
    })
    .returning();

  if (!message) throw AppError.badRequest('Échec d’envoi du message', 'MESSAGE_SEND_FAILED');

  // unreadCount pour tous les autres participants + total Redis
  const others = participants.filter((p) => p.userId !== userId);
  if (others.length > 0) {
    const otherIds = others.map((p) => p.userId);
    await db
      .update(schema.conversationParticipants)
      .set({ unreadCount: sql`${schema.conversationParticipants.unreadCount} + 1` })
      .where(
        and(
          eq(schema.conversationParticipants.conversationId, conversationId),
          inArray(schema.conversationParticipants.userId, otherIds),
        ),
      );
    for (const o of otherIds) {
      await redis.incr(unreadTotalKey(o));
      emitToUser(o, 'message:new', { conversationId, message: serializeMessage(message) });
    }
  }

  await db.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, conversationId));
  await redis.lpush(conversationMessagesKey(conversationId), JSON.stringify(message));
  await redis.ltrim(conversationMessagesKey(conversationId), 0, 49);

  const [senderNameRow] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return serializeMessage(message, senderNameRow?.name ?? '');
}

function serializeMessage(
  message: schema.Message,
  senderName = '',
): ChatMessageDto {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName,
    type: message.type,
    text: message.text,
    mediaUrl: message.mediaUrl,
    audioDur: message.audioDur,
    file: (message.file as { name: string; size: number } | null) ?? null,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  };
}

/** POST /api/conversations/:id/read — marquer lu (reset unread). */
export async function markConversationRead(conversationId: string, userId: string): Promise<{ success: true }> {
  await isParticipant(conversationId, userId);

  const [me] = await db
    .select({ unreadCount: schema.conversationParticipants.unreadCount })
    .from(schema.conversationParticipants)
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId)))
    .limit(1);

  await db
    .update(schema.conversationParticipants)
    .set({ unreadCount: 0, lastReadAt: new Date() })
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId)));

  if ((me?.unreadCount ?? 0) > 0) {
    const delta = me?.unreadCount ?? 0;
    await redis.decrby(unreadTotalKey(userId), delta);
  }

  await db
    .update(schema.messages)
    .set({ isRead: true })
    .where(and(eq(schema.messages.conversationId, conversationId), ne(schema.messages.senderId, userId)));

  return { success: true };
}

/** POST /api/messages/:id/notifications — toggle cloche (par conversation). */
export async function toggleConversationNotifications(conversationId: string, userId: string): Promise<{ notificationsEnabled: boolean }> {
  await isParticipant(conversationId, userId);

  const [row] = await db
    .select({ notificationsEnabled: schema.conversationParticipants.notificationsEnabled })
    .from(schema.conversationParticipants)
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId)))
    .limit(1);

  const next = !(row?.notificationsEnabled ?? true);
  await db
    .update(schema.conversationParticipants)
    .set({ notificationsEnabled: next })
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId)));

  return { notificationsEnabled: next };
}

/** GET /api/notifications/unread-count → total non-lus (messages + notifications). */
export async function getUnreadTotal(userId: string): Promise<number> {
  const cached = await redis.get(unreadTotalKey(userId));
  if (cached !== null) return Number(cached);
  return 0;
}
