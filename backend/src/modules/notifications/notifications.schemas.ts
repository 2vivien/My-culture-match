import { z } from 'zod';

/** GET /api/notifications?cursor=&limit= */
export const listNotificationsQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** PATCH /api/notifications/:id → { isUnread } */
export const updateNotificationSchema = z.object({
  isUnread: z.boolean(),
});
