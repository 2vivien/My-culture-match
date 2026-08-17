import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import {
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  sendMessageSchema,
} from './messages.schemas';
import { withIdempotency, idempotencyKeyFrom } from '../../shared/utils/idempotency';
import {
  createConversation,
  getMessages,
  getUnreadTotal,
  listConversations,
  markConversationRead,
  sendMessage,
  toggleConversationNotifications,
} from './messages.service';

const messagesRoutes = new Hono();

messagesRoutes.use('*', requireAuth);

/** POST /api/conversations — créer (ou rejoindre) une conversation 1:1. */
messagesRoutes.post('/conversations', zValidator('json', createConversationSchema), async (c) => {
  const { participantId } = c.req.valid('json');
  const { userId } = c.get('auth');
  const conversation = await createConversation(userId, participantId);
  return c.json(conversation, 201);
});

/** GET /api/conversations — liste des conversations. */
messagesRoutes.get('/conversations', zValidator('query', listConversationsQuerySchema), async (c) => {
  const { limit } = c.req.valid('query');
  const { userId } = c.get('auth');
  const conversations = await listConversations(userId);
  return c.json(conversations.slice(0, limit), 200);
});

/** GET /api/conversations/:id/messages — historique paginé. */
messagesRoutes.get('/conversations/:id/messages', zValidator('query', listMessagesQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const { userId } = c.get('auth');
  const { messages, nextCursor } = await getMessages(c.req.param('id'), userId, cursor, limit);
  return c.json({ messages, nextCursor }, 200);
});

/** POST /api/conversations/:id/messages — envoi (idempotent). */
messagesRoutes.post('/conversations/:id/messages', zValidator('json', sendMessageSchema), async (c) => {
  const payload = c.req.valid('json');
  const { userId } = c.get('auth');
  const message = await withIdempotency(
    `messages:send:${userId}:${c.req.param('id')}`,
    idempotencyKeyFrom(c),
    () => sendMessage(c.req.param('id'), userId, payload),
  );
  return c.json(message, 201);
});

/** POST /api/conversations/:id/read — marquer lu. */
messagesRoutes.post('/conversations/:id/read', async (c) => {
  const { userId } = c.get('auth');
  const result = await markConversationRead(c.req.param('id'), userId);
  return c.json(result, 200);
});

/** GET /api/messages — alias liste des conversations. */
messagesRoutes.get('/messages', async (c) => {
  const { userId } = c.get('auth');
  const conversations = await listConversations(userId);
  return c.json(conversations, 200);
});

/** POST /api/messages/:id/notifications — toggle cloche. */
messagesRoutes.post('/messages/:id/notifications', async (c) => {
  const { userId } = c.get('auth');
  const result = await toggleConversationNotifications(c.req.param('id'), userId);
  return c.json(result, 200);
});

/** GET /api/messages/unread-count — total non-lus. */
messagesRoutes.get('/messages/unread-count', async (c) => {
  const { userId } = c.get('auth');
  const count = await getUnreadTotal(userId);
  return c.json({ unreadCount: count }, 200);
});

export { messagesRoutes };
