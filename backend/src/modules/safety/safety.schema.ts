import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { generateId } from '../../shared/utils/ids';

export const userMutes = pgTable('user_mutes', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').notNull(),
  mutedUserId: text('muted_user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('user_mutes_pair_idx').on(t.userId, t.mutedUserId), index('user_mutes_user_idx').on(t.userId)]);

export const moderationActions = pgTable('moderation_actions', {
  id: text('id').primaryKey().$defaultFn(generateId),
  targetUserId: text('target_user_id').notNull(),
  moderatorId: text('moderator_id'),
  action: text('action').notNull(),
  reason: text('reason').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('moderation_actions_target_idx').on(t.targetUserId), index('moderation_actions_created_idx').on(t.createdAt)]);

export const moderationAppeals = pgTable('moderation_appeals', {
  id: text('id').primaryKey().$defaultFn(generateId),
  userId: text('user_id').notNull(),
  moderationActionId: text('moderation_action_id').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'),
  reviewerId: text('reviewer_id'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (t) => [index('moderation_appeals_user_idx').on(t.userId), index('moderation_appeals_status_idx').on(t.status)]);

export const mediaModeration = pgTable('media_moderation', {
  id: text('id').primaryKey().$defaultFn(generateId),
  ownerId: text('owner_id').notNull(),
  mediaUrl: text('media_url').notNull(),
  status: text('status').notNull().default('pending'),
  provider: text('provider'),
  score: text('score'),
  reason: text('reason'),
  reviewedBy: text('reviewed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
}, (t) => [index('media_moderation_owner_idx').on(t.ownerId), index('media_moderation_status_idx').on(t.status)]);
