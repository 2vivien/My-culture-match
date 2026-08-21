import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { listNotificationsQuerySchema, updateNotificationSchema } from './notifications.schemas';
import {
  getUnreadCount,
  handleNotificationAction,
  listNotifications,
  markAllRead,
  setNotificationRead,
} from './notifications.service';

const notificationsRoutes = new Hono();

notificationsRoutes.use('*', requireAuth);

/** GET /api/notifications?cursor=&limit= — liste paginée (ordre antichronologique). */
notificationsRoutes.get('/notifications', zValidator('query', listNotificationsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const { userId } = c.get('auth');
  const result = await listNotifications(userId, cursor, limit);
  return c.json(result.notifications, 200);
});

/** GET /api/notifications/unread-count — badge. */
notificationsRoutes.get('/notifications/unread-count', async (c) => {
  const { userId } = c.get('auth');
  const unreadCount = await getUnreadCount(userId);
  return c.json({ unreadCount }, 200);
});

/** PATCH /api/notifications/:id — { isUnread } */
notificationsRoutes.patch('/notifications/:id', zValidator('json', updateNotificationSchema), async (c) => {
  const { isUnread } = c.req.valid('json');
  const { userId } = c.get('auth');
  const result = await setNotificationRead(userId, c.req.param('id'), isUnread);
  return c.json(result, 200);
});

/** POST /api/notifications/read-all */
notificationsRoutes.post('/notifications/read-all', async (c) => {
  const { userId } = c.get('auth');
  const result = await markAllRead(userId);
  return c.json(result, 200);
});

/** POST /api/notifications/:id/accept */
notificationsRoutes.post('/notifications/:id/accept', async (c) => {
  const { userId } = c.get('auth');
  const result = await handleNotificationAction(userId, c.req.param('id'), 'accept');
  return c.json(result, 200);
});

/** POST /api/notifications/:id/decline */
notificationsRoutes.post('/notifications/:id/decline', async (c) => {
  const { userId } = c.get('auth');
  const result = await handleNotificationAction(userId, c.req.param('id'), 'decline');
  return c.json(result, 200);
});

export { notificationsRoutes };
