import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { emitToUser } from '../../infrastructure/websocket';
import { createNotification } from '../notifications/notifications.service';
import { isConversationParticipant } from '../messages/conversation-access';
import { generateId } from '../../shared/utils/ids';

export type TemporalMessageType = 'text' | 'image' | 'voice' | 'file';

export interface ScheduleTemporalMessageInput {
  conversationId: string;
  senderId: string;
  text?: string | null;
  type?: TemporalMessageType;
  mediaUrl?: string | null;
  audioDur?: number | null;
  file?: Record<string, unknown> | null;
  revealAt: Date;
}

export interface TemporalMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  type: TemporalMessageType;
  text: string | null;
  mediaUrl: string | null;
  audioDur: number | null;
  file: Record<string, unknown> | null;
  revealAt: string;
  revealedAt: string | null;
  createdAt: string;
  status: 'pending' | 'revealed' | 'cancelled';
}

async function assertTwoPersonConversation(conversationId: string, userId: string): Promise<string> {
  if (!(await isConversationParticipant(conversationId, userId))) {
    throw AppError.forbidden('Vous n’êtes pas participant de cette conversation', 'NOT_A_PARTICIPANT');
  }
  const participants = await db
    .select({ userId: schema.conversationParticipants.userId })
    .from(schema.conversationParticipants)
    .where(eq(schema.conversationParticipants.conversationId, conversationId));
  if (participants.length !== 2) {
    throw AppError.badRequest('Les messages temporels sont disponibles uniquement dans une conversation à deux', 'TEMPORAL_TWO_PERSON_ONLY');
  }
  const recipient = participants.find((p) => p.userId !== userId)?.userId;
  if (!recipient) throw AppError.badRequest('Destinataire introuvable', 'TEMPORAL_RECIPIENT_NOT_FOUND');
  return recipient;
}

function serialize(row: Record<string, unknown>): TemporalMessageDto {
  const revealAt = new Date(String(row.reveal_at));
  const revealedAt = row.revealed_at ? new Date(String(row.revealed_at)).toISOString() : null;
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderId: String(row.sender_id),
    recipientId: String(row.recipient_id),
    type: String(row.type) as TemporalMessageType,
    text: row.text == null ? null : String(row.text),
    mediaUrl: row.media_url == null ? null : String(row.media_url),
    audioDur: row.audio_dur == null ? null : Number(row.audio_dur),
    file: (row.file as Record<string, unknown> | null) ?? null,
    revealAt: revealAt.toISOString(),
    revealedAt,
    createdAt: new Date(String(row.created_at)).toISOString(),
    status: row.cancelled_at ? 'cancelled' : row.revealed_at ? 'revealed' : 'pending',
  };
}

export async function scheduleTemporalMessage(input: ScheduleTemporalMessageInput): Promise<TemporalMessageDto> {
  const recipientId = await assertTwoPersonConversation(input.conversationId, input.senderId);
  const now = Date.now();
  const revealAt = input.revealAt.getTime();
  if (!Number.isFinite(revealAt) || revealAt <= now + 30_000) {
    throw AppError.badRequest('La révélation doit être programmée dans le futur', 'TEMPORAL_INVALID_DATE');
  }
  if (revealAt > now + 10 * 365 * 24 * 60 * 60 * 1000) {
    throw AppError.badRequest('La date de révélation ne peut pas dépasser 10 ans', 'TEMPORAL_DATE_TOO_FAR');
  }
  if (!input.text?.trim() && !input.mediaUrl && !input.file) {
    throw AppError.badRequest('Écris un message ou ajoute un média', 'TEMPORAL_EMPTY');
  }

  const id = generateId();
  const rows = await db.execute(sql`
    INSERT INTO temporal_messages
      (id, conversation_id, sender_id, recipient_id, type, text, media_url, audio_dur, file, reveal_at)
    VALUES
      (${id}, ${input.conversationId}, ${input.senderId}, ${recipientId}, ${input.type ?? 'text'}, ${input.text?.trim() || null}, ${input.mediaUrl ?? null}, ${input.audioDur ?? null}, ${input.file ? JSON.stringify(input.file) : null}::jsonb, ${input.revealAt})
    RETURNING *
  `);
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) throw AppError.badRequest('Impossible de créer le message temporel', 'TEMPORAL_CREATE_FAILED');

  await createNotification({
    userId: recipientId,
    actorId: input.senderId,
    type: 'system',
    action: 'temporal_pending',
    target: id,
    metadata: { kind: 'temporal_message', temporalMessageId: id, conversationId: input.conversationId, revealAt: input.revealAt.toISOString(), locked: true },
  });

  emitToUser(recipientId, 'temporal-message:scheduled', {
    conversationId: input.conversationId,
    temporalMessageId: id,
    revealAt: input.revealAt.toISOString(),
    locked: true,
  });

  return serialize(row);
}

