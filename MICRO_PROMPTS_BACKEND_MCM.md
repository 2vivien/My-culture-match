# 🔧 MICRO-PROMPTS — BACKEND MY CULTURE MATCH
> Un prompt autonome par module/fonctionnalité. À exécuter séquentiellement ou parallèlement selon les dépendances.

---

## MICRO-PROMPT 0 : FONDATION INFRASTRUCTURE

**Objectif** : Mettre en place l'environnement de développement complet en une seule commande `docker-compose up`.

**Stack** : Docker Compose avec PostgreSQL 16, Redis 7, Meilisearch v1.6, MinIO, Mailpit.

**Livrables obligatoires** :
1. `docker-compose.yml` avec healthchecks, networks, volumes nommés
2. `package.json` avec scripts : `dev`, `build`, `test`, `migrate`, `seed`, `studio` (Drizzle)
3. `tsconfig.json` strict (noImplicitAny, strictNullChecks, strictBindCallApply)
4. `.env.example` complet (toutes les variables du Prompt Master)
5. Dossier `src/config/env.ts` qui valide les variables avec Zod au démarrage (fail fast si manquante)
6. Connexion Drizzle à PostgreSQL avec pooler (max 20 connexions)
7. Connexion Redis (ioredis) avec retry exponential
8. Connexion Meilisearch
9. Connexion MinIO
10. Middleware global Hono : CORS (origine front uniquement), helmet, requestId, logger structuré (pino), error handler uniforme

**Règles** :
- Si une variable d'env manque au démarrage → throw immédiat avec message clair
- Healthcheck endpoint `GET /health` qui vérifie DB, Redis, Meilisearch
- Pas de `any` dans le code
- Tous les clients externes doivent avoir un wrapper classe (pas de client global nu)

**Tests** : Vérifier que `docker-compose up` démarre tous les services et que `/health` retourne 200.

---

## MICRO-PROMPT 1 : AUTHENTIFICATION COMPLETE (Better Auth)

**Objectif** : Système d'authentification production-ready avec email/OTP, OAuth Google/Apple, sessions sécurisées.

**Contexte** : Le frontend a un AuthPage avec email + boutons Google/Apple. L'onboarding sépare l'auth de la création de profil.

**Endpoints à implémenter** :
```
POST /api/auth/send-otp      { email } → { success, cooldown }
POST /api/auth/verify-otp    { email, code } → { token, user, isNewUser }
POST /api/auth/google        { idToken } → { token, user, isNewUser }
POST /api/auth/apple         { idToken } → { token, user, isNewUser }
POST /api/auth/logout        → { success } (révoque session)
GET  /api/auth/session       → { user } (vérifie cookie/token)
```

**Détails de sécurité OBLIGATOIRES** :
1. **OTP** : code à 6 chiffres, TTL 5 minutes dans Redis (`otp:{email}`), max 3 tentatives de vérification, max 3 envois par heure par email
2. **Rate limiting** : Arcjet + Redis double protection
   - `/send-otp` : 3/h/email, 10/h/IP
   - `/verify-otp` : 5/15min/IP
   - `/google`, `/apple` : 10/h/IP
3. **Sessions** : JWT signé + stockage Redis (`session:{token}`) avec TTL 7j. Cookie httpOnly, Secure, SameSite=Strict. Révocation immédiate au logout (blacklist Redis).
4. **OAuth** : vérification signature idToken Google/Apple. Création compte si email non existant.
5. **Email normalization** : lowercase, trim, validation regex RFC 5322 simplifiée.
6. **Réponse uniforme** : même message si email existe ou pas (anti-énumération) sur `/send-otp`.
7. **2FA ready** : colonne `twoFactorSecret` dans users, endpoint d'activation/désactivation prêt mais non obligatoire au début.
8. **Failed login tracking** : `failedLoginAttempts` + `lockedUntil` (30min lock après 5 échecs).

