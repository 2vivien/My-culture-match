import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from '../../shared/utils/ids';

export const consentSettings = pgTable(
  'consent_settings',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').notNull().unique(),
    discoveryVisibility: text('discovery_visibility').notNull().default('everyone'),
    requestVisibility: text('request_visibility').notNull().default('everyone'),
    loveLikeVisibility: text('love_like_visibility').notNull().default('everyone'),
    contactVisibility: text('contact_visibility').notNull().default('companions'),
    profileVisibility: text('profile_visibility').notNull().default('everyone'),
    photosVisibility: text('photos_visibility').notNull().default('everyone'),
    countryVisibility: text('country_visibility').notNull().default('everyone'),
    friendshipEnabled: boolean('friendship_enabled').notNull().default(true),
    loveEnabled: boolean('love_enabled').notNull().default(false),
    loveProposalEnabled: boolean('love_proposal_enabled').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('consent_settings_user_idx').on(t.userId)],
);

export type ConsentVisibility = 'nobody' | 'friends' | 'friends_of_friends' | 'nearby' | 'everyone';

export type ConsentSettings = typeof consentSettings.$inferSelect;
export type ConsentSettingsInsert = typeof consentSettings.$inferInsert;
