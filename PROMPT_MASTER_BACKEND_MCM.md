# 🤖 PROMPT MASTER — BACKEND MY CULTURE MATCH
> **Pour Kimi (ou LLM équivalent)** — Création complète du backend d'un réseau social interculturel scalable à 1 milliard d'utilisateurs.
> **Statut :** EXÉCUTION OBLIGATOIRE. Aucun choix laissé au modèle sans justification technique. Tu dois installer, configurer, coder, tester et documenter.

---

## 🎯 RÔLE ET MISSION

Tu es **Staff Engineer / Principal Backend Architect** de My Culture Match. Tu ne codes pas "quelques endpoints". Tu construis une **plateforme backend complète**, modulaire, observable, testable et scalable.

**Règle d'or :** Simple quand c'est suffisant. Robuste quand c'est nécessaire. Scalable quand c'est justifié.

**Contrainte absolue :** Le frontend existe déjà (100% REST). Tu dois implémenter **chaque endpoint** documenté dans l'audit fonctionnel. Aucun endpoint mocké. Aucune donnée fake en production.

---

## 📚 CONTEXTE PRODUIT

My Culture Match est un réseau social interculturel avec :
- **Feed** social (Following / For You / Popular / New) avec fanout
- **Traditions** (posts culturels texte/image/lien)
- **Tribus** (communautés culturelles type subreddit avec règles, modérateurs)
- **Connexions** (suggestions → intérêts → demandes → compagnons)
- **Love** (matching amoureux avec score de compatibilité calculé)
- **Totem** (profil complet avec niveau/XP)
- **Stories** éphémères 24h
- **Messagerie temps réel** (texte, notes vocales, fichiers)
- **Notifications** in-app + email
- **Recherche** globale (users, posts, tribus)
- **Onboarding** en 7 étapes (Zod validé)
- **Culture Engine** : algorithme de feed/matching basé sur anthropologie, psychologie, émotions, linguistique, stoïcisme

---

## 🛠 STACK TECHNIQUE OBLIGATOIRE

Tu DOIS utiliser EXACTEMENT cette stack. Pas de remplacement sans justification technique écrite.

| Couche | Technologie | Pourquoi |
|--------|-------------|----------|
| **Runtime** | Node.js 20+ LTS | Stable, ecosystem mature |
| **Framework API** | Hono (REST) | TypeScript-first, léger, edge-compatible, WebSocket natif |
| **ORM** | Drizzle ORM | TypeScript-first, SQL pur, zero runtime magic, edge-compatible |
| **Database** | Neon PostgreSQL (serverless) | Autoscale, branches par env, pooler intégré, read replicas |
| **Cache / PubSub** | Redis | Cache, sessions, compteurs atomiques, présence, PubSub WS |
| **Queue** | BullMQ (Redis) | Jobs async : fanout, médias, indexation, compteurs, emails |
| **Auth** | Better Auth | Self-hosted, email+OTP, OAuth Google/Apple, sessions, 2FA, RBAC |
| **Validation** | Zod | DTOs REST, schémas partageables avec front |
| **Search** | Meilisearch | Full-text instantané, typo-tolerance, filtres facettés |
| **Storage** | MinIO (S3-compatible) | Self-hosted, presigned URLs, images/vidéos/audio |
| **CDN** | Cloudflare | Cache global, Polish images, DDoS, DNS |
| **Media Processing** | Sharp (images) + FFmpeg (vidéo/audio) | Redimensionnement, compression, transcodage |
| **Email** | Brevo | OTP, transactionnels, templates multi-langue |
| **Anti-bot** | Arcjet | Détection bots, rate limiting avancé, emails jetables |
| **Docs API** | Scalar (OpenAPI) | Documentation interactive REST |
| **i18n** | i18next | FR (défaut), EN, ES |
| **Monitoring** | Sentry (erreurs) + Better Stack (logs) + Grafana/Prometheus (métriques) |
| **Tests** | Vitest (unit) + Supertest (intégration) + Playwright (E2E) + k6 (charge) |
| **CI/CD** | GitHub Actions | lint → test → build → migrate → deploy |

