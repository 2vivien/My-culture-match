import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { createConversationSchema, listConversationsQuerySchema, listMessagesQuerySchema, sendMessageSchema } from './messages.schemas';
import { withIdempotency, idempotencyKeyFrom } from '../../shared/utils/idempotency';
import { createConversation, getMessages, getUnreadTotal, listConversations, markConversationRead, sendMessage, toggleConversationNotifications } from './messages.service';
import { canContact } from '../consent/consent.service';
import { AppError } from '../../shared/utils/AppError';

const messagesRoutes = new Hono();
messagesRoutes.use('*', requireAuth);

messagesRoutes.post('/conversations', zValidator('json', createConversationSchema), async (c) => {
  const { participantId } = c.req.valid('json');
  const { userId } = c.get('auth');
  if (!(await canContact(userId, participantId))) throw AppError.forbidden('Cette personne n’accepte pas les nouveaux contacts dans ses préférences de consentement', 'CONTACT_CONSENT_REQUIRED');
  return c.json(await createConversation(userId, participantId), 201);
});

messagesRoutes.get('/conversations', zValidator('query', listConversationsQuerySchema), async (c) => { const { limit } = c.req.valid('query'); const { userId } = c.get('auth'); return c.json((await listConversations(userId)).slice(0, limit), 200); });
messagesRoutes.get('/conversations/:id/messages', zValidator('query', listMessagesQuerySchema), async (c) => { const { cursor, limit } = c.req.valid('query'); const { userId } = c.get('auth'); const result = await getMessages(c.req.param('id'), userId, cursor, limit); return c.json(result, 200); });
messagesRoutes.post('/conversations/:id/messages', zValidator('json', sendMessageSchema), async (c) => { const payload = c.req.valid('json'); const { userId } = c.get('auth'); const message = await withIdempotency(`messages:send:${userId}:${c.req.param('id')}`, idempotencyKeyFrom(c), () => sendMessage(c.req.param('id'), userId, payload)); return c.json(message, 201); });
messagesRoutes.post('/conversations/:id/read', async (c) => { const { userId } = c.get('auth'); return c.json(await markConversationRead(c.req.param('id'), userId), 200); });
messagesRoutes.get('/messages', async (c) => { const { userId } = c.get('auth'); return c.json(await listConversations(userId), 200); });
messagesRoutes.post('/messages/:id/notifications', async (c) => { const { userId } = c.get('auth'); return c.json(await toggleConversationNotifications(c.req.param('id'), userId), 200); });
messagesRoutes.get('/messages/unread-count', async (c) => { const { userId } = c.get('auth'); return c.json({ unreadCount: await getUnreadTotal(userId) }, 200); });

export { messagesRoutes };
