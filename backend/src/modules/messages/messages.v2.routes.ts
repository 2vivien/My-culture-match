import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../auth/require-auth';
import { db } from '../../infrastructure/database';
import { sql } from 'drizzle-orm';
import { AppError } from '../../shared/utils/AppError';
import { emitToUser } from '../../infrastructure/websocket';
import { getMessages, markConversationRead } from './messages.service';
import { isConversationParticipant } from './conversation-access';

const routes = new Hono();
routes.use('*', requireAuth);

const reactionSchema = z.object({ reaction: z.string().trim().min(1).max(32) }).strict();
const editSchema = z.object({ text: z.string().trim().min(1).max(4000) }).strict();
const replySchema = z.object({ text: z.string().trim().min(1).max(4000), replyToId: z.string().min(1) }).strict();
const typingSchema = z.object({ typing: z.boolean() }).strict();
const pinSchema = z.object({ pinned: z.boolean() }).strict();

async function participantIds(conversationId: string) {
  const rows = await db.execute<{ user_id: string }>(sql`SELECT user_id FROM conversation_participants WHERE conversation_id = ${conversationId}`);
  return rows.map((r) => r.user_id);
}

async function assertParticipant(conversationId: string, userId: string) {
  if (!(await isConversationParticipant(conversationId, userId))) throw AppError.forbidden('Vous n’êtes pas participant de cette conversation', 'NOT_A_PARTICIPANT');
}

async function assertMessageInConversation(messageId: string, conversationId: string) {
  const rows = await db.execute(sql`SELECT id FROM messages WHERE id = ${messageId} AND conversation_id = ${conversationId} LIMIT 1`);
  if (rows.length === 0) throw AppError.notFound('Message introuvable', 'MESSAGE_NOT_FOUND');
}

routes.get('/conversations/:id/messages/enhanced', async (c) => {
  const { userId } = c.get('auth');
  const id = c.req.param('id');
  await assertParticipant(id, userId);
  const cursor = c.req.query('cursor') || undefined;
  const limit = Math.min(Number(c.req.query('limit') || 50), 100);
  const base = await getMessages(id, userId, cursor, limit);
  const ids = base.messages.map((m) => m.id);
  const reactions = ids.length
    ? await db.execute(sql`SELECT message_id, user_id, reaction, created_at FROM message_reactions WHERE message_id IN (${sql.join(ids.map((x) => sql`${x}`), sql`, `)}) ORDER BY created_at ASC`)
    : [];
  const replies = ids.length
    ? await db.execute(sql`SELECT m.id, m.reply_to_id, r.text AS reply_text, r.sender_id AS reply_sender_id FROM messages m LEFT JOIN messages r ON r.id = m.reply_to_id WHERE m.id IN (${sql.join(ids.map((x) => sql`${x}`), sql`, `)})`)
    : [];
  const reactionMap = new Map<string, Array<{ userId: string; reaction: string }>>();
  for (const r of reactions as Array<{ message_id: string; user_id: string; reaction: string }>) {
    const list = reactionMap.get(r.message_id) ?? []; list.push({ userId: r.user_id, reaction: r.reaction }); reactionMap.set(r.message_id, list);
  }
  const replyMap = new Map<string, { id: string; text: string | null; senderId: string }>();
  for (const r of replies as Array<{ id: string; reply_to_id: string | null; reply_text: string | null; reply_sender_id: string | null }>) if (r.reply_to_id) replyMap.set(r.id, { id: r.reply_to_id, text: r.reply_text, senderId: r.reply_sender_id ?? '' });
  return c.json({ messages: base.messages.map((m) => ({ ...m, reactions: reactionMap.get(m.id) ?? [], reply: replyMap.get(m.id) ?? null })), nextCursor: base.nextCursor });
});

routes.post('/conversations/:id/messages/:messageId/reactions', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const messageId = c.req.param('messageId');
  await assertParticipant(conversationId, userId); await assertMessageInConversation(messageId, conversationId);
  const { reaction } = reactionSchema.parse(await c.req.json());
  const existing = await db.execute(sql`SELECT 1 FROM message_reactions WHERE message_id=${messageId} AND user_id=${userId} AND reaction=${reaction} LIMIT 1`);
  if (existing.length) await db.execute(sql`DELETE FROM message_reactions WHERE message_id=${messageId} AND user_id=${userId} AND reaction=${reaction}`);
  else await db.execute(sql`INSERT INTO message_reactions(message_id,user_id,reaction) VALUES(${messageId},${userId},${reaction})`);
  for (const id of await participantIds(conversationId)) emitToUser(id, 'message:reaction', { conversationId, messageId, userId, reaction, active: !existing.length });
  return c.json({ active: !existing.length, reaction }, 200);
});