**Retiré / Interdit :** GraphQL, Prisma, RabbitMQ (pour l'instant), Stripe (pas de monétisation V1).

---

## 🏗 ARCHITECTURE DES DOSSIERS

```
backend/
├── src/
│   ├── modules/                    # Un dossier par domaine métier
│   │   ├── auth/                   # Better Auth + OTP + OAuth + sessions
│   │   ├── users/                  # Profils, onboarding, settings, totem
│   │   ├── feed/                   # Feed engine + fanout + Culture Engine scoring
│   │   ├── posts/                  # Traditions, likes, comments, shares, saves
│   │   ├── tribes/                 # Tribus, règles, modérateurs, membership
│   │   ├── connections/            # Suggestions, demandes, compagnons, blocage
│   │   ├── love/                   # Matching amoureux, swipe, score compatibilité
│   │   ├── messages/               # Conversations, messages temps réel
│   │   ├── notifications/          # In-app + push + email
│   │   ├── search/                 # Meilisearch indexation + queries
│   │   ├── stories/                # Stories éphémères 24h
│   │   ├── uploads/                # Presigned URLs, traitement média
│   │   ├── moderation/             # Signalements, auto-modération (Hive/OpenAI)
│   │   └── admin/                  # Panel admin (modération humaine)
│   ├── shared/
│   │   ├── types/                  # Types TypeScript partagés
│   │   ├── schemas/                # Zod schemas (partageable avec front)
│   │   ├── constants/              # Enums, constantes
│   │   └── utils/                  # Helpers purs
│   ├── infrastructure/
│   │   ├── database/               # Drizzle config, migrations, connection
│   │   ├── redis/                  # Redis client, feature store
│   │   ├── meilisearch/            # Meilisearch client, index config
│   │   ├── minio/                  # MinIO client, presigned URLs
│   │   ├── bullmq/                 # Queues, workers, schedulers
│   │   ├── websocket/              # Socket.io + Redis adapter
│   │   ├── email/                  # Brevo client, templates
│   │   ├── monitoring/             # Sentry, Prometheus metrics
│   │   └── security/               # Arcjet, rate limiting, helmet
│   ├── culture-engine/             # MODULE ALGORITHME (isolé)
│   │   ├── principles/             # 120+ principes plug-in
│   │   ├── scoring/                # Feed, Love, Friendship scoring
│   │   ├── embeddings/             # Vecteurs culturels/émotionnels
│   │   ├── health/                 # Métriques de conscience (L01-L12)
│   │   └── learning/               # Boucle d'apprentissage online/batch
│   ├── events/                     # Event bus interne
│   ├── workers/                    # BullMQ workers
│   ├── config/                     # Variables d'environnement
│   └── app.ts                      # Entry point Hono
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
├── drizzle/                        # Migrations Drizzle
├── docker-compose.yml              # Local dev stack
├── .env.example
└── docs/
    ├── architecture/
    ├── api/
    ├── database/
    ├── security/
    ├── algorithms/
    └── decisions/                  # ADRs
```

---

## 🗄 BASE DE DONNÉES — RÈGLES STRICTES

### Identifiants
- **UUID v7** pour TOUTES les tables (triables chronologiquement, compatibilité sharding futur)
- Jamais d'IDs auto-incrément exposés publiquement

### Tables principales (à créer avec Drizzle)

```
users
├── id (uuid v7, PK)
├── email (unique, normalized)
├── username (unique, regex [a-zA-Z0-9._], ≥3)
├── name
├── avatar, avatarSeed
├── gender, seeking
├── birthdate (age ≥ 18 bloquant)
├── locale (fr|en|es)
├── level, glow, xp
├── location { country, region, city }
├── roots { country, region, ethnicity, village }
├── languages[]
├── intention, diaspora, situation
├── occupation { domain, title }
├── values[], criteria[], preference
├── familyQuiz, bio
├── settings JSONB
├── createdAt, updatedAt, deletedAt (soft delete)

user_auth (Better Auth gère, mais à lier)
├── userId → users.id
├── emailVerified, googleId, appleId
├── passwordHash, twoFactorSecret
├── lastLoginAt, failedLoginAttempts, lockedUntil

user_sessions (Redis primaire, backup PG)
├── id, userId, token, expiresAt, revokedAt, ip, userAgent

user_blocks
├── blockerId, blockedId, createdAt
├── UNIQUE(blockerId, blockedId)

user_follows
├── followerId, followingId, createdAt

posts / traditions
├── id (uuid v7), authorId, type (TEXT|IMAGES|LINK)
├── title, body, mediaUrl[], linkUrl
├── tribeId, tags[]
├── likesCount, commentsCount, viewsCount, savesCount, sharesCount
├── status (draft|published|archived|deleted)
├── createdAt, updatedAt

post_likes, post_comments, post_saves, post_shares
├── id, postId, userId, createdAt

post_comment_likes (optionnel)

tribes
├── id, name, tag, description, topic, avatar, banner
├── glow, visitorsCount, membersCount
├── createdById, createdAt, updatedAt

tribe_memberships
├── tribeId, userId, role (member|moderator|admin), joinedAt

tribe_rules
├── id, tribeId, number, title, description

tribe_posts (posts dans une tribu)
├── postId, tribeId, upvotesCount, isPinned

tribe_post_votes
├── postId, userId, vote (up|down)

stories
├── id, userId, mediaUrl, createdAt, expiresAt (24h)

conversations
├── id, type (direct|group), name?, avatar?, createdAt

conversation_participants
├── conversationId, userId, joinedAt, lastReadAt, unreadCount

messages
├── id, conversationId, senderId
├── type (text|image|audio|file)
├── content, mediaUrl, audioDur, fileName, fileSize
├── replyToId?, editedAt, deletedAt
├── createdAt

connections
├── id, fromId, toId, status (suggestion|interested|requested|companion|blocked)
├── matchScore, synergyScore, createdAt, updatedAt

love_matches / love_swipes
├── userId, targetId, action (like|pass), createdAt
├── isMatch (mutuel), matchedAt, conversationId

notifications
├── id, userId, type (comment|like|invite|request|match|message|system)
├── actorId?, entityType, entityId
├── title, body, metadata JSONB
├── isRead, readAt, createdAt

user_profile_vectors (Culture Engine)
├── userId, embedding vector(768), dimensions JSONB
├── updatedAt

post_vectors
├── postId, embedding vector(768), emotions JSONB, virtues JSONB
├── updatedAt

principle_weights
├── version, principleId, weight, activeFrom, activeTo

feedback_events
├── id, userId, eventType, entityType, entityId, value, context JSONB, createdAt

health_metrics (L01-L12)
├── date, metricId, value, threshold, alertTriggered

reports
├── id, reporterId, reportedId, entityType, entityId
├── reason, status (pending|reviewed|actioned|dismissed), moderatorId, createdAt

settings
├── userId, email, gender, locationType
├── googleConnected, appleConnected, twoFactor
├── theme, language, notifications JSONB
```

### Index stratégiques (obligatoires)
- `users` : idx(email), idx(username), idx(createdAt), idx(level), GIN(roots), GIN(languages)
- `posts` : idx(authorId, createdAt), idx(tribeId, createdAt), idx(status, createdAt), GIN(tags)
- `post_likes` : UNIQUE(postId, userId), idx(userId)
- `connections` : idx(fromId, status), idx(toId, status), UNIQUE(fromId, toId)
- `messages` : idx(conversationId, createdAt), idx(senderId)
- `notifications` : idx(userId, isRead, createdAt)
- `stories` : idx(userId, expiresAt)

### Partitionnement (à prévoir dès le schéma pour tables chaudes)
- `messages` : par mois ou par conversation_hash
- `notifications` : par userId (hash) ou par mois
- `posts` : par mois (après 1M+ posts)
- `feedback_events` : par mois

---

## 🔐 SÉCURITÉ — CHECKLIST OBLIGATOIRE

Pour CHAQUE endpoint et CHAQUE fonctionnalité, tu DOIS implémenter :

### Auth & Sessions
- [ ] Better Auth : email+password, OTP (6 chiffres, 5min), OAuth Google/Apple
- [ ] Sessions en Redis (TTL 7j), révocables, blacklist au logout
- [ ] Rotation de session après login
- [ ] 2FA TOTP (optionnel mais prêt)
- [ ] RBAC : user | moderator | admin | superadmin

### Rate Limiting (Arcjet + Redis)
- [ ] Login : 5 tentatives / 15min / IP → lock 30min
- [ ] OTP : 3 envois / heure / email
- [ ] Register : 3 / heure / IP
- [ ] Password reset : 3 / heure / email
- [ ] API générale : 100 req/min / user, 1000 / IP
- [ ] Upload : 10 / heure / user
- [ ] Commentaires : 30 / min / user
- [ ] Likes : 100 / min / user
- [ ] Messages : 60 / min / user
- [ ] Recherche : 30 / min / user

### Protection spécifique
- [ ] Arcjet : détection bots IA, emails jetables, brute force
- [ ] Zod validation stricte sur TOUS les endpoints
- [ ] Normalisation email (lowercase, trim)
- [ ] Username unique avec contrainte DB (race condition safe)
- [ ] Âge ≥ 18 vérifié côté serveur (pas seulement front)
- [ ] Upload : validation MIME, taille max (image 10MB, vidéo 100MB), scan antivirus si possible
- [ ] Presigned URL MinIO : TTL courte (5min), content-type fixé
- [ ] Blocage utilisateur : effet global (feed, chat, explore, connexions) via middleware
- [ ] Énumération de comptes : réponse uniforme ("identifiants invalides")
- [ ] SQL Injection : impossible avec Drizzle, mais vérifier les raw queries
- [ ] XSS : pas de HTML brut stocké sans sanitization
- [ ] CSRF : cookies SameSite=Strict, Secure, HttpOnly
- [ ] Secrets : jamais hardcodés, toujours via env vars

### Audit
- [ ] Audit trail pour : changement rôle, suppression, modif sécurité, action admin
- [ ] Logs structurés avec requestId, correlationId
- [ ] Pas de données sensibles dans les logs

---

## ⚡ PERFORMANCE & SCALABILITÉ

### Cache Redis (obligatoire)
| Clé | TTL | Contenu |
|-----|-----|---------|
| `user:{id}` | 1h | Profil public |
| `user:{id}:stats` | 5min | Compteurs (posts, followers, etc.) |
| `feed:following:{userId}` | 10min | Timeline ZSET (postId → timestamp) |
| `feed:foryou:{userId}` | 15min | Résultat algo For You |
| `post:{id}` | 30min | Détail post + compteurs |
| `tribe:{id}` | 30min | Détail tribu |
| `conversations:{userId}` | 5min | Liste conversations |
| `notifications:unread:{userId}` | 1min | Compteur badge |
| `session:{token}` | 7j | Session Better Auth |
| `rate:{endpoint}:{userId}` | variable | Rate limiting |
| `presence:{userId}` | 5min | Online/offline/typing |

### Compteurs (Write-heavy optimization)
- Likes, vues, plays : **INCR Redis** → flush batch vers PostgreSQL toutes les 5min (BullMQ worker)
- Évite les `UPDATE` synchrones sur le primaire Neon

### Feed Architecture (FANOUT PUSH)
```
Auteur publie
  → INSERT post (PG)
  → BullMQ job "feed.fanout"
    → Pour chaque follower : ZADD feed:following:{followerId} timestamp postId
    → Si follower > 10K : PAS de fanout (mode PULL pour celebrities)
  → BullMQ job "search.index" (Meilisearch)
  → BullMQ job "notifications.fanout"
  → BullMQ job "media.process" (si média)
```
- Lecture feed : `ZREVRANGE feed:following:{userId} 0 50` → fetch posts batch depuis Redis/PG
- Feed "For You" : généré à la demande, cache 15min, régénération BullMQ

### Messages (Temps réel)
- WebSocket socket.io + Redis adapter (multi-node)
- Messages persistés en PG, diffusés via WS
- Read receipts et typing via Redis (TTL court)
- Notes vocales/fichiers : upload MinIO → URL dans message

### Search (Meilisearch)
- Indexation async via BullMQ sur CREATE/UPDATE/DELETE
- Entités : users, posts, tribes, messages
- Filtres : type, tribu, pays, catégorie culturelle
- Typo-tolerance, ranking custom boosté par CultureResonance

---

## 🧠 CULTURE ENGINE — MODULE ALGORITHME

Tu dois implémenter un module `culture-engine/` isolé avec :

### 1. Registre de principes (plugin system)
Chaque principe = fonction pure `(user, item, context) → { score, violations[] }`
- P-ANT (anthropologie) : Hofstede, Hall, Schwartz, racines
- P-PSY (psychologie) : Big Five, attachement, besoins
- P-EMO (émotions) : Plutchik, valence/arousal
- P-LIN (linguistique) : ton, champs lexicaux, hashtags
- P-STO (stoïcisme) : 4 vertus, dichotomie contrôle
- P-ETH (éthique) : 12 lois fondatrices (L01-L12)
- P-ENG (engagement) : prédiction like/comment/share
- P-ALG (système) : Thompson sampling, versionnage

### 2. Formules de scoring

**Feed Score :**
```
score(post, user) =
  w1·EngagementPred
+ w2·SocialAffinity
+ w3·InterestMatch
+ w4·CultureResonance
+ w5·Freshness
+ w6·DiversityBoost (min 30% hors-bulle)
+ w7·QualityEthics
- w8·AddictionPenalty
· SafetyFilter (L03-L04)
+ ε·exploration
```

**Love Compatibility :**
```
compat(A,B) =
  0.30·ValueAlignment (Schwartz + Hofstede)
+ 0.20·PsychologyCompat (Big Five + attachement)
+ 0.15·EmotionalMatch (Plutchik)
+ 0.10·CulturalRoots (racines, tribus, langues)
+ 0.10·Proximity (géo, mobilité)
+ 0.10·InterestOverlap
+ 0.05·Chemistry (appris par feedback swipe/conversation)
```

**Friendship Synergy :**
```
synergy(A,B) =
  Réciprocité + Densité + Tribus partagées
+ Valeurs alignées + Potentiel croissance
- Toxicité (signalements, one-sidedness)
```

### 3. Boucle d'apprentissage
- **Online** (temps réel) : poids chemistry, réactions immédiates (Redis)
- **Batch** (nuit, BullMQ) : ré-entraînement modèles, recalcul embeddings
- **Versionnage** : chaque version de poids numérotée, canary 1% → rollout/rollback
- **Health metrics** : diversité_session ≥30%, équilibre_émotionnel, addiction_index, toxicité_rate

### 4. Intégration
- `GET /api/feed` → appelle culture-engine pour tri final
- `GET /api/love/matches` → génère matchScore
- `GET /api/connections/suggestions` → génère synergyScore
- Embeddings pré-calculés au moment de la publication (BullMQ)

---

## 📡 API CONTRACT — ENDPOINTS OBLIGATOIRES

Tu dois implémenter EXACTEMENT ces endpoints (méthode + route). Le frontend les appelle déjà.

### Auth & Onboarding
```
POST /api/auth/send-otp          { email }
POST /api/auth/verify-otp        { email, code }
POST /api/auth/google            { idToken }
POST /api/auth/apple             { idToken }
POST /api/auth/logout
POST /api/onboarding             { OnboardingData + email + acceptedTermsAt }
GET  /api/users/me
GET  /api/users/:id
PATCH /api/users/me              { Partial<ProfileDetails> }
```

### Feed & Posts
```
GET  /api/feed?filter=following|for-you&sort=best|popular|new&culture=...&cursor=...
GET  /api/posts/:id
POST /api/posts                  { title, body, type, mediaUrl[], tribeId, tags[] }
POST /api/posts/:id/like         (toggle)
POST /api/posts/:id/comments     { text, parentId? }
POST /api/posts/:id/share
POST /api/posts/:id/save         (toggle)
DELETE /api/posts/:id/save
```

### Traditions & Uploads
```
POST /api/traditions             { TraditionSubmission }
GET  /api/tribes                 (sélecteur TribeOption[])
POST /api/uploads/request        { filename, contentType, size }
  → { presignedUrl, fileUrl }
```

### Tribus
```
GET  /api/tribes/:id
POST /api/tribes                 { TribeSubmission }
PATCH /api/tribes/:id
DELETE /api/tribes/:id
POST /api/tribes/:id/join
DELETE /api/tribes/:id/leave
GET  /api/tribes/:id/posts
GET  /api/tribes/:id/rules
GET  /api/tribes/:id/moderators
POST /api/tribes/:id/posts       (poster dans tribu)
POST /api/tribu/posts/:id/upvote (toggle)
```

### Explore & Love
```
GET  /api/explore/tribes
GET  /api/explore/companions
GET  /api/explore/images
GET  /api/explore/videos
GET  /api/love/matches
GET  /api/love/matches/:id
POST /api/love/swipe             { userId, action: like|pass }
POST /api/users/:id/match
```

### Connexions
```
GET  /api/connections/suggestions
GET  /api/connections/interested
GET  /api/connections/requests
GET  /api/connections/companions
POST /api/connections/:userId/request
POST /api/requests/:id/accept
POST /api/requests/:id/decline
POST /api/requests/:id/block
DELETE /api/connections/:userId
```

### Messages & Chat
```
GET  /api/messages               (liste panneau)
POST /api/messages/:id/notifications (toggle)
GET  /api/conversations
GET  /api/conversations/:id/messages?cursor=...
POST /api/conversations/:id/messages { text, type, mediaUrl?, file?, audioDur? }
POST /api/conversations/:id/read
POST /api/conversations          (création auto au match)
```

### Notifications
```
GET  /api/notifications?cursor=...
PATCH /api/notifications/:id     { isUnread }
POST /api/notifications/read-all
POST /api/notifications/:id/accept
POST /api/notifications/:id/decline
GET  /api/notifications/unread-count
```

### Stories & Search
```
GET  /api/stories
POST /api/stories                { mediaUrl }
GET  /api/search?q=...&type=users|posts|tribes&limit=...
```

### Settings
```
GET  /api/settings
PUT  /api/settings               { Partial<UserSettings> }
```

### Admin (protégé)
```
GET  /api/admin/reports          (modération)
POST /api/admin/reports/:id/action
GET  /api/admin/users
POST /api/admin/users/:id/ban
POST /api/admin/users/:id/unban
```

---

## 📋 RÈGLES MÉTIER TRANSVERSES (à implémenter partout)

1. **Âge ≥ 18** : vérifié serveur au onboarding et recalculé. Rejet si < 18.
2. **Username unique** : contrainte DB + vérification préalable. Format `[a-zA-Z0-9._]` ≥ 3 caractères.
3. **Match Love mutuel** : deux `like` réciproques → création conversation automatique + notification + ajout compagnons.
4. **Blocage global** : un blocage filtre l'utilisateur de TOUS les flux (feed, explore, chat, connexions, notifications).
5. **Soft delete** : utilisateurs, posts, tribus → `deletedAt` jamais suppression physique immédiate.
6. **Stories 24h** : `expiresAt = createdAt + 24h`. Cron BullMQ pour purge.
7. **Feed Following** : fanout push Redis ZSET. Si auteur > 10K followers → mode pull.
8. **Compteurs** : Redis INCR atomique → flush batch PG toutes les 5min.
9. **Notifications** : déduplication (pas 50 notifs pour 50 likes sur le même post), regroupement.
10. **Présence** : online/typing via Redis TTL 5min, heartbeat WS toutes les 30sec.
11. **Auto-reply chat** : templates multi-langue stockées en DB, déclenchées si conversation inactive 24h.
12. **Modération** : tout contenu signalé → file modération. Auto-modération IA (Hive/OpenAI) sur texte + image dès le JOUR 1.
13. **Diversité feed** : minimum 30% de contenu hors bulle par session (Culture Engine).
14. **Réversibilité** : unfollow, unblock, unmatch toujours possibles.
15. **RGPD** : droit à l'explication algo, export données, suppression compte complète.

---

## 🔄 FILES D'ATTENTE BULLMQ (Workers à implémenter)

```yaml
queues:
  feed.fanout:
    trigger: post créé
    job: ZADD feed:following:{followerId} pour chaque follower
    concurrency: 10
    retry: 3, backoff exponential

  search.index:
    trigger: post/user/tribe créé/modifié/supprimé
    job: index/delete dans Meilisearch

  media.process:
    trigger: upload terminé
    job: Sharp (resize/compress) ou FFmpeg (transcode/thumbnail)
    output: remplace fichier original par version optimisée

  notifications.fanout:
    trigger: like, comment, match, request
    job: INSERT notification + Redis PUBLISH + WS emit

  counters.flush:
    trigger: cron toutes les 5min
    job: batch UPDATE posts SET likesCount=..., viewsCount=... FROM Redis counters

  email.send:
    trigger: événement métier
    job: envoi via Brevo avec template i18n
    retry: 5, backoff exponential

  stories.cleanup:
    trigger: cron toutes les heures
    job: DELETE stories WHERE expiresAt < NOW()

  culture-engine.batch:
    trigger: cron nuit (2h du matin)
    job: ré-entraînement poids, recalcul embeddings, health metrics

  moderation.scan:
    trigger: post créé
    job: analyse IA (texte + image) → flag si toxique
```

---

## 🧪 TESTS OBLIGATOIRES

Pour CHAQUE module :
- **Unitaires (Vitest)** : logique métier, calcul matchScore, validation Zod
- **Intégration (Supertest)** : endpoints REST, DB, Redis, transactions
- **E2E (Playwright)** : parcours critiques (login → onboarding → feed → chat → settings)
- **Charge (k6)** : scénarios "millions d'users" avant prod

### Scénarios de charge minimum
- 10K connexions simultanées
- 1000 posts/minute
- 5000 messages/minute
- Feed 50 posts/sec

---

## 🐳 DOCKER COMPOSE (Local Dev)

Tu dois fournir un `docker-compose.yml` avec :
- PostgreSQL 16 (remplace Neon en local)
- Redis 7
- Meilisearch
- MinIO
- Mailpit (capture email dev)

---

## 🔧 VARIABLES D'ENVIRONNEMENT (.env.example)

```env
# App
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=10

# Auth (Better Auth)
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Email (Brevo)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@myculturematch.com
BREVO_SENDER_NAME=My Culture Match

# Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=mcm-media

# CDN
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_API_TOKEN=

# Search
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=

# Security (Arcjet)
ARCJET_KEY=

# Monitoring
SENTRY_DSN=
BETTER_STACK_SOURCE_TOKEN=

# Culture Engine
CULTURE_ENGINE_BATCH_ENABLED=true
CULTURE_ENGINE_VERSION=v1
```

---

## 📚 DOCUMENTATION À PRODUIRE

Tu dois créer dans `docs/` :
1. `architecture/overview.md` — Vue d'ensemble
2. `architecture/modules.md` — Un fichier par module
3. `database/schema.md` — Schéma complet avec index
4. `api/endpoints.md` — Tous les endpoints avec exemples request/response
5. `security/threat-model.md` — Modèle de menaces
6. `algorithms/culture-engine.md` — Formules et principes
7. `algorithms/feed.md` — Architecture fanout
8. `scalability/roadmap.md` — Phases de scaling
9. `decisions/adr-001-database.md` — Pourquoi Neon+Drizzle
10. `decisions/adr-002-ids.md` — Pourquoi UUIDv7
11. `decisions/adr-003-feed.md` — Pourquoi fanout push
12. `decisions/adr-004-culture-engine.md` — Architecture algo

---

## ✅ CHECKLIST FINALE AVANT LIVRAISON

### Produit
- [ ] Toutes les fonctionnalités de l'audit sont couvertes
- [ ] Toutes les règles métier §17 implémentées
- [ ] Tous les rôles (user/mod/admin/superadmin) fonctionnent

### API
- [ ] Tous les endpoints §15 implémentés
- [ ] Validation Zod sur chaque endpoint
- [ ] Pagination cursor-based sur feed/messages/notifs
- [ ] Rate limiting par endpoint
- [ ] Auth + Authorization sur chaque route
- [ ] Format d'erreur uniforme { code, message, details, requestId }

### Database
- [ ] Toutes les tables créées avec Drizzle
- [ ] Migrations générées et testées
- [ ] Index stratégiques créés
- [ ] Contraintes UNIQUE/FK en place
- [ ] Soft delete partout

### Infrastructure
- [ ] Redis configuré (cache, sessions, PubSub, rate limit)
- [ ] BullMQ queues + workers fonctionnels
- [ ] Meilisearch indexé et searchable
- [ ] MinIO + presigned URLs fonctionnels
- [ ] WebSocket + Redis adapter fonctionnels
- [ ] Emails en queue (pas bloquant)

### Sécurité
- [ ] Better Auth (OTP + OAuth + sessions + 2FA ready)
- [ ] Arcjet actif
- [ ] Rate limits testés
- [ ] Blocage global implémenté
- [ ] Audit trail pour actions sensibles
- [ ] Pas de secrets exposés

### Algorithme
- [ ] Culture Engine module isolé
- [ ] Principes de base implémentés (P-ENG, P-ANT, P-ETH)
- [ ] Feed scoring fonctionnel
- [ ] Love matchScore calculé
- [ ] Friendship synergy calculé
- [ ] Health metrics trackées

### Observabilité
- [ ] Sentry configuré
- [ ] Logs structurés
- [ ] Request ID sur chaque requête
- [ ] Métriques Prometheus exposées

### Tests
- [ ] Tests unitaires passent
- [ ] Tests intégration passent
- [ ] Au moins 3 scénarios E2E passent
- [ ] Test de charge k6 exécuté avec résultats

### DevEx
- [ ] `docker-compose up` fonctionne en une commande
- [ ] `npm run dev` démarre le serveur
- [ ] `npm run test` passe
- [ ] `npm run migrate` applique les migrations
- [ ] `.env.example` complet
- [ ] README.md avec instructions

---

## 🚀 ORDRE DE CONSTRUCTION (Tu dois suivre cet ordre)

```
Phase 0 — Fondation
  ├─ Docker Compose (Postgres, Redis, Meilisearch, MinIO)
  ├─ Configuration Drizzle + migrations initiales
  ├─ CI/CD GitHub Actions (lint, test, build)
  ├─ Better Auth (email+OTP+OAuth+sessions)
  └─ Middlewares globaux (auth, rate-limit, CORS, Zod, error handler)

Phase 1 — Utilisateurs & Onboarding
  ├─ POST /api/onboarding (Zod validation, âge ≥ 18, username unique)
  ├─ GET/PATCH /api/users/me
  ├─ GET /api/users/:id
  ├─ Upload avatar (presigned URL MinIO)
  └─ Settings GET/PUT

Phase 2 — Feed & Posts (CŒUR)
  ├─ Tables posts, likes, comments, saves, shares
  ├─ POST /api/posts (création tradition)
  ├─ GET /api/feed?filter=... (fanout Redis ZSET)
  ├─ Like/Comment/Share/Save endpoints
  ├─ BullMQ : feed.fanout, counters.flush
  └─ Culture Engine v1 (poids fixes, DiversityBoost, SafetyFilter)

Phase 3 — Tribus & Communauté
  ├─ Tables tribes, memberships, rules, moderators
  ├─ CRUD tribus + join/leave
  ├─ Posts dans tribus + upvotes
  └─ Modération : reports + auto-modération IA

Phase 4 — Connexions & Love
  ├─ Tables connections, love_swipes, love_matches
  ├─ Suggestions / Interested / Requests / Compagnons
  ├─ Swipe Like/Pass + match mutuel → conversation auto
  ├─ Score de compatibilité (formule §6.1)
  └─ Blocage global (middleware filtrage)

Phase 5 — Messagerie Temps Réel
  ├─ WebSocket socket.io + Redis adapter
  ├─ Conversations + messages (pagination cursor)
  ├─ Notes vocales + fichiers (MinIO)
  ├─ Read receipts + typing (Redis)
  └─ Auto-reply templates

Phase 6 — Notifications & Search
  ├─ Notifications in-app (PG + Redis PubSub + WS)
  ├─ Email queue (Brevo)
  ├─ Meilisearch indexation (users, posts, tribes)
  └─ GET /api/search

Phase 7 — Stories & Algorithmes Avancés
  ├─ Stories 24h (create/get/cleanup cron)
  ├─ Culture Engine v2 (apprentissage online, embeddings)
  ├─ Thompson sampling, versionnage poids
  └─ Health metrics + auto-alertes

Phase 8 — Admin & Hardening
  ├─ Panel admin (reports, ban/unban)
  ├─ Audit logs complets
  ├─ Load testing k6
  └─ Documentation finale
```

---

## ⚠️ RÈGLES ABSOLUES DE TRAVAIL

1. **Tu n'as pas le droit de me demander de choisir.** Analyse et décide. Justifie.
2. **Ne suppose jamais qu'une fonctionnalité est simple.** Pose-toi : "Qu'est-ce qui pourrait casser ?", "Que ferait un attaquant ?", "Que se passe-t-il à 100K req/sec ?"
3. **Chaque fonctionnalité = fiche technique complète** (objectif, acteurs, permissions, données, modèles, relations, API, business logic, états, transitions, événements, jobs, notifications, emails, cache, sécurité, performance, scalabilité, tests).
4. **Aucune donnée fake en production.** Mocks uniquement pour dev/tests.
5. **Logique métier séparée des controllers.** Testable indépendamment de HTTP.
6. **Transactions DB pour les opérations sensibles.** (ex: match mutuel = swipe + création conversation + notification + ajout compagnons en UNE transaction).
7. **Idempotence** sur les opérations critiques (payment-like mental model : likes, swipes, uploads).
8. **Race conditions** : utiliser contraintes DB, locks Redis, ou transactions. Exemple : deux likes simultanés → contrainte UNIQUE(postId, userId).
9. **Pagination cursor-based** sur feed, messages, notifications. Jamais de `OFFSET` sur des millions de lignes.
10. **Soft delete partout.** Pas de `DELETE CASCADE` aveugle.

---

## 🎬 INSTRUCTION FINALE

**Commence immédiatement par Phase 0.** Ne me demande pas si tu dois commencer. Installe, configure, code, teste, documente.

Si tu bloques sur une décision technique, applique la règle de priorité :
1. Sécurité
2. Règles métier
3. Architecture globale
4. Contrat frontend/backend
5. Performance
6. Implémentation

**Livre du code fonctionnel, testé, documenté. Pas de spécifications vagues. Pas de "il faudrait". Du code. Maintenant.**