export async function listTemporalMessages(conversationId: string, userId: string): Promise<{ sent: TemporalMessageDto[]; lockedCount: number }> {
  await assertTwoPersonConversation(conversationId, userId);
  const sentRows = await db.execute(sql`
    SELECT * FROM temporal_messages
    WHERE conversation_id = ${conversationId} AND sender_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `);
  const lockedRows = await db.execute(sql`
    SELECT COUNT(*)::int AS count FROM temporal_messages
    WHERE conversation_id = ${conversationId}
      AND recipient_id = ${userId}
      AND revealed_at IS NULL
      AND cancelled_at IS NULL
      AND reveal_at > NOW()
  `);
  return {
    sent: (sentRows as unknown as Array<Record<string, unknown>>).map(serialize),
    lockedCount: Number((lockedRows[0] as { count?: number } | undefined)?.count ?? 0),
  };
}

export async function cancelTemporalMessage(conversationId: string, userId: string, temporalMessageId: string): Promise<{ success: true }> {
  await assertTwoPersonConversation(conversationId, userId);
  const result = await db.execute(sql`
    UPDATE temporal_messages
    SET cancelled_at = NOW()
    WHERE id = ${temporalMessageId}
      AND conversation_id = ${conversationId}
      AND sender_id = ${userId}
      AND revealed_at IS NULL
      AND cancelled_at IS NULL
    RETURNING id
  `);
  if (result.length === 0) throw AppError.notFound('Message temporel introuvable ou déjà révélé', 'TEMPORAL_NOT_FOUND');
  return { success: true };
}

export async function revealDueTemporalMessages(limit = 50): Promise<number> {
  const due = await db.execute(sql`
    SELECT * FROM temporal_messages
    WHERE reveal_at <= NOW()
      AND revealed_at IS NULL
      AND cancelled_at IS NULL
      AND (processing_at IS NULL OR processing_at < NOW() - INTERVAL '10 minutes')
    ORDER BY reveal_at ASC
    LIMIT ${limit}
  `);
  let revealed = 0;

  for (const raw of due as unknown as Array<Record<string, unknown>>) {
    const id = String(raw.id);
    const claimed = await db.execute(sql`
      UPDATE temporal_messages
      SET processing_at = NOW()
      WHERE id = ${id}
        AND revealed_at IS NULL
        AND cancelled_at IS NULL
        AND (processing_at IS NULL OR processing_at < NOW() - INTERVAL '10 minutes')
      RETURNING *
    `);
    const row = claimed[0] as Record<string, unknown> | undefined;
    if (!row) continue;

    try {
      const [message] = await db
        .insert(schema.messages)
        .values({
          conversationId: String(row.conversation_id),
          senderId: String(row.sender_id),
          type: String(row.type) as 'text' | 'image' | 'voice' | 'file',
          text: row.text == null ? null : String(row.text),
          mediaUrl: row.media_url == null ? null : String(row.media_url),
          audioDur: row.audio_dur == null ? null : Number(row.audio_dur),
          file: (row.file as Record<string, unknown> | null) ?? null,
        })
        .returning();
      if (!message) throw new Error('MESSAGE_REVEAL_INSERT_FAILED');

      await db.execute(sql`
        UPDATE temporal_messages
        SET revealed_at = NOW(), revealed_message_id = ${message.id}, processing_at = NULL
        WHERE id = ${id}
      `);

      const recipientId = String(row.recipient_id);
      await db.update(schema.conversationParticipants)
        .set({ unreadCount: sql`${schema.conversationParticipants.unreadCount} + 1` })
        .where(and(eq(schema.conversationParticipants.conversationId, String(row.conversation_id)), eq(schema.conversationParticipants.userId, recipientId)));
      await db.update(schema.conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(schema.conversations.id, String(row.conversation_id)));

      emitToUser(recipientId, 'message:new', {
        conversationId: String(row.conversation_id),
        message: { ...message, createdAt: message.createdAt.toISOString() },
        temporal: { temporalMessageId: id, revealedAt: new Date().toISOString() },
      });
      await createNotification({
        userId: recipientId,
        actorId: String(row.sender_id),
        type: 'system',
        action: 'temporal_revealed',
        target: String(row.conversation_id),
        metadata: { kind: 'temporal_message_revealed', temporalMessageId: id, conversationId: String(row.conversation_id) },
      });
      emitToUser(String(row.sender_id), 'temporal-message:revealed', { conversationId: String(row.conversation_id), temporalMessageId: id, messageId: message.id });
      revealed += 1;
    } catch (error) {
      await db.execute(sql`UPDATE temporal_messages SET processing_at = NULL WHERE id = ${id} AND revealed_at IS NULL`);
      throw error;
    }
  }
  return revealed;
}
