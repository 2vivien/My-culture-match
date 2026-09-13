import { boolean, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from '../../infrastructure/database/schema';

export const locationVisibility = ['nobody', 'friends', 'friends_of_friends', 'nearby', 'everyone'] as const;
export type LocationVisibility = (typeof locationVisibility)[number];

export const locationPrecision = ['approximate', 'area'] as const;
export type LocationPrecision = (typeof locationPrecision)[number];

/** Privacy policy for People Nearby. One row per user, created lazily. */
export const userLocationSettings = pgTable(
  'user_location_settings',
  {
    userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    visibility: text('visibility').notNull().default('nearby'),
    precision: text('precision').notNull().default('approximate'),
    ghostMode: boolean('ghost_mode').notNull().default(false),
    showDistance: boolean('show_distance').notNull().default(true),
    showActiveStatus: boolean('show_active_status').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('user_location_settings_visibility_idx').on(t.visibility)],
);
