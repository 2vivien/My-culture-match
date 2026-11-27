import { pgEnum, pgTable, text, timestamp, boolean, integer, jsonb, uniqueIndex, index, primaryKey, doublePrecision, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from '../../shared/utils/ids';

// ── Enums ──────────────────────────────────────────────────
export const connectionStatusEnum = pgEnum('connection_status', ['suggestion', 'interested', 'request', 'companion', 'blocked']);
export const postTypeEnum = pgEnum('post_type', ['Text', 'Images', 'Link', 'Repost']);
export const glowEnum = pgEnum('glow', ['turquoise', 'violet', 'amber', 'emerald', 'orange', 'red', 'blue', 'none']);
export const swipeActionEnum = pgEnum('swipe_action', ['like', 'pass']);
export const notificationTypeEnum = pgEnum('notification_type', ['comment', 'like', 'invite', 'request', 'match', 'message', 'system']);
export const tribeRoleEnum = pgEnum('tribe_role', ['member', 'moderator', 'owner']);
export const storyTypeEnum = pgEnum('story_type', ['image', 'video']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'voice', 'file']);
export const reportStatusEnum = pgEnum('report_status', ['open', 'reviewed', 'dismissed', 'actioned']);
export const postStatusEnum = pgEnum('post_status', ['published', 'flagged', 'deleted']);

// ── Users ──────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name').notNull(),
    username: text('username').notNull(),
    avatar: text('avatar'),
    banner: text('banner'),
    avatarSeed: text('avatar_seed'),
    locale: text('locale').notNull().default('fr'),
    gender: text('gender'),
    seeking: text('seeking'),
    birthdate: timestamp('birthdate', { withTimezone: true }),
    age: integer('age'),
    level: integer('level').notNull().default(1),
    glow: glowEnum('glow').notNull().default('none'),
    location: text('location'),
    country: text('country'),
    region: text('region'),
    ethnicity: text('ethnicity'),
    village: text('village'),
    // ── Géolocalisation (Friends Proximity, style Snap Map) ──
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    locationSharingEnabled: boolean('location_sharing_enabled').notNull().default(false),
    locationUpdatedAt: timestamp('location_updated_at', { withTimezone: true }),
    bio: text('bio'),
    roots: jsonb('roots'),
    occupation: jsonb('occupation'),
    values: jsonb('values').$type<string[]>(),
    languages: jsonb('languages').$type<string[]>(),
    intention: text('intention'),
    preference: text('preference'),
    diaspora: text('diaspora'),
    familyQuiz: text('family_quiz'),
    situation: text('situation'),
    criteria: jsonb('criteria').$type<string[]>(),
    traditionsCount: integer('traditions_count').notNull().default(0),
    culturesCount: integer('cultures_count').notNull().default(0),
    tribesCount: integer('tribes_count').notNull().default(0),
    interestedCount: integer('interested_count').notNull().default(0),
    companionsCount: integer('companions_count').notNull().default(0),
    xp: integer('xp').notNull().default(0),
    // ── Auth ──
    twoFactorSecret: text('two_factor_secret'),
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    // ── Onboarding ──
    acceptedTermsAt: timestamp('accepted_terms_at', { withTimezone: true }),
    profileCompleted: boolean('profile_completed').notNull().default(false),
    // ── Admin & Modération ──
    role: text('role').notNull().default('user'), // 'user' | 'admin' | 'superadmin'
    bannedAt: timestamp('banned_at', { withTimezone: true }),
    banReason: text('ban_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    uniqueIndex('users_username_idx').on(t.username),
    index('users_location_idx').on(t.location),
  ],
);

// ── Sessions Better Auth ───────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

// ── Comptes OAuth (Google / Apple) ─────────────────────────
export const userOAuthAccounts = pgTable(
  'user_oauth_accounts',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // 'google' | 'apple'
    providerAccountId: text('provider_account_id').notNull(),
    email: text('email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_oauth_provider_account_idx').on(t.provider, t.providerAccountId),
    index('user_oauth_user_idx').on(t.userId),
  ],
);