**Tables** : `users` (création minimale à l'auth), `user_sessions` (backup PG), `user_oauth_accounts`.

**Emails** : Template OTP avec Brevo, i18n (FR/EN/ES), queue BullMQ.

**Tests** :
- OTP expiré après 5min
- OTP invalide après 3 tentatives
- Session révoquée au logout
- Rate limit déclenché
- OAuth avec idToken falsifié rejeté

---

## MICRO-PROMPT 2 : ONBOARDING & PROFIL UTILISATEUR

**Objectif** : Création du profil en 7 étapes avec validation Zod stricte et règles métier.

**Endpoint** :
```
POST /api/onboarding
Body: {
  email, name, username, avatarSeed,
  gender, seeking, birthdate,
  roots: { country, region, ethnicity, village },
  languages: string[],
  intention, acceptedTermsAt
}
```

**Validations Zod OBLIGATOIRES** :
1. `name` : string, min 2, max 50
2. `username` : string, min 3, max 30, regex `^[a-zA-Z0-9._]+$`, unique (vérifier DB)
3. `birthdate` : date, âge calculé ≥ 18 (vérifié côté serveur avec `calculateAge`)
4. `languages` : array, min 1 élément
5. `roots.country` : requis
6. `acceptedTermsAt` : timestamp ≤ now
7. `gender`, `seeking`, `intention` : enums validés

**Règles métier** :
- Si username déjà pris → erreur 409 avec suggestion de 3 alternatives (`generateUsernameSuggestions`)
- Si email déjà onboardé → erreur 409 "Compte déjà existant"
- Création `user_profile_vector` initial (vide/null, rempli plus tard par Culture Engine)
- Génération avatar DiceBear si `avatarSeed` fourni
- Attribution `level=1`, `glow='none'`, `xp=0`
- Événement `UserOnboarded` → queue pour indexation Meilisearch + welcome email

**Endpoints profil** :
```
GET  /api/users/me       → profil complet + stats
GET  /api/users/:id      → profil public (filtré, pas d'email)
PATCH /api/users/me      → mise à jour champ par champ (ProfileDetails)
```

**Cache** : `user:{id}` Redis TTL 1h, invalidé au PATCH.

**Tests** :
- Onboarding avec âge 17 → 403
- Username dupliqué → 409 + suggestions
- `PATCH /api/users/me` avec bio < 10 caractères → 400
- Profil public ne retourne pas l'email

---

## MICRO-PROMPT 3 : SETTINGS & PARAMÈTRES COMPTE

**Objectif** : Gestion des paramètres utilisateur avec validation et effets secondaires.

**Endpoints** :
```
GET  /api/settings       → UserSettings
PUT  /api/settings       → Partial<UserSettings>
```

**Données `UserSettings`** :
```ts
{
  email: string,
  gender: 'male'|'female'|'non_binary'|'prefer_not_say',
  locationType: 'precise'|'approximate',
  googleConnected: boolean,
  appleConnected: boolean,
  twoFactor: boolean,
  theme: 'light'|'dark'|'system',
  language: 'fr'|'en'|'es',
  notifications: {
    email: boolean,
    push: boolean,
    marketing: boolean
  }
}
```

**Règles métier** :
- `twoFactor` : si activation, générer secret TOTP, retourner QR code (data URL), vérifier premier code avant activation définitive
- `googleConnected` / `appleConnected` : vérifier via Better Auth OAuth accounts
- `email` : si changement, envoyer confirmation à l'ancienne ET nouvelle adresse, token de validation 24h
- `language` : persister en DB + mettre à jour locale i18n
- `theme` : persister mais géré côté front principalement

**Sécurité** :
- Rate limit : 5 modifications / heure
- Audit log sur changement email et 2FA
- Impossible de désactiver 2FA sans vérification TOTP si activé

**Notifications** : Email de confirmation si changement d'email.

---

## MICRO-PROMPT 4 : UPLOADS & MÉDIAS (MinIO + Presigned URLs)

**Objectif** : Système d'upload scalable avec presigned URLs, traitement média async.

**Endpoint** :
```
POST /api/uploads/request
Body: { filename: string, contentType: string, size: number }
Response: { presignedUrl: string, fileUrl: string, expiresIn: number }
```

**Validations** :
- `contentType` : whitelist strict (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `audio/mpeg`, `audio/wav`)
- `size` : image max 10MB, vidéo max 100MB, audio max 20MB
- `filename` : sanitization (pas de `../`, pas de caractères spéciaux, extension match contentType)

**Flux** :
1. Client demande presigned URL
2. API génère URL MinIO (PUT, TTL 5min, content-type fixé, taille max)
3. Client upload direct vers MinIO
4. Client confirme upload (optionnel) ou webhook MinIO
5. BullMQ job `media.process` déclenché :
   - **Image** : Sharp → versions 150x150 (avatar), 800x800 (post), 1200x400 (banner), format WebP, qualité 80
   - **Vidéo** : FFmpeg → transcode H.264 720p, thumbnail 00:01
   - **Audio** : FFmpeg → normalisation, transcode MP3 128kbps
6. Fichier original remplacé par version optimisée (ou conservé selon config)

**Stockage MinIO** :
- Bucket `mcm-media`
- Structure : `avatars/{userId}/{filename}`, `posts/{postId}/{filename}`, `messages/{conversationId}/{filename}`, `stories/{userId}/{filename}`

**CDN** : URLs Cloudflare en production, MinIO direct en dev.

**Sécurité** :
- Pas de fichier exécutable (MIME check côté client ET serveur)
- Scan antivirus si possible (ClamAV ou service externe)
- Lifecycle policy : suppression auto après 30j si non référencé

**Tests** :
- Upload fichier .exe → rejeté
- Upload image 15MB → rejeté
- Presigned URL expirée après 5min → 403
- Traitement Sharp/FFmpeg produit bien les versions

---

## MICRO-PROMPT 5 : FEED ENGINE (CŒUR DU PRODUIT)

**Objectif** : Système de feed social scalable avec fanout push, algorithmes de scoring, et cache Redis.

**Endpoint** :
```
GET /api/feed?filter=following|for-you|popular|new&culture=...&cursor=...&limit=20
```

**Architecture FANOUT PUSH** :
```
Quand un post est créé :
  1. INSERT post (PG)
  2. BullMQ job "feed.fanout" :
     - Récupérer liste followers de l'auteur (Redis `followers:{authorId}`)
     - Pour chaque follower : ZADD feed:following:{followerId} timestamp postId
     - Si auteur a > 10K followers → SKIP (mode PULL pour célébrités)
  3. BullMQ job "search.index"
  4. BullMQ job "notifications.fanout"
```

**Lecture feed "Following"** :
```
ZREVRANGE feed:following:{userId} cursor cursor+limit
→ Récupérer posts batch depuis Redis (cache) ou PG
→ Enrichir avec auteur, compteurs, likedByMe
→ Retourner { posts, nextCursor }
```

**Feed "For You"** (généré à la demande) :
1. Récupérer ~500 candidats depuis Meilisearch (posts récents, pas vus, pas bloqués)
2. Scorer chaque candidat avec Culture Engine (formule §5.1)
3. Trier par score décroissant
4. Cache résultat Redis TTL 15min
5. Retourner paginé

**Feed "Popular"** : `EngagementPred` + `Freshness` dominants, pas de personnalisation sociale.
**Feed "New"** : `Freshness` dominant, chronologique inverse.

**Pagination** : Cursor-based (timestamp + id). Jamais OFFSET.

**Cache** :
- `feed:following:{userId}` : ZSET Redis, pas de TTL (évolutif), trim à 1000 posts
- `feed:foryou:{userId}` : STRING JSON, TTL 15min
- `post:{id}` : HASH Redis, TTL 30min

**Compteurs** (likes, comments, views, saves) :
- Redis `INCR post:{id}:likes` → flush batch toutes les 5min (BullMQ worker `counters.flush`)
- `post.likesCount` en DB = valeur de référence, Redis = valeur temps réel

**Règles métier** :
- Posts bloqués / utilisateurs bloqués → exclus du feed
- Posts `status != published` → exclus
- Minimum 30% diversité (hors bulle) sur For You
- Si feed vide → backfill (posts populaires récents)

**Tests** :
- Fanout : user avec 100 followers → 100 ZADD
- Celebrity : user avec 15K followers → pas de fanout
- Pagination : cursor stable même si nouveaux posts ajoutés
- Compteurs : 100 likes en 1min → 1 UPDATE batch en DB

---

## MICRO-PROMPT 6 : POSTS (CRUD + INTERACTIONS)

**Objectif** : Création et interaction sur les posts (posts culturels).

**Endpoints** :
```
POST   /api/posts              → création
GET    /api/posts/:id          → détail
POST   /api/posts/:id/like     → toggle like
POST   /api/posts/:id/comments → ajout commentaire
GET    /api/posts/:id/comments → liste commentaires (cursor pagination)
POST   /api/posts/:id/share    → partage
POST   /api/posts/:id/save     → toggle signet
DELETE /api/posts/:id/save     → retrait signet
DELETE /api/posts/:id          → suppression (soft delete, auteur ou admin)
```

**Création POST `/api/posts`** :
```ts
Body: {
  type: 'Text' | 'Images' | 'Link',
  title: string,           // min 3, max 200
  body?: string,           // max 5000
  mediaUrl?: string[],     // si Images (max 10)
  linkUrl?: string,        // si Link (URL valide)
  tribeId?: string,        // UUID optionnel
  tags?: string[]          // max 5, lowercase, alphanumeric + hyphen
}
```

**Règles métier** :
- `type='Images'` → au moins une `mediaUrl` requise
- `type='Link'` → `linkUrl` requise, vérifier que c'est une URL valide (pas de localhost, pas de file://)
- `type='Text'` → `body` requise si pas de title détaillé
- Si `tribeId` fourni → vérifier que l'utilisateur est membre
- Auto-modération IA sur `title` + `body` avant publication (Hive/OpenAI Moderation) → si toxique, `status='flagged'` + notif modération
- Extraction hashtags → remplir `tags[]`
- Génération embedding post (Culture Engine) → BullMQ job async

**Like** :
- Toggle (like/unlike)
- Contrainte UNIQUE(postId, userId) en DB
- Redis INCR atomique
- Notification à l'auteur si like (pas si unlike)

**Commentaire** :
- Thread plat (pas de nested pour V1, ou max 1 niveau avec `parentId`)
- Max 2000 caractères
- Auto-modération
- Notification à l'auteur du post + à l'auteur du commentaire parent

**Share** :
- Incrémente compteur, crée un `post_shares` entry
- Pas de duplication par user (UNIQUE)

**Save (Signet)** :
- Toggle, UNIQUE(postId, userId)
- Apparaît dans l'onglet "Saves" du profil

**Soft delete** :
- `status='deleted'`, `deletedAt=now`
- Cache invalidé
- Pas de suppression des likes/comments (pour intégrité), mais masqués

**Tests** :
- Double like simultané → contrainte DB empêche duplication
- Commentaire sur post supprimé → 404
- Post avec URL malveillante → rejeté
- Auto-modération flag un post toxique

---

## MICRO-PROMPT 7 : TRIBUS (COMMUNAUTÉS CULTURELLES)

**Objectif** : Système de tribus type subreddit avec règles, modérateurs, posts, votes.

**Endpoints** :
```
GET    /api/tribes              → liste (pagination, search)
POST   /api/tribes              → création
GET    /api/tribes/:id          → détail + stats
PATCH  /api/tribes/:id          → modification (admin/mod créateur)
DELETE /api/tribes/:id          → suppression (créateur ou superadmin)
POST   /api/tribes/:id/join     → rejoindre
DELETE /api/tribes/:id/leave    → quitter
GET    /api/tribes/:id/posts    → posts tribu (pagination)
GET    /api/tribes/:id/rules    → règles
GET    /api/tribes/:id/moderators → modérateurs
POST   /api/tribes/:id/posts    → poster dans tribu
POST   /api/tribu/posts/:id/upvote → toggle upvote/downvote
```

**Création tribu** :
```ts
Body: {
  name: string,        // min 3, max 50, unique
  tag: string,         // min 3, max 30, unique, regex [a-z0-9-]
  description: string, // max 500
  topic: string,       // parmi 26 topics prédéfinis
  rules?: { title: string, description: string }[], // min 2 si fourni
  avatar?: string,     // URL image
  banner?: string      // URL image
}
```

**Règles métier** :
- `name` et `tag` uniques (contrainte DB)
- Créateur devient automatiquement `role='admin'` dans `tribe_memberships`
- Max 5 tribus créées par utilisateur (anti-spam)
- `visitorsCount` : incrémenté à chaque GET `/api/tribes/:id` (Redis INCR → flush)
- `membersCount` : calculé depuis `tribe_memberships`

**Membership** :
- Rôles : `member` | `moderator` | `admin`
- Seul `admin` peut modifier/supprimer la tribu, gérer les règles
- `moderator` peut modérer les posts (pin, delete)
- Quitter une tribu → suppression membership, décrémente compteur

**Posts dans tribu** :
- Même schéma que posts globaux mais lié à `tribeId`
- Upvote/downvote (pas de like simple)
- Score = upvotes - downvotes
- Pin post (moderator+)

**Modération tribu** :
- Règles affichées aux nouveaux membres
- Violation → report → modérateur notifié

**Cache** :
- `tribe:{id}` : HASH Redis TTL 30min
- `tribe:{id}:members` : SET Redis (userIds)
- `tribe:{id}:posts` : ZSET Redis (postId → timestamp)

**Tests** :
- Création tribu avec tag dupliqué → 409
- User rejoint tribu → membership créé + compteur +1
- Modérateur pin un post → apparaît en haut
- User non-membre poste dans tribu privée → 403

---

## MICRO-PROMPT 8 : CONNEXIONS (RÉSEAU SOCIAL)

**Objectif** : Cycle de vie complet des relations : suggestions → intérêts → demandes → compagnons.

**Endpoints** :
```
GET    /api/connections/suggestions   → profils recommandés
GET    /api/connections/interested    → intéressés par moi
GET    /api/connections/requests      → demandes reçues
GET    /api/connections/companions    → connexions établies
POST   /api/connections/:userId/request → envoyer demande
POST   /api/requests/:id/accept       → accepter
POST   /api/requests/:id/decline      → refuser
POST   /api/requests/:id/block        → bloquer
DELETE /api/connections/:userId       → supprimer compagnon
```

**Modèle de données** :
```
connections
├── id, fromId, toId
├── status: suggestion | interested | requested | companion | blocked
├── matchScore, synergyScore
├── createdAt, updatedAt
```

**Cycle de vie** :
```
Suggestion (algo génère) →
  User A montre intérêt → status='interested' (from=A, to=B) →
    User B accepte → status='companion' + création conversation? NON (chat séparé) + notification
    User B refuse → status='declined' (pas de resuggestion 30j)
  OU User B envoie demande directe → status='requested' →
    User A accepte → 'companion'
```

**Règles métier** :
- Pas de double demande simultanée (UNIQUE(fromId, toId) + gestion direction)
- Si A bloque B → B ne voit plus A nulle part (feed, explore, chat, search)
- Si A supprime B de compagnons → status='suggestion' possible après 7j
- `matchScore` calculé par Culture Engine (synergy)
- Suggestions : max 20 par jour par utilisateur

**Blocage global** (middleware) :
- Vérifier `user_blocks` avant chaque réponse contenant un profil
- Exclure des feeds, recherches, suggestions
- Empêcher les messages

**Notifications** :
- Demande reçue → notif + email (optionnel)
- Demande acceptée → notif
- Nouvelle suggestion → notif (quotidienne, limitée)

**Cache** :
- `connections:{userId}` : liste des compagnons Redis SET
- `blocked:{userId}` : SET des IDs bloqués

**Tests** :
- Double demande simultanée → 409
- Blocage → user disparait de la recherche
- Acceptation → statut mis à jour + notif créée

---

## MICRO-PROMPT 9 : LOVE / MATCHING AMOUREUX

**Objectif** : Système de matching amoureux avec score de compatibilité calculé par Culture Engine.

**Endpoints** :
```
GET  /api/love/matches      → candidats avec matchScore
GET  /api/love/matches/:id  → détail profil candidat
POST /api/love/swipe        → { userId, action: 'like' | 'pass' }
```

**Score de compatibilité** (calculé côté serveur) :
```
compat(A,B) =
  0.30 · ValueAlignment(Schwartz + Hofstede)
+ 0.20 · PsychologyCompat(BigFive + attachement)
+ 0.15 · EmotionalMatch(Plutchik)
+ 0.10 · CulturalRoots(racines, tribus, langues)
+ 0.10 · Proximity(géo)
+ 0.10 · InterestOverlap
+ 0.05 · Chemistry(appris par feedback)
```

**Règles métier** :
- Candidats filtrés : âge ≥ 18, profil complet ≥ 80%, pas bloqué, pas déjà swipé
- `action='pass'` → enregistré, pas resuggestion pendant 30j
- `action='like'` → enregistré, vérifie si match mutuel
- **Match mutuel** : A like B ET B like A → TRANSACTION :
  1. Créer conversation (`conversations` + `conversation_participants`)
  2. Créer notification "match" pour A et B
  3. Ajouter aux compagnons (connections)
  4. Émettre WS event `love:match`
  5. Incrémenter `chemistry` dans feedback_events
- Pas de "super like" pour l'instant
- Profils incomplets (< 80%) jamais suggérés

**Notifications** :
- Nouveau match → notif in-app + WS + email (optionnel)
- Nouveau like (avant match) → notif in-app seulement

**Cache** :
- `love:candidates:{userId}` : liste candidats générée, TTL 1h
- `love:swiped:{userId}` : SET des IDs déjà swipés

**Tests** :
- Swipe like + like réciproque → match + conversation créée
- Swipe pass → pas de resuggestion 30j
- Match mutuel simultané (race condition) → transaction gère l'unicité
- Profil incomplet → jamais dans les candidats

---

## MICRO-PROMPT 10 : MESSAGERIE TEMPS RÉEL

**Objectif** : Chat 1:1 et groupe avec WebSocket, persistance, médias, présence.

**Endpoints REST** :
```
GET    /api/conversations              → liste (dernier message, unreadCount)
POST   /api/conversations              → création (auto au match, ou manuelle)
GET    /api/conversations/:id/messages → historique (cursor pagination)
POST   /api/conversations/:id/messages → envoi message
POST   /api/conversations/:id/read     → marquer lu
GET    /api/messages                   → liste panneau (alias conversations)
POST   /api/messages/:id/notifications → toggle notif cloche
```

**WebSocket Events** (socket.io + Redis adapter) :
```
Client → Server:
  join:conversation { conversationId }
  leave:conversation { conversationId }
  typing:start { conversationId }
  typing:stop { conversationId }
  message:send { conversationId, text, type, mediaUrl?, file?, audioDur? }
  message:read { conversationId, messageId }

Server → Client:
  message:new { message }
  message:read { messageId, userId }
  typing:start { conversationId, userId }
  typing:stop { conversationId, userId }
  presence:online { userId }
  presence:offline { userId }
```

**Règles métier** :
- Conversation créée automatiquement au match Love ou connexion acceptée
- Max 500 messages par conversation en mémoire cache (pagination DB au-delà)
- `unreadCount` par participant : INCR Redis au nouveau message, reset au `read`
- `lastReadAt` mis à jour au read
- Messages supprimés → `deletedAt` (soft delete), texte remplacé par "Message supprimé"
- Édition message → `editedAt`, historique conservé (optionnel V1)
- Auto-reply : si conversation inactive 24h et dernier message de l'autre → template réponse bot (stocké en DB, i18n)

**Types de messages** :
- `text` : content string
- `image` : mediaUrl
- `audio` : mediaUrl + audioDur (secondes)
- `file` : fileName + fileSize + mediaUrl

**Présence** :
- Redis `presence:{userId}` = 'online' | 'offline' | 'away'
- Heartbeat WS toutes les 30sec, TTL Redis 2min
- `lastSeenAt` mis à jour au disconnect

**Sécurité** :
- Vérifier que l'utilisateur est participant de la conversation avant chaque action
- Pas de lecture de messages d'autres conversations
- Rate limit : 60 messages/min par user

**Cache** :
- `conversation:{id}` : HASH (participants, lastMessage, updatedAt)
- `conversation:{id}:messages` : LIST Redis (50 derniers)
- `unread:{userId}` : total unread count

**Tests** :
- Envoi message → persistance PG + émission WS aux participants
- User non-participant tente de lire → 403
- 100 messages simultanés dans même conversation → pas de perte
- Déconnexion WS → presence offline après 2min

---

## MICRO-PROMPT 11 : NOTIFICATIONS

**Objectif** : Système de notifications in-app temps réel + email batch.

**Endpoints** :
```
GET    /api/notifications?cursor=...&limit=20
PATCH  /api/notifications/:id     → { isUnread }
POST   /api/notifications/read-all
POST   /api/notifications/:id/accept
POST   /api/notifications/:id/decline
GET    /api/notifications/unread-count
```

**Types de notifications** :
```
comment      → quelqu'un commente mon post
like         → quelqu'un like mon post
invite       → invitation (tribu, événement)
request      → demande de connexion reçue
match        → match Love mutuel
message      → nouveau message (si pas en ligne)
system       → admin, modération, annonces
```

**Structure notification** :
```ts
{
  id: string,
  userId: string,           // destinataire
  type: NotificationType,
  actorId?: string,         // qui a déclenché
  entityType: 'post' | 'comment' | 'user' | 'conversation' | 'tribe',
  entityId: string,
  title: string,
  body: string,
  metadata: JSONB,          // données contextuelles
  isRead: boolean,
  readAt?: Date,
  actionRequired: boolean,  // accept/decline possible
  createdAt: Date
}
```

**Règles métier** :
- **Déduplication** : pas plus d'1 notif par type/entity/actor par heure (ex: 50 likes sur même post = 1 notif "X et 49 autres ont aimé")
- **Groupement** : si 3+ likes dans 1h → notif groupée
- **Priorité** : match > message > request > comment > like > system
- **Email** : uniquement pour match, request, et messages si user offline > 1h. Jamais de spam.
- **Temps réel** : WS emit `notification:new` à la création
- **Mark all read** : UPDATE batch, invalidate cache

**Génération** (déclenchée par événements) :
```
PostLiked → INSERT notification (si pas déjà notif récente)
CommentCreated → INSERT notification
MatchCreated → INSERT notification (A et B) + email
RequestReceived → INSERT notification + email
MessageReceived → INSERT notification (si recipient pas en ligne sur WS)
```

**Cache** :
- `notifications:unread:{userId}` : compteur Redis TTL 1min
- `notifications:{userId}` : LIST des IDs récents (50)

**Tests** :
- 50 likes sur même post → 1 notif groupée
- Mark all read → compteur passe à 0
- Notif créée au match mutuel → WS reçu

---

## MICRO-PROMPT 12 : STORIES

**Objectif** : Stories éphémères 24h avec upload et visionneuse.

**Endpoints** :
```
GET  /api/stories         → stories actives de mes connexions + "My Story"
POST /api/stories         → création { mediaUrl }
```

**Règles métier** :
- `expiresAt = createdAt + 24h`
- Visibilité : connexions uniquement (followers/companions)
- Max 1 story active par user (nouvelle story = remplace l'ancienne si < 24h)
- Format : image (JPEG/PNG/WebP) ou vidéo (MP4, max 15sec)
- Pas de commentaire/like sur stories V1 (juste vue)
- Vue : `story_views` table (viewerId, storyId, viewedAt)

**Cron** : BullMQ worker `stories.cleanup` toutes les heures → DELETE stories WHERE expiresAt < NOW()

**Cache** :
- `stories:{userId}` : story active (si existe)
- `stories:feed:{userId}` : liste des stories de mes connexions (regénérée toutes les 5min)

**Tests** :
- Story créée → visible dans feed 24h
- Après 24h → disparait
- User non-connecté ne voit pas la story

---

## MICRO-PROMPT 13 : RECHERCHE GLOBALE (Meilisearch)

**Objectif** : Recherche instantanée multi-entités avec typo-tolerance.

**Endpoint** :
```
GET /api/search?q={query}&type=users|posts|tribes|all&limit=20&offset=0
```

**Index Meilisearch** :

**Index `users`** :
- Document : `{ id, name, username, bio, country, languages[], tribes[], avatar }`
- Searchable : name, username, bio
- Filterable : country, languages, tribes
- Ranking : typo, proximity, attribute, exactness + CultureResonance boost (custom)

**Index `posts`** :
- Document : `{ id, title, body, authorName, tribeName, tags[], createdAt }`
- Searchable : title, body, tags
- Filterable : tribeId, tags, type, createdAt

**Index `tribes`** :
- Document : `{ id, name, tag, description, topic, membersCount }`
- Searchable : name, tag, description
- Filterable : topic, membersCount

**Synchronisation** :
- CREATE/UPDATE/DELETE sur users/posts/tribes → BullMQ job `search.index`
- Reindexation complète possible via script CLI

**Règles** :
- Minimum 2 caractères pour lancer la recherche
- Max 100 résultats par requête
- Rate limit : 30/min
- Pas de recherche sur contenus bloqués

**Tests** :
- Recherche "yamato" → retourne user Yamato
- Faute de frappe "yamto" → retourne quand même
- Filtre type=posts → uniquement posts

---

## MICRO-PROMPT 14 : ADMIN & MODÉRATION

**Objectif** : Panel admin pour modération humaine et gestion plateforme.

**Endpoints** (protégés par RBAC admin/superadmin) :
```
GET    /api/admin/reports?status=...&cursor=...
POST   /api/admin/reports/:id/action    → { action: 'warn'|'suspend'|'ban'|'dismiss', reason }
GET    /api/admin/users?search=...&status=...&cursor=...
POST   /api/admin/users/:id/ban         → { reason, duration? }
POST   /api/admin/users/:id/unban
GET    /api/admin/stats                 → métriques globales
```

**Modèle reports** :
```ts
{
  id, reporterId, reportedId,
  entityType: 'user'|'post'|'comment'|'message',
  entityId,
  reason: 'harassment'|'spam'|'hate_speech'|'nsfw'|'violence'|'other',
  description: string,
  status: 'pending'|'reviewed'|'actioned'|'dismissed',
  moderatorId?, resolution?, createdAt, updatedAt
}
```

**Auto-modération** (JOUR 1) :
- BullMQ job `moderation.scan` sur chaque nouveau post/story/commentaire
- Hive AI ou OpenAI Moderation API
- Si score toxicité > seuil → `status='flagged'` + notif modération + masqué temporairement
- Faux positifs → modérateur humain peut approuver

**Actions modération** :
- `warn` : notification à l'utilisateur
- `suspend` : compte désactivé 7j (pas de login)
- `ban` : compte désactivé définitivement
- `dismiss` : pas d'action, marqué résolu

**Audit** : Toute action admin loggée (qui, quoi, quand, pourquoi).

**Tests** :
- User non-admin accède à /admin → 403
- Post toxique détecté par IA → status flagged
- Ban user → plus possible de login

---

## MICRO-PROMPT 15 : CULTURE ENGINE V1 (ALGORITHME)

**Objectif** : Implémenter le moteur algorithmique de scoring pour feed, love et amitié.

**Module** : `src/culture-engine/`

### 1. Embeddings & Vecteurs
- `user_profile_vector` : vecteur 768 dimensions calculé au onboarding completion
  - Dimensions : Hofstede (6), Schwartz (10), BigFive (5), racines (4), langues (N), valeurs (12)
  - Normalisé L2
- `post_vector` : vecteur 768 dimensions calculé à la publication
  - Dimensions : émotions Plutchik (24), vertus stoïques (4), champs lexicaux (20), tags

### 2. Principes de base (V1)
Implémenter ces principes comme fonctions pures :

```ts
// P-ENG-001 à P-ENG-005 : Engagement prediction (poids fixes pour V1)
function engagementPred(post: PostVector, user: UserVector): number

// P-ANT-001 à P-ANT-005 : Alignement culturel Hofstede/Schwartz
function cultureResonance(userA: UserVector, userB: UserVector): number

// P-PSY-001 à P-PSY-005 : Compatibilité psychologique
function psychologyCompat(userA: UserVector, userB: UserVector): number

// P-EMO-001 à P-EMO-005 : Match émotionnel
function emotionalMatch(userA: UserVector, userB: UserVector): number

// P-ETH-001 : Diversité (anti-bulle)
function diversityBoost(post: PostVector, user: UserVector, sessionHistory: string[]): number

// P-ETH-003 : Safety filter (toxicité)
function safetyFilter(post: PostVector): { safe: boolean, score: number }
```

### 3. Formules implémentées

**Feed Score** :
```ts
function scoreFeed(post: Post, user: User, context: SessionContext): number {
  const eng = engagementPred(post.vector, user.vector);
  const soc = socialAffinity(post.authorId, user.id); // followers, tribus communes
  const int = interestMatch(post.tags, user.interests);
  const cul = cultureResonance(post.vector, user.vector);
  const fr = freshness(post.createdAt);
  const div = diversityBoost(post, user, context.seenPostIds);
  const qual = qualityEthics(post); // vertus + authenticité
  const add = addictionPenalty(post); // éviter pièges
  const safe = safetyFilter(post.vector);

  if (!safe.safe) return 0; // L03-L04

  return (
    0.25 * eng +
    0.20 * soc +
    0.15 * int +
    0.15 * cul +
    0.10 * fr +
    0.05 * div +
    0.05 * qual -
    0.05 * add
  );
}
```

**Love Compatibility** :
```ts
function compatLove(A: User, B: User): number {
  return (
    0.30 * valueAlignment(A, B) +
    0.20 * psychologyCompat(A.vector, B.vector) +
    0.15 * emotionalMatch(A.vector, B.vector) +
    0.10 * culturalRoots(A, B) +
    0.10 * proximity(A, B) +
    0.10 * interestOverlap(A, B) +
    0.05 * chemistry(A.id, B.id) // feedback history
  );
}
```

**Friendship Synergy** :
```ts
function synergy(A: User, B: User): number {
  return (
    reciprocity(A.id, B.id) +
    density(A.id, B.id) + // fréquence messages
    tribesShared(A, B) +
    valuesAligned(A, B) +
    growthPotential(A, B) -
    toxicity(A.id, B.id)
  );
}
```

### 4. Health Metrics (L01-L12)
- Calcul quotidien (cron BullMQ)
- Stockage dans `health_metrics`
- Si métrique dépasse seuil → alerte Sentry + Slack webhook

### 5. Apprentissage V1 (simplifié)
- `chemistry` : à chaque swipe like, incrémenter poids. À chaque conversation > 10 messages, incrémenter.
- Pas de ML complexe pour V1, juste pondération ajustée par feedback explicite.

**Tests** :
- Post toxique → score 0
- Feed avec 20 posts → au moins 6 hors bulle (30%)
- Love matchScore entre 0 et 100

---

## MICRO-PROMPT 16 : WORKERS & CRON JOBS (BullMQ)

**Objectif** : Implémenter tous les workers et schedulers async.

**Workers à créer** :

```ts
// 1. feed.fanout
// Trigger: PostCreated event
// Job: ZADD feed:following:{followerId} for each follower
// Concurrency: 10
// Retry: 3, exponential backoff

// 2. search.index
// Trigger: EntityCreated/Updated/Deleted
// Job: indexDocument / deleteDocument in Meilisearch

// 3. media.process
// Trigger: UploadConfirmed
// Job: Sharp/FFmpeg processing
// Concurrency: 5 (CPU intensive)

// 4. notifications.fanout
// Trigger: Interaction event
// Job: INSERT notification + WS emit + email if needed
// Concurrency: 20

// 5. counters.flush
// Trigger: Cron every 5 minutes
// Job: Batch UPDATE posts SET likesCount=... FROM Redis

// 6. email.send
// Trigger: EmailRequested event
// Job: Send via Brevo with i18n template
// Retry: 5, exponential backoff
// Dead letter: after 5 failures

// 7. stories.cleanup
// Trigger: Cron every hour
// Job: DELETE expired stories

// 8. culture-engine.batch
// Trigger: Cron nightly 2AM
// Job: Recalculate embeddings, retrain weights, compute health metrics

// 9. moderation.scan
// Trigger: PostCreated/CommentCreated
// Job: AI moderation scan
// Concurrency: 10

// 10. presence.cleanup
// Trigger: Cron every 5 minutes
// Job: Clean expired presence keys

// 11. session.cleanup
// Trigger: Cron daily
// Job: Delete expired sessions from PG backup

// 12. user.suggestions
// Trigger: Cron daily 3AM
// Job: Generate connection/love suggestions for active users
```

**Configuration BullMQ** :
- Redis pour queue et events
- Dashboard optionnel (bull-board ou bullmq-pro)
- Dead letter queue pour chaque queue
- Monitoring : nombre de jobs pending/failed/completed

**Tests** :
- Job failed 3 fois → dead letter
- Cron exécuté à l'heure prévue
- Worker redémarre après crash sans perdre de jobs

---

## MICRO-PROMPT 17 : TESTS & QUALITÉ

**Objectif** : Suite de tests complète avec couverture > 80%.

**Structure** :
```
tests/
├── unit/
│   ├── culture-engine/      # Tests formules scoring
│   ├── auth/                # Tests OTP, sessions
│   ├── feed/                # Tests fanout logic
│   └── utils/               # Helpers
├── integration/
│   ├── auth.test.ts         # Register, login, logout
│   ├── posts.test.ts        # CRUD posts, likes, comments
│   ├── feed.test.ts         # Feed endpoints
│   ├── connections.test.ts  # Request, accept, block
│   ├── love.test.ts         # Swipe, match
│   ├── messages.test.ts     # Conversations, messages
│   └── uploads.test.ts      # Presigned URLs
├── e2e/
│   └── flows/
│       ├── onboarding.spec.ts
│       ├── post-and-interact.spec.ts
│       └── match-and-chat.spec.ts
└── load/
    ├── feed.k6.ts           # 1000 req/sec feed
    ├── messages.k6.ts       # 5000 msg/min
    └── auth.k6.ts           # 10K login/min
```

**Outils** :
- Vitest pour unitaires
- Supertest + testcontainers (PostgreSQL, Redis, Meilisearch) pour intégration
- Playwright pour E2E
- k6 pour charge

**CI GitHub Actions** :
```yaml
- Lint (ESLint + Prettier)
- Unit tests
- Integration tests (avec services Docker)
- Build TypeScript
- Migrate DB (dry-run)
- Deploy (si branche main)
```

**Tests obligatoires par module** :
- Auth : OTP expiration, rate limit, session rotation
- Feed : fanout, pagination cursor, compteurs
- Posts : double like, soft delete, auto-modération
- Connexions : race condition demande, blocage global
- Love : match mutuel transaction, score calcul
- Messages : WS temps réel, pagination, unread count
- Uploads : MIME validation, taille, presigned expiry

---

## MICRO-PROMPT 18 : OBSERVABILITÉ & MONITORING

**Objectif** : Système observable complet dès le JOUR 1.

**Implémentation** :

1. **Logs structurés (Pino)** :
   - Format JSON
   - Champs obligatoires : `timestamp`, `level`, `requestId`, `correlationId`, `userId`, `method`, `path`, `statusCode`, `durationMs`
   - Pas de données sensibles (passwords, tokens, emails)

2. **Sentry** :
   - Capture exceptions avec stack trace
   - Contexte utilisateur (id, username)
   - Breadcrumbs (requêtes, DB queries)
   - Alertes Slack si erreurs > 1% des requêtes

3. **Prometheus + Grafana** :
   - Métriques applicatives : `http_requests_total`, `http_request_duration_seconds`
   - Métriques métier : `posts_created_total`, `messages_sent_total`, `matches_created_total`
   - Métriques infra : DB connections, Redis memory, queue depth
   - Dashboards : API health, Business KPIs, Infrastructure

4. **Better Stack** :
   - Agrégation logs
   - Alertes sur patterns d'erreur
   - Uptime monitoring

5. **Health Checks** :
   - `GET /health` : DB, Redis, Meilisearch, MinIO
   - `GET /health/live` : liveness (Kubernetes)
   - `GET /health/ready` : readiness (dépendances OK)

6. **Alertes** :
   - Latence p95 > 500ms
   - Taux d'erreur > 1%
   - Queue depth > 1000 jobs
   - Redis memory > 80%
   - DB connections > 80%

**Tests** :
- Endpoint qui throw → Sentry reçoit l'erreur
- `GET /health` retourne 200 quand tout est OK, 503 si DB down

---

## MICRO-PROMPT 19 : DOCUMENTATION & ADRS

**Objectif** : Documentation complète pour onboarding d'un nouveau dev en 1 jour.

**Fichiers à produire** :

```
docs/
├── README.md                    # Vue d'ensemble, quickstart
├── architecture/
│   ├── overview.md              # Diagramme C4 (contexte + containers)
│   ├── modules.md               # Un paragraphe par module
│   ├── data-flow.md             # Flux principaux (auth, feed, message)
│   └── websocket.md             # Events et protocole
├── api/
│   ├── endpoints.md             # Liste complète avec exemples
│   ├── errors.md                # Codes d'erreur et format
│   └── websocket-events.md      # Events socket.io
├── database/
│   ├── schema.md                # Diagramme ER
│   ├── migrations.md            # Comment créer/appliquer
│   └── indexing.md              # Stratégie d'indexation
├── security/
│   ├── auth.md                  # Flux OTP, OAuth, sessions
│   ├── rate-limiting.md         # Limites par endpoint
│   ├── threat-model.md          # Menaces et mitigations
│   └── rbac.md                  # Rôles et permissions
├── algorithms/
│   ├── culture-engine.md        # Formules et principes
│   ├── feed.md                  # Architecture fanout
│   ├── love.md                  # Matching
│   └── friendship.md            # Connexions
├── scalability/
│   ├── roadmap.md               # Phases 1-6
│   ├── feed.md                  # Celebrity problem, push/pull
│   └── sharding.md              # Quand et comment sharder
└── decisions/
    ├── adr-001-database.md      # Pourquoi Neon + Drizzle
    ├── adr-002-ids.md           # Pourquoi UUIDv7
    ├── adr-003-feed.md          # Pourquoi fanout push
    ├── adr-004-culture-engine.md # Architecture algo
    ├── adr-005-websocket.md     # Pourquoi socket.io
    └── adr-006-minio.md         # Pourquoi MinIO vs S3
```

**Format ADR** :
```markdown
# ADR-XXX — Titre

## Contexte
## Options étudiées
## Décision
## Pourquoi
## Conséquences
## Évolution future
```

---

## MICRO-PROMPT 20 : DÉPLOIEMENT & OPS

**Objectif** : Préparer le déploiement production-ready.

**Docker** :
- `Dockerfile` multi-stage (build → production)
- Image alpine légère
- Non-root user
- Healthcheck intégré

**Environnements** :
- `dev` : local docker-compose
- `staging` : branche Neon, Railway/Fly.io
- `prod` : Neon production, Kubernetes ou PaaS

**CI/CD GitHub Actions** :
```yaml
on: push
jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    services:
      postgres: ...
      redis: ...
      meilisearch: ...
    steps:
      - checkout
      - setup-node
      - install
      - lint
      - unit-test
      - integration-test
      - build
      - migrate-dry-run
  deploy-staging:
    needs: lint-test-build
    if: branch == 'develop'
    steps: ...
  deploy-prod:
    needs: lint-test-build
    if: branch == 'main'
    steps: ...
```

**Migrations** :
- `drizzle-kit generate` → `drizzle-kit migrate`
- Jamais de migration manuelle en prod
- Backup Neon avant chaque migration
- Rollback plan documenté

**Secrets** :
- GitHub Secrets pour CI
- Secret manager en prod (AWS Secrets Manager ou équivalent)
- Rotation régulière des clés API

**Monitoring prod** :
- Sentry production DSN
- Grafana Cloud ou self-hosted
- PagerDuty/Opsgenie pour alertes critiques

**Tests de déploiement** :
- Smoke tests après deploy
- Rollback automatique si health check échoue 3 fois

---

## 📋 TABLEAU DE DÉPENDANCES DES MICRO-PROMPTS

```
MP 0 (Infra) ──────────────────────────────────────────────────────┐
  │                                                                 │
  ├─> MP 1 (Auth) ──> MP 2 (Onboarding) ──> MP 3 (Settings)       │
  │       │                                                           │
  │       └───────────────────────────────────────────────────────────┤
  │                                                                 │
  ├─> MP 4 (Uploads) ──> MP 6 (Posts) ──> MP 5 (Feed)              │
  │       │                              │                          │
  │       └──────────────────────────────┴─> MP 7 (Tribes)          │
  │                                          │                      │
  ├─> MP 10 (Messages) <───────────────────┘                      │
  │       │                                                          │
  │       └─> MP 11 (Notifications)                                  │
  │                                                                 │
  ├─> MP 8 (Connections) ──> MP 9 (Love)                            │
  │       │                    │                                    │
  │       └────────────────────┴─> MP 10 (Messages)                 │
  │                                                                 │
  ├─> MP 12 (Stories)                                               │
  ├─> MP 13 (Search)                                                │
  ├─> MP 14 (Admin)                                                 │
  ├─> MP 15 (Culture Engine) ──> MP 5 (Feed), MP 9 (Love)          │
  ├─> MP 16 (Workers)                                               │
  ├─> MP 17 (Tests)                                                 │
  ├─> MP 18 (Observability)                                         │
  ├─> MP 19 (Docs)                                                  │
  └─> MP 20 (Deploy)                                                │
```

**Ordre d'exécution recommandé** : 0 → 1 → 2 → 4 → 6 → 7 → 5 → 8 → 9 → 10 → 11 → 3 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20

---

## ⚡ CONSEIL D'UTILISATION

1. **Donne le PROMPT MASTER en premier** à Kimi pour qu'elle comprenne la vision globale
2. **Puis donne les micro-prompts un par un** (ou par paquets de 2-3 si indépendants)
3. **À chaque micro-prompt**, demande explicitement :
   - Le code source complet (pas de snippets incomplets)
   - Les tests correspondants
   - La documentation du module
4. **Vérifie la cohérence** entre les modules (noms de tables, types, endpoints)
5. **Si un conflit est détecté** (ex: deux modules utilisent des noms différents pour la même entité), demande une correction immédiate

**Rappel** : Kimi doit installer les outils, créer les fichiers, écrire le code, et tout faire fonctionner. Aucune excuse. Aucun "il faudrait". Du code. Maintenant.