routes.patch('/conversations/:id/messages/:messageId', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const messageId = c.req.param('messageId');
  await assertParticipant(conversationId, userId); const { text } = editSchema.parse(await c.req.json());
  const rows = await db.execute(sql`SELECT sender_id, created_at, deleted_at FROM messages WHERE id=${messageId} AND conversation_id=${conversationId} LIMIT 1`);
  const row = rows[0] as { sender_id: string; created_at: Date; deleted_at: Date | null } | undefined;
  if (!row) throw AppError.notFound('Message introuvable', 'MESSAGE_NOT_FOUND');
  if (row.sender_id !== userId) throw AppError.forbidden('Vous ne pouvez modifier que vos messages', 'MESSAGE_EDIT_FORBIDDEN');
  if (row.deleted_at) throw AppError.badRequest('Message supprimé', 'MESSAGE_DELETED');
  if (Date.now() - new Date(row.created_at).getTime() > 15 * 60 * 1000) throw AppError.forbidden('Un message ne peut être modifié que pendant 15 minutes', 'MESSAGE_EDIT_WINDOW_EXPIRED');
  const updated = await db.execute(sql`UPDATE messages SET text=${text}, edited_at=NOW() WHERE id=${messageId} RETURNING id,text,edited_at`);
  const editedAt = (updated[0] as { edited_at: Date | string | null } | undefined)?.edited_at ?? null;
  for (const id of await participantIds(conversationId)) emitToUser(id, 'message:updated', { conversationId, messageId, text, editedAt });
  return c.json({ id: messageId, text, editedAt });
});

routes.delete('/conversations/:id/messages/:messageId', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const messageId = c.req.param('messageId');
  await assertParticipant(conversationId, userId);
  const rows = await db.execute(sql`SELECT sender_id FROM messages WHERE id=${messageId} AND conversation_id=${conversationId} LIMIT 1`);
  const row = rows[0] as { sender_id: string } | undefined;
  if (!row) throw AppError.notFound('Message introuvable', 'MESSAGE_NOT_FOUND');
  if (row.sender_id !== userId) throw AppError.forbidden('Vous ne pouvez supprimer que vos messages', 'MESSAGE_DELETE_FORBIDDEN');
  await db.execute(sql`UPDATE messages SET deleted_at=NOW(), text='Message supprimé', media_url=NULL, file=NULL WHERE id=${messageId}`);
  for (const id of await participantIds(conversationId)) emitToUser(id, 'message:deleted', { conversationId, messageId });
  return c.json({ success: true });
});

routes.post('/conversations/:id/messages/reply', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const { text, replyToId } = replySchema.parse(await c.req.json());
  await assertParticipant(conversationId, userId); await assertMessageInConversation(replyToId, conversationId);
  const { sendMessage } = await import('./messages.service');
  const message = await sendMessage(conversationId, userId, { type: 'text', text });
  await db.execute(sql`UPDATE messages SET reply_to_id=${replyToId} WHERE id=${message.id}`);
  for (const id of await participantIds(conversationId)) emitToUser(id, 'message:updated', { conversationId, messageId: message.id, replyToId });
  return c.json({ ...message, replyToId }, 201);
});

routes.post('/conversations/:id/typing', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const { typing } = typingSchema.parse(await c.req.json());
  await assertParticipant(conversationId, userId);
  for (const id of await participantIds(conversationId)) if (id !== userId) emitToUser(id, typing ? 'typing:start' : 'typing:stop', { conversationId, userId });
  return c.json({ success: true });
});

routes.post('/conversations/:id/messages/:messageId/pin', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const messageId = c.req.param('messageId');
  await assertParticipant(conversationId, userId); await assertMessageInConversation(messageId, conversationId);
  const { pinned } = pinSchema.parse(await c.req.json());
  if (pinned) await db.execute(sql`INSERT INTO conversation_pins(conversation_id,message_id,pinned_by) VALUES(${conversationId},${messageId},${userId}) ON CONFLICT DO NOTHING`);
  else await db.execute(sql`DELETE FROM conversation_pins WHERE conversation_id=${conversationId} AND message_id=${messageId}`);
  for (const id of await participantIds(conversationId)) emitToUser(id, 'message:pin', { conversationId, messageId, pinned });
  return c.json({ pinned });
});

routes.get('/conversations/:id/pins', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); await assertParticipant(conversationId, userId);
  const rows = await db.execute(sql`SELECT p.message_id AS "messageId", p.pinned_by AS "pinnedBy", p.created_at AS "createdAt", m.text, m.sender_id AS "senderId" FROM conversation_pins p JOIN messages m ON m.id=p.message_id WHERE p.conversation_id=${conversationId} ORDER BY p.created_at DESC`);
  return c.json(rows);
});

routes.post('/conversations/:id/read', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); const result = await markConversationRead(conversationId, userId);
  for (const id of await participantIds(conversationId)) if (id !== userId) emitToUser(id, 'message:read', { conversationId, userId });
  return c.json(result);
});

export { routes as messagesV2Routes };