// ── Vecteur de profil (Culture Engine) ─────────────────────
export const userProfileVectors = pgTable('user_profile_vectors', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  vector: jsonb('vector').$type<Record<string, number>>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const postProfileVectors = pgTable('post_profile_vectors', {
  postId: text('post_id')
    .primaryKey()
    .references(() => posts.id, { onDelete: 'cascade' }),
  vector: jsonb('vector').$type<Record<string, number>>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email'),
  gender: text('gender'),
  locationType: text('location_type').notNull().default('approximate'),
  googleConnected: boolean('google_connected').notNull().default(false),
  appleConnected: boolean('apple_connected').notNull().default(false),
  twoFactor: boolean('two_factor').notNull().default(false),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('fr'),
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Follows / Blocks ───────────────────────────────────────
export const follows = pgTable(
  'follows',
  {
    followerId: text('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: text('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index('follows_following_idx').on(t.followingId),
  ],
);

export const blocks = pgTable(
  'blocks',
  {
    blockerId: text('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: text('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

// ── Tribus ─────────────────────────────────────────────────
export const tribes = pgTable(
  'tribes',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    name: text('name').notNull(),
    tag: text('tag'),
    topic: text('topic'),
    visitors: integer('visitors').notNull().default(0),
    desc: text('desc'),
    avatar: text('avatar'),
    banner: text('banner'),
    glow: glowEnum('glow').notNull().default('none'),
    createdById: text('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    memberCount: integer('member_count').notNull().default(0),
    /** 'public' (défaut) ou 'private' : contenu réservé aux membres, adhésion sur demande. */
    visibility: text('visibility').notNull().default('public'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('tribes_topic_idx').on(t.topic),
    uniqueIndex('tribes_name_unique_idx').on(t.name),
    uniqueIndex('tribes_tag_unique_idx').on(t.tag),
  ],
);

export const tribeFlairs = pgTable(
  'tribe_flairs',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    tribeId: text('tribe_id')
      .notNull()
      .references(() => tribes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#E27D60'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tribe_flairs_tribe_idx').on(t.tribeId)],
);

export const tribeJoinRequests = pgTable(
  'tribe_join_requests',
  {
    tribeId: text('tribe_id')
      .notNull()
      .references(() => tribes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tribeId, t.userId] }), index('tribe_join_requests_tribe_idx').on(t.tribeId, t.createdAt)],
);

export const tribeMembers = pgTable(
  'tribe_members',
  {
    tribeId: text('tribe_id')
      .notNull()
      .references(() => tribes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: tribeRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.tribeId, t.userId] }),
    index('tribe_members_user_idx').on(t.userId),
  ],
);

export const tribeRules = pgTable('tribe_rules', {
  id: text('id').primaryKey().$defaultFn(generateId),
  tribeId: text('tribe_id')
    .notNull()
    .references(() => tribes.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  desc: text('desc'),
});

export const tribeModerators = pgTable('tribe_moderators', {
  id: text('id').primaryKey().$defaultFn(generateId),
  tribeId: text('tribe_id')
    .notNull()
    .references(() => tribes.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
});

// ── Posts / Traditions ─────────────────────────────────────
export const posts = pgTable(
  'posts',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tribeId: text('tribe_id').references(() => tribes.id, { onDelete: 'set null' }),
    flairId: text('flair_id'),
    type: postTypeEnum('type').notNull().default('Text'),
    title: text('title'),
    text: text('text'),
    body: text('body'),
    image: text('image'),
    mediaUrls: jsonb('media_url').$type<string[]>().notNull().default([]),
    linkUrl: text('link_url'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    status: postStatusEnum('status').notNull().default('published'),
    score: integer('score').notNull().default(0),
    pinned: boolean('pinned').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    likes: integer('likes').notNull().default(0),
    comments: integer('comments').notNull().default(0),
    views: integer('views').notNull().default(0),
    saves: integer('saves').notNull().default(0),
    shares: integer('shares').notNull().default(0),
    /** Repost : référence du post original partagé dans une tribu. */
    originalPostId: text('original_post_id').references((): AnyPgColumn => posts.id, { onDelete: 'set null' }),
    originalAuthorId: text('original_author_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('posts_author_idx').on(t.authorId),
    index('posts_tribe_idx').on(t.tribeId),
    index('posts_created_idx').on(t.createdAt),
    index('posts_status_idx').on(t.status),
  ],
);

export const postVotes = pgTable(
  'post_votes',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const postLikes = pgTable(
  'post_likes',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references((): AnyPgColumn => comments.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    status: postStatusEnum('status').notNull().default('published'),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comments_post_idx').on(t.postId)],
);

export const saves = pgTable(
  'saves',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const shares = pgTable(
  'shares',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

// ── Stories ────────────────────────────────────────────────
export const stories = pgTable(
  'stories',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: storyTypeEnum('type').notNull().default('image'),
    url: text('url').notNull(),
    caption: text('caption'),
    viewers: integer('viewers').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('stories_user_idx').on(t.userId), index('stories_expiry_idx').on(t.expiresAt)],
);

// ── Connections (suggestions → interested → request → companion) ──
export const connections = pgTable(
  'connections',
  {
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: connectionStatusEnum('status').notNull().default('suggestion'),
    matchScore: integer('match_score').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.fromUserId, t.toUserId] }),
    index('connections_to_idx').on(t.toUserId, t.status),
  ],
);

// ── Love / Matching ────────────────────────────────────────
export const loveMatches = pgTable(
  'love_matches',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    matchScore: integer('match_score').notNull().default(0),
    action: swipeActionEnum('action').notNull(),
    isMutual: boolean('is_mutual').notNull().default(false),
    conversationId: text('conversation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('love_matches_user_candidate_uidx').on(t.userId, t.candidateId),
    index('love_matches_user_idx').on(t.userId),
    index('love_matches_candidate_idx').on(t.candidateId),
  ],
);

// ── Chat / Messagerie ──────────────────────────────────────
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().$defaultFn(generateId),
  name: text('name'),
  avatar: text('avatar'),
  culture: text('culture'),
  isGroup: boolean('is_group').notNull().default(false),
  createdById: text('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unreadCount: integer('unread_count').notNull().default(0),
    notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index('conversation_participants_user_idx').on(t.userId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: messageTypeEnum('type').notNull().default('text'),
    text: text('text'),
    mediaUrl: text('media_url'),
    audioDur: integer('audio_dur'),
    file: jsonb('file'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_convo_idx').on(t.conversationId, t.createdAt)],
);

// ── Notifications ──────────────────────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    type: notificationTypeEnum('type').notNull(),
    action: text('action'),
    target: text('target'),
    metadata: jsonb('metadata'),
    isUnread: boolean('is_unread').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId, t.isUnread),
    index('notifications_created_idx').on(t.createdAt),
  ],
);

// ── Reports / Modération ───────────────────────────────────
export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    reason: text('reason'),
    description: text('description'),
    status: reportStatusEnum('status').notNull().default('open'),
    moderatorId: text('moderator_id').references(() => users.id),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [index('reports_status_idx').on(t.status)],
);

// ── Audit logs ─────────────────────────────────────────────
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_user_idx').on(t.userId, t.createdAt),
    index('audit_logs_action_idx').on(t.action),
  ],
);

// ── Health metrics (Culture Engine, auto-évaluation L11) ──
export const healthMetrics = pgTable(
  'health_metrics',
  {
    id: text('id').primaryKey().$defaultFn(generateId),
    metric: text('metric').notNull(),
    value: doublePrecision('value').notNull(),
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    day: text('day').notNull(), // 'YYYY-MM-DD'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('health_metrics_metric_day_idx').on(t.metric, t.day)],
);

// ── Relations Drizzle ──────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  follows: many(follows),
  tribeMembers: many(tribeMembers),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  tribe: one(tribes, { fields: [posts.tribeId], references: [tribes.id] }),
  comments: many(comments),
  likes: many(postLikes),
  saves: many(saves),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// ── Types exportés ─────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Story = typeof stories.$inferSelect;
