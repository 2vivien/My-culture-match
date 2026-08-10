import { db, schema } from '../../infrastructure/database';
import type { NOTIFICATION_TYPE } from '../../shared/constants/enums';

type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export interface CreateNotificationInput {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  action?: string | null;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Crée une notification en base (fanout complet en MP11). */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!input.actorId || input.actorId === input.userId) return;
  await db.insert(schema.notifications).values({
    userId: input.userId,
    actorId: input.actorId,
    type: input.type,
    action: input.action,
    target: input.target,
    metadata: input.metadata,
  });
}
