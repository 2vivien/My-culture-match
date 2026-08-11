# Base de données — Schéma

> Défini dans `src/infrastructure/database/schema.ts` (Drizzle ORM, PostgreSQL 16).
> Tous les IDs sont des **UUID v7** (triables chronologiquement, compatibles sharding).

## Tables

### Identité & Auth
- **users** — email normalisé, username unique, name, gender, birthdate, roots (country/region/ethnicity/village), langues, intention, glow, xp, level, `failedLoginAttempts`, `lockedUntil`, `twoFactorSecret`, `acceptedTermsAt`.
- **sessions** — sauvegarde PG des sessions (`id`, `userId`, `token`, `expiresAt`).
- **user_oauth_accounts** — comptes Google/Apple (`provider`, `providerAccountId`, `email`).

### Profil & Préférences
- **user_profile_vectors** — vecteur Culture Engine (`userId`, `embedding` JSONB, `embeddingVersion`).
- **post_profile_vectors** — vecteur d'un post (`postId`, `embedding`, `embeddingVersion`).
- **user_settings** — settings : `theme`, `language`, notifications, `locationType`, flags 2FA/oauth.
- **follows** — abonnements (`followerId`, `followingId`).
- **blocks** — blocages (`blockerId`, `blockedId`) — filtrage global.

### Communauté
- **tribes** — `name`, `tag` (uniques), `description`, `topic`, avatar/banner, compteurs.
- **tribe_members** — membership avec `role` (`member|moderator|owner`).
- **tribe_rules** — règles (ordre = `position`).
- **tribe_moderators** — modérateurs (relation explicite).

### Contenu
- **posts** — type (`Text|Images|Link`), title/body, `mediaUrl`, `linkUrl`, `tribeId`, `status` (`published|flagged|deleted`), compteurs.
- **post_likes** — `UNIQUE(postId, userId)`.
- **post_votes** — votes tribu (`UNIQUE(postId, userId)`, valeur +1/-1).
- **comments** — `parentId` (1 niveau max), `status`, `text`.
- **saves** — signets `UNIQUE(postId, userId)`.
- **shares** — partages `UNIQUE(postId, userId)`.
- **stories** — `expiresAt` (24h), `type` (`image|video`), vues.
- **story_views** — `(viewerId, storyId, viewedAt)`.

### Social
- **connections** — statut `suggestion|interested|request|companion|blocked`, `matchScore`, `synergyScore`.
- **love_matches** — swipes `like|pass`, `isMutual`, `conversationId`.
- **conversations** + **conversation_participants** — chats (auto-créés au match).
- **messages** — `type` (`text|image|voice|file`), `audioDur`, `deletedAt` (soft delete).
- **notifications** — type (`comment|like|invite|request|match|message|system`), `action`, `isRead`, `actionRequired`.
- **reports** — signalements (`status: open|reviewed|dismissed|actioned`, `reason`, `moderatorId`).
- **audit_logs** — journal des actions admin/modération.

### Culture Engine
- **health_metrics** — métriques de santé de la plateforme (L01-L12, calcul nightly).

## Relations (Drizzle)

`usersRelations`, `postsRelations`, `conversationsRelations`, `messagesRelations` définissent les
relations typées pour le query builder.

## Enum

`connection_status`, `post_type`, `glow`, `swipe_action`, `notification_type`, `tribe_role`,
`story_type`, `message_type`, `report_status`, `post_status`.
