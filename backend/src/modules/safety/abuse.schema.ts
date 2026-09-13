import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '../../shared/utils/ids';

export const abuseEvents = pgTable('abuse_events', {
  id: text('id').primaryKey().$defaultFn(generateId),
  actorId: text('actor_id').notNull(),
  conversationId: text('conversation_id'),
  eventType: text('event_type').notNull(),
  risk: text('risk').notNull(),
  reasons: text('reasons').notNull(),
  contentFingerprint: text('content_fingerprint'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('abuse_events_actor_idx').on(t.actorId), index('abuse_events_created_idx').on(t.createdAt), index('abuse_events_risk_idx').on(t.risk)]);
