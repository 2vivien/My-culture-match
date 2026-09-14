import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';

export type SharedMemoryKind = 'note' | 'photo' | 'video' | 'audio' | 'event' | 'place' | 'milestone' | 'conversation' | 'memory' | 'custom';

async function participants(conversationId: string, userId: string) {
  const rows = await db.execute(sql`SELECT user_id AS "userId" FROM conversation_participants WHERE conversation_id = ${conversationId}`) as unknown as Array<{ userId: string }>;
  const ids = rows.map((r) => r.userId);
  if (!ids.includes(userId)) throw AppError.forbidden('Vous n’êtes pas participant de cette conversation', 'NOT_A_PARTICIPANT');
  return ids;
}

async function relationshipType(conversationId: string): Promise<'love' | 'friendship'> {
  const rows = await db.execute(sql`SELECT EXISTS(SELECT 1 FROM love_matches WHERE conversation_id = ${conversationId} AND is_mutual = true) AS "isLove"`) as unknown as Array<{ isLove: boolean }>;
  return rows[0]?.isLove ? 'love' : 'friendship';
}

export async function listSharedMemories(conversationId: string, userId: string) {
  await participants(conversationId, userId);
  return await db.execute(sql`
    SELECT id, conversation_id, relationship_type, author_user_id, updated_by_user_id,
           kind, title, body, media_urls, message_ids, metadata, event_date, created_at, updated_at
    FROM relationship_capsules
    WHERE conversation_id = ${conversationId}
    ORDER BY event_date DESC, created_at DESC
  `) as unknown as Array<Record<string, unknown>>;
}

export async function createSharedMemory(input: {
  conversationId: string; userId: string; kind?: SharedMemoryKind; title?: string; body?: string;
  mediaUrls?: string[]; messageIds?: string[]; eventDate?: string; metadata?: Record<string, unknown>;
}) {
  await participants(input.conversationId, input.userId);
  const type = await relationshipType(input.conversationId);
  if (!input.title?.trim() && !input.body?.trim() && !(input.mediaUrls?.length) && !(input.messageIds?.length)) {
    throw AppError.badRequest('Un souvenir doit contenir une note, un média ou un message', 'EMPTY_MEMORY');
  }
  const id = randomUUID();
  await db.execute(sql`
    INSERT INTO relationship_capsules
      (id, conversation_id, relationship_type, author_user_id, updated_by_user_id, kind, title, body, media_urls, message_ids, metadata, event_date)
    VALUES
      (${id}, ${input.conversationId}, ${type}, ${input.userId}, ${input.userId}, ${input.kind ?? 'memory'}, ${input.title?.trim() || null}, ${input.body?.trim() || null}, ${JSON.stringify(input.mediaUrls ?? [])}, ${JSON.stringify(input.messageIds ?? [])}, ${JSON.stringify(input.metadata ?? {})}, ${input.eventDate ? new Date(input.eventDate) : new Date()})
  `);
  return { id, relationshipType: type };
}

export async function updateSharedMemory(input: {
  conversationId: string; userId: string; memoryId: string; kind?: SharedMemoryKind; title?: string | null; body?: string | null;
  mediaUrls?: string[]; messageIds?: string[]; eventDate?: string; metadata?: Record<string, unknown>;
}) {
  await participants(input.conversationId, input.userId);
  const existing = await db.execute(sql`SELECT id FROM relationship_capsules WHERE id = ${input.memoryId} AND conversation_id = ${input.conversationId}`) as unknown as Array<{ id: string }>;
  if (!existing[0]) throw AppError.notFound('Souvenir introuvable', 'MEMORY_NOT_FOUND');
  await db.execute(sql`
    UPDATE relationship_capsules SET
      kind = COALESCE(${input.kind ?? null}, kind),
      title = ${input.title === undefined ? null : input.title?.trim() || null},
      body = ${input.body === undefined ? null : input.body?.trim() || null},
      media_urls = ${input.mediaUrls === undefined ? sql`media_urls` : JSON.stringify(input.mediaUrls)},
      message_ids = ${input.messageIds === undefined ? sql`message_ids` : JSON.stringify(input.messageIds)},
      metadata = ${input.metadata === undefined ? sql`metadata` : JSON.stringify(input.metadata)},
      event_date = ${input.eventDate ? new Date(input.eventDate) : sql`event_date`},
      updated_by_user_id = ${input.userId}, updated_at = now()
    WHERE id = ${input.memoryId} AND conversation_id = ${input.conversationId}
  `);
  return { id: input.memoryId };
}

export async function deleteSharedMemory(conversationId: string, userId: string, memoryId: string) {
  await participants(conversationId, userId);
  const result = await db.execute(sql`DELETE FROM relationship_capsules WHERE id = ${memoryId} AND conversation_id = ${conversationId} RETURNING id`) as unknown as Array<{ id: string }>;
  if (!result[0]) throw AppError.notFound('Souvenir introuvable', 'MEMORY_NOT_FOUND');
  return { id: memoryId, deleted: true };
}
