# Flux de données

## Auth (OTP)

```
POST /api/auth/send-otp { email }
  → valide email (Zod) + rate limit (3/h/email, 10/h/IP)
  → génère code 6 chiffres → Redis `otp:{email}` (TTL 5 min)
  → enqueue email (BullMQ `email`, template i18n)
  → { success, cooldown }

POST /api/auth/verify-otp { email, code }
  → 3 tentatives max → Redis INCR `otp:{email}:attempts`
  → JWT signé (jose) + session Redis `session:{token}` (TTL 7j)
  → { token, user, isNewUser }

POST /api/auth/google|apple { idToken }
  → vérification signature → upsert user → session → { token, user, isNewUser }

POST /api/auth/logout → blacklist session Redis
GET  /api/auth/session → user (ou 401)
```

## Onboarding

```
POST /api/onboarding (Bearer)
  → validation Zod stricte (âge ≥ 18, username unique, enums…)
  → user + user_settings + user_profile_vectors (init)
  → événement → Meilisearch + email de bienvenue
```

## Publication d'un post (fanout)

```
POST /api/posts
  → validation (type Images/Link/Text, modération, tags)
  → INSERT posts (PG)
  → INCR post:counters (Redis)
  → enqueue: feed.fanout → search.index → post.embedding → moderation.scan
  → GET /api/feed?filter=following
       → ZREVRANGE feed:following:{userId} (Redis) → hydrate posts → nextCursor
```

## Match Love mutuel

```
POST /api/love/swipe { userId, action }
  → aime déjà ? → un match → TRANSACTION :
    1. INSERT love_matches (isMutual)
    2. INSERT conversations + conversation_participants
    3. INSERT connections (companion)
    4. INSERT notifications (A et B)
    5. WS event love:match (emitToUser)
    6. métrique matches_created_total
```

## Messagerie temps réel

```
WS message:send { conversationId, text }
  → vérifie participation → INSERT messages (PG)
  → INCR unread:{participant} (Redis)
  → emit message:new aux participants de la room
  → métrique messages_sent_total
REST POST /api/conversations/:id/messages → même service (persistance + WS)
```

## Notification

```
Interactions (like/comment/request/match) → createNotification()
  → INSERT notifications (PG, déduplication/groupement)
  → WS emit notification:new (emitToUser)
  → invalidate cache unread → métrique notifications_sent_total
```

## Upload média

```
POST /api/uploads/request { filename, contentType, size }
  → whitelist MIME + tailles max + sanitization nom
  → presigned URL MinIO (PUT, TTL 5 min) → { presignedUrl, fileUrl }
Client → PUT MinIO direct (jamais via l'API)
POST /api/uploads/complete → enqueue media.process (Sharp/FFmpeg)
```
