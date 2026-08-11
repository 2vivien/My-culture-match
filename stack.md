# Stack Backend — My Culture Match

> **Document de référence** pour l'infrastructure technique du backend de **My Culture Match** (réseau social interculturel : traditions, tribus, connexions, matching, messagerie).
>
> ⚠️ **Note d'alignement** : cette version remplace la précédente, qui était un template du projet "SuperFans" (monétisation de créateurs). Alignée sur :
> - les **fonctionnalités réelles** du produit (voir `SKILL-audit-fonctionnel-ultra-complet.md`),
> - le **frontend existant**, qui est **100 % REST** (`src/services/*.ts` → `/api/feed`, `/api/posts/:id/like`, `/api/conversations/:id/messages`, …).
>
> Objectif : **scalabilité vers des millions d'utilisateurs dès le départ** sans refonte technique.

---

## Sommaire

1. [API — REST + WebSocket](#1-api--rest--websocket)
2. [Base de données](#2-base-de-données)
3. [Authentification & Sécurité](#3-authentification--sécurité)
4. [Stockage & Médias](#4-stockage--médias)
5. [Cache & Temps réel](#5-cache--temps-réel)
6. [Architecture du Feed (fanout)](#6-architecture-du-feed-fanout)
7. [Recherche](#7-recherche)
8. [Notifications](#8-notifications)
9. [Files d'attente & Tâches](#9-files-dattente--tâches)
10. [Monitoring & Logs](#10-monitoring--logs)
11. [Validation & Documentation](#11-validation--documentation)
12. [Internationalisation](#12-internationalisation)
13. [Communauté / Tribus / Contenu](#13-communauté--tribus--contenu)
14. [Messagerie](#14-messagerie)
15. [CI/CD, Tests & Qualité](#15-cicd-tests--qualité)
16. [Outils supplémentaires suggérés](#16-outils-supplémentaires-suggérés)
17. [Récapitulatif : l'infrastructure complète](#17-récapitulatif--linfrastructure-complète)
18. [Points de décision & roadmap](#18-points-de-décision--roadmap)

---

## 1. API — REST + WebSocket

### ✅ Hono (framework REST)

**Rôle :** Serveur REST principal (middleware, routing, WebSocket).

- TypeScript-first, léger, compatible Node.js + runtime edge (utile avec Neon serverless)
- Middleware système : auth, rate-limit, CORS, Zod validation
- Support natif WebSocket (`@hono/node-ws`)
- **Alternative :** Fastify (plus mature, benchmark proche)

**Pourquoi REST et pas GraphQL ?**
```
Le frontend (myculturematch-web) appelle déjà des endpoints REST.
Réécrire les services en GraphQL = réécrire tout le data layer front.
En plus, à l'échelle d'un réseau social :
  - REST est plus simple à cacher (HTTP cache, CDN, Redis)
  - Pas de problème N+1, pas d'exposition de schéma
  - Plus facile à scaler horizontalement
```

### ✅ Contrat API = l'audit fonctionnel

Les chemins exacts attendus par le front sont déjà définis dans `src/services/*.ts` et documentés dans `SKILL-audit-fonctionnel-ultra-complet.md` (§15). Exemples :

| Domaine | Endpoints clés |
|---|---|
| Auth | `/api/auth/*` (login, otp, google, apple, logout) |
| Onboarding | `POST /api/onboarding` |
| Users / Profil | `GET /api/users/me`, `GET /api/users/:id`, `PATCH /api/users/me` |
| Feed / Posts | `GET /api/feed?filter=following\|for-you`, `POST /api/posts`, `POST /api/posts/:id/like` |
| Traditions | `POST /api/traditions`, `GET /api/tribes` |
| Tribus | `GET /api/tribes/:id`, `POST /api/tribes`, `GET /api/tribu/posts`, `GET /api/tribu/rules` |
| Connexions | `GET /api/connections/*`, `POST /api/requests/:id/accept\|decline\|block` |
| Love | `GET /api/love/matches`, `POST /api/love/swipe` |
| Messages | `GET /api/conversations`, `GET/POST /api/conversations/:id/messages` |
| Notifications | `GET /api/notifications`, `POST /api/notifications/read-all` |
| Stories | `GET/POST /api/stories` |
| Search | `GET /api/search?q=...` |
| Settings | `GET/PUT /api/settings` |
| Uploads | `POST /api/uploads` (ou presigned URL → MinIO) |

### ✅ WebSocket (temps réel)

- **socket.io** (ou Hono WS) pour : notifications, messagerie, commentaires live, présence (online/typing), stories.
- **Redis adapter** (`@socket.io/redis-adapter`) pour scaler la gateway WebSocket sur plusieurs instances.
- Alternative SSE pour les cas lecture-seule (feed en direct).

---

## 2. Base de données

### ✅ Neon Postgres + Drizzle ORM

| Technologie | Rôle |
|---|---|
| **Neon** | PostgreSQL serverless (branches par environnement, autoscale, pooler intégré, read replicas) |
| **Drizzle ORM** | ORM TypeScript-first (SQL pur, migrations `drizzle-kit`, zéro runtime magic) |

**Choix Drizzle plutôt que Prisma** : bundle léger, pas d'engine binaire, edge-compatible, migrations simples.

### Scalabilité écritures (à décider DÈS le schéma)

```
Neon autoscale = le calcul. Mais les ÉCRITURES passent par un seul primaire.
Pour des millions d'utilisateurs actifs, planifier dès maintenant :
  - IDs : UUID v7 (triables chronologiquement) ou snowflake → évite la réécriture
  - Partitionnement des tables chaudes :
      notifications, messages, posts, connexions → par utilisateur ou par mois
  - Read replicas pour les lectures (feed, profils, stats)
  - Pooler de connexions Neon (ne pas saturer la limite de connexions)
```

**Tables à prévoir (domaines de l'audit) :** users, user_settings, tribes, tribe_posts, tribe_rules, tribe_moderators, posts/traditions, comments, likes, saves, shares, stories, conversations, messages, connections, love_matches, notifications, reports, follows, blocked_users.

---

## 3. Authentification & Sécurité

### ✅ Better Auth (choix confirmé)

Framework d'authentification TypeScript, self-hosted.

- **Email + mot de passe** et **OTP** (connexion par code → correspond à l'écran Auth actuel)
- **OAuth / SSO** : Google, Apple (boutons présents dans l'UI)
- **Gestion des sessions** (cookies, révocables → stockées dans Redis)
- **2FA** (setting `twoFactor` déjà présent dans les mocks)
- **RBAC** (rôles utilisateur / modérateur / admin)
- **Rate limiting** intégré
- **Passkeys / WebAuthn** (optionnel plus tard)

**Endpoints :** `GET /api/auth/*` exposés par Better Auth ; sessions en Redis (invalidation au logout, blacklist).

### ✅ Arcjet

Protection anti-spam et anti-bot (jour 1 pour un réseau social grand public).

- Détection bots (IA + patterns)
- Rate limiting avancé
- Blocage emails temporaires / jetables
- Anti brute force (complémentaire au rate-limit Better Auth)

### ✅ Brevo (Transactional Email / OTP)

- Envoi des **OTP** et emails transactionnels (bienvenue, réinitialisation, notifications critiques)
- Templates HTML responsives, tracking
- **Alternative :** Resend, Postmark

### ✅ Zod

- Validation des entrées REST (DTOs) + requêtes paginées
- Déjà utilisé côté front (schémas onboarding) → schémas partagés possibles via un package `@mcm/shared`

---

## 4. Stockage & Médias

### ✅ MinIO (S3-compatible)

- **Images** : avatars, photos de traditions/posts, bannières de tribus, stories
- **Vidéos** : contenu culturel (durées/plays)
- **Audio** : notes vocales de la messagerie
- **Fichiers** : pièces jointes du chat (`file { name, size }`)

**Pourquoi MinIO :** self-hosted, gratuit, API AWS S3 → migration vers S3 réel sans refonte.

### ✅ Presigned URLs (upload direct)

Pour scaler : le client **upload directement vers MinIO** via une URL présignée, l'API ne fait que fournir la signature. Évite de faire transiter les gros fichiers par le serveur API.

```
POST /api/uploads/request  → { presignedUrl, fileUrl }
Client → PUT presignedUrl → MinIO
API confirme → queue Sharp/FFmpeg
```

### 🔷 Sharp + FFmpeg (traitement médias)

- **Sharp** : redimensionnement/compression images (avatars 150×150, posts 800×800, bannières 1200×400)
- **FFmpeg** : transcodage vidéo + thumbnails + normalisation audio des notes vocales

```
Upload → BullMQ → Sharp/FFmpeg → MinIO
```

### 🔷 Cloudflare CDN

- Distribution globale des médias servis depuis MinIO
- Cache + optimisation images (Polish), protection DDoS, DNS managé

---

## 5. Cache & Temps réel

### ✅ Redis

| Usage | Description |
|---|---|
| **Cache** | Réponses feed, profils, stats, tribus |
| **Rate limiting OTP** | Tentatives OTP + cooldowns |
| **Sessions** | Sessions Better Auth + blacklist JWT |
| **Compteurs** | Likes, vues, plays (incrément atomique → flush PG asynchrone) |
| **Présence en ligne** | Statut online/offline/typing |
| **Feed** | Timelines mises en cache (voir §6) |

**Sans Redis :** chaque requête non-cachée tape PostgreSQL → coût + latence + saturation des connexions.

### ✅ WebSocket + Redis PubSub (temps réel)

- **Notifications** (nouveau like, commentaire, demande de connexion, match Love)
- **Messagerie** (messages en temps réel, read receipts, typing)
- **Présence** (online / offline)
- **Commentaires live** sur les posts/traditions

**Scalabilité :** plusieurs nœuds WS derrière un load balancer + `@socket.io/redis-adapter` pour broadcaster sur tous les nœuds.

> ⚠️ Redis PubSub convient à la messagerie 1:1 et aux notifications par utilisateur. Si un jour tu as besoin de **broadcast massif** (live à 100k+ spectateurs), migrer vers **NATS ou Kafka**. Pas avant.

---

## 6. Architecture du Feed (fanout)

> **Le point le plus important pour scaler un réseau social.** `stack.md` précédent ne l'abordait pas.

### Le problème
Quand un utilisateur suit 500 profils, son feed "Following" **ne doit pas** faire 500 requêtes par page de feed. Il faut un modèle de **fanout**.

### Recommandation : push (fanout à la publication)

```
Auteur publie une tradition
  → POST /api/posts (persiste en PG)
  → BullMQ job "feed.fanout"
      → Pour chaque follower : PUSH id du post dans sa timeline Redis
        (LPUSH feed:{userId} → ZSET avec score = timestamp)
  → Indexation Meilisearch
  → Notifications aux abonnés
```

- **Timeline Redis** : `ZSET feed:{userId}` (postId → score timestamp). Lecture du feed = `ZREVRANGE` + fetch des posts (batched, cache).
- **Follower counts** dans Redis (incrément atomique).
- **BullMQ** : fanout en tâches de fond, jamais dans la requête HTTP.
- **Fallback** : au-delà d'un seuil de followers (ex. 10 000), passer en **pull** (lire les posts des followed directement, cached) pour ne pas exploser la mémoire Redis.

### Feed "For You" (recommandation)
- Généré à la demande (pas de fanout) : score de pertinence (cultures/tribus communes, valeurs, localisation, fraîcheur).
- Cache Redis du résultat + régénération périodique (BullMQ).
- Backfill Meilisearch/Redis pour la découverte.

### Compteurs (likes, vues, plays, comments)
- Incrément atomique **Redis** → flush périodique vers PostgreSQL (BullMQ worker, batch INSERT/UPDATE).
- Évite de brûler les écritures du primaire Neon.

---

## 7. Recherche

### ✅ Meilisearch

- Recherche full-text instantanée avec **tolérance aux fautes de frappe** (le front a une barre de recherche globale + recherche connexions)
- Auto-complétion "search-as-you-type"
- **Entités indexées** : utilisateurs (nom, username, bio, pays), traditions/posts (texte, tags), tribus (nom, tag, description), messages
- Filtres facettés : catégorie/thématique culturelle (`launchThemes`), tribu, pays
- **Indexation asynchrone** via BullMQ (sur publication, édition, suppression)

**Endpoints :** `GET /api/search?q=...&type=users|posts|tribes`.

**Pourquoi pas PostgreSQL ILIKE :** lent à l'échelle, pas de tolérance aux fautes, pas de ranking.

---

## 8. Notifications

### ✅ Notifications in-app custom (recommandé)

Tu as déjà Redis PubSub + WebSocket : les notifications in-app sont un simple `INSERT notifications` + `PUBLISH`. Pas besoin d'un service externe pour le socle.

```
Événement (like/comment/request/match)
  → INSERT notifications (PG)
  → Redis PUBLISH notif:{userId}
  → WS → client
```

**Données (mocks `notifications.json`)** : `type` (`comment | like | invite | request | match | message`), `user { name, avatar, action, target }`, `isUnread`, `time`.

**Endpoints :** `GET /api/notifications` (paginé), `PATCH /api/notifications/:id`, `POST /api/notifications/read-all`, `GET /api/notifications/unread-count` (badge sidebar).

### ✅ Email : Brevo

Emails critiques uniquement (OTP, bienvenue, réinitialisation). Les notifications sociales passent par l'in-app.

### 🔷 Push mobile : Firebase Cloud Messaging

Quand l'app mobile arrive : notifications push iOS/Android. **Novu** reste une option si tu veux un outil multi-canal unifié (in-app + email + push + SMS) en un seul service — mais le socle custom suffit pour démarrer.

---

## 9. Files d'attente & Tâches

### ✅ BullMQ (basé Redis)

File d'attente unique, simple, pas de service supplémentaire.

**Cas d'usage My Culture Match :**
```yaml
Publication d'une tradition:
  → BullMQ: "feed.fanout" (push aux followers)
  → BullMQ: "search.index" (Meilisearch)
  → BullMQ: "notifications.fanout" (abonnés)
  → BullMQ: "media.process" (Sharp/FFmpeg si image/vidéo)

Match Love mutuel:
  → BullMQ: "match.created" (créer conversation + notification + compagnons)

Compteurs:
  → BullMQ: "counters.flush" (Redis → PG en lot)
```

**Cas d'usage supplémentaires :** emails en masse, nettoyage planifié (expiration stories 24 h, purge sessions), rapports/statistiques.

**RabbitMQ :** uniquement plus tard si passage à des **microservices** avec routing avancé. Pas avant.

---

## 10. Monitoring & Logs

### ✅ Sentry

- Capture des exceptions avec stack trace, contexte utilisateur, breadcrumbs
- **Dès le premier jour** (le front l'utilisera aussi)

### ✅ Better Stack (Logs)

- Agrégation de logs, requêtage temps réel, alertes sur patterns d'erreur, uptime monitoring

### ✅ Grafana + Prometheus

- Métriques serveur (CPU, RAM, requêtes/sec), latence API (p50/p95/p99), taux d'erreur
- Métriques métier : DAU/WAU, messages envoyés, posts créés
- **Stack :** Prometheus + Grafana + Node Exporter (+ exporters Redis / PostgreSQL)

---

## 11. Validation & Documentation

### ✅ Zod

- Validation des entrées (DTOs REST, pagination, uploads)
- Schémas partageables avec le front via un package `@mcm/shared`

### ✅ Scalar (OpenAPI)

- Documentation REST moderne et interactive (Try-it-out), export OpenAPI
- Compatible REST (pas besoin de GraphQL)

---

## 12. Internationalisation

### ✅ i18next

**Langues :** 🇫🇷 Français (défaut) · 🇬🇧 Anglais · 🇪🇸 Espagnol (optionnel).

- Traduction des erreurs API
- Emails transactionnels multi-langue
- Templates de notifications multi-langue
- Le champ `locale` utilisateur existe déjà dans le modèle (mocks `users.json`)

---

## 13. Communauté / Tribus / Contenu

### ✅ Construire avec Drizzle + Hono (recommandé)

Les **traditions, tribus, posts, commentaires** sont **le cœur du produit** — pas un outil externe.

```
Drizzle ORM → Tables Post, Comment, Like, Save, Share, Report,
              Tribe, TribePost, TribeRule, TribeModerator, BlockedUser
Hono REST  → Routes /api/posts, /api/tribes, /api/tribu/...
Redis      → Compteurs temps réel (likes, vues, upvotes)
Meilisearch → Indexation contenu
BullMQ     → Fanout + notifications
```

**Fonctionnalités clés à implémenter :** likes, commentaires, partages, signets (saves), upvotes tribu, règles & modérateurs de tribu, **signalement (report)** et **blocage utilisateur** (filtrage global).

---

## 14. Messagerie

### ✅ Custom WebSocket + Drizzle

Le front a un chat complet : conversations, textes, notes vocales (`audioDur`), fichiers (`file { name, size }`), médias partagés, statut online.

```
WebSocket (socket.io + Redis adapter) → Messages en temps réel
Drizzle ORM → Persistance conversations / messages
BullMQ      → Notifications push, auto-replies
Redis       → Présence, read receipts, typing
MinIO       → Notes vocales + fichiers (upload présigné)
```

**Endpoints :** `GET /api/conversations`, `GET /api/conversations/:id/messages` (paginé), `POST /api/conversations/:id/messages`, `POST /api/conversations/:id/read`, `POST /api/messages/:id/notifications`.

**Création de conversation** automatique lors d'un **match Love mutuel** ou d'un **match Connexion** accepté.

**Auto-replies** : le front simule actuellement un bot (`getAutomatedReply`). Backend : soit templates de réponses multi-langue, soit intégration LLM (optionnel, plus tard).

---

## 15. CI/CD, Tests & Qualité

> **Manquant dans la version précédente — indispensable pour viser des millions d'utilisateurs.**

### ✅ Pipeline CI/CD

- **GitHub Actions** (ou GitLab CI) : lint → test → build → migrate DB → deploy
- Environnements : `dev` → `preview` (branche Neon par PR) → `staging` → `prod`
- **Migrations DB automatisées** dans le pipeline (`drizzle-kit`), jamais à la main
- Déploiement conteneurisé : **Docker Compose** en local, **Kubernetes** (ou platform PaaS : Railway / Fly.io) en prod
- **Backups Neon** activés + restauration testée

### ✅ Tests

| Type | Outil | Couvre |
|---|---|---|
| Unitaires | Vitest | Logique métier, resolvers/routes, calcul matchScore, calculateAge |
| Intégration | Supertest + Testcontainers | Routes REST, DB (Neon local), Redis |
| E2E | Playwright | Parcours : login → onboarding → feed → chat → settings |
| **Charge** | **k6** | Scénarios "des millions" : connexion simultanée, feed, messages — avant la prod |

### ✅ Qualité de code

- ESLint (TypeScript) + Prettier + Husky + lint-staged (avant chaque commit)
- **TypeScript strict** (pas de `any`), schémas partagés `@mcm/shared`
- Revue de PR obligatoire

---

## 16. Outils supplémentaires suggérés

### 🔷 Content Moderation — Hive AI / OpenAI Moderation (JOUR 1)

Réseau social grand public = contenu inapproprié/illégal dès le premier utilisateur. Obligations légales.

- Modération auto : texte (insultes, harcèlement) + images (NSFW, violence)
- Signalement (report) → file de modération humaine (panel admin)
- Filtrage des mineurs (contenu sensible) — l'app est 18+ (onboarding)

### 🔷 PostHog

- Analytics produit : événements, funnels (signup → première tradition → premier match), rétention
- **Feature flags** (sans outil séparé)
- Session recording
- Self-hosted possible (RGPD)

### 🔷 DiceBear (avatars)

- Avatar par défaut généré à l'inscription — **déjà prévu dans l'app** (`avatarSeed` dans l'onboarding)
- `https://api.dicebear.com/7.x/adventurer/svg?seed=[username]`

### 🔷 Géolocalisation — OpenStreetMap + Leaflet (optionnel)

- Si fonctionnalité future : carte des événements culturels / proximité géographique
- Le setting `locationType: "Use approximate location (based on IP)"` existe déjà → endpoint IP→geo (MaxMind / Cloudflare IP)

### 🔷 Stripe — ❌ NON REQUIS pour l'instant

La précédente version incluait Stripe (wallet, tips, abonnements) pour "SuperFans". **My Culture Match n'a pas de monétisation au lancement** → à exclure jusqu'à décision produit.

---

## 17. Récapitulatif : l'infrastructure complète

### Légende
- ✅ Retenu pour My Culture Match
- 🔷 Suggéré (ajout ou décalage)
- ❌ Retiré (venait du projet SuperFans / non adapté)

### Couche API

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Hono (REST) | API principale (le front est 100 % REST) | 🔴 Immédiat |
| ✅ socket.io + Redis adapter | WebSocket temps réel (notifs, chat, présence) | 🟡 Semaine 2 |
| ✅ Zod | Validation des entrées | 🔴 Immédiat |
| ✅ Scalar | Documentation OpenAPI | 🟡 Semaine 1 |
| ❌ GraphQL Yoga | Retiré — front REST, caching plus simple, pas de N+1 | — |
| ❌ GraphQL Codegen | Retiré (dépendait de GraphQL) | — |

### Couche Données

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Neon + Drizzle ORM | PostgreSQL + ORM (partitionnement + read replicas dès le schéma) | 🔴 Immédiat |
| ✅ Redis | Cache, compteurs, sessions, présence, PubSub | 🔴 Immédiat |
| ✅ Meilisearch | Recherche full-text (users, posts, tribus) | 🟡 Semaine 3 |
| ✅ BullMQ | Files d'attente (fanout, médias, indexation, compteurs) | 🟡 Semaine 2 |
| ❌ RabbitMQ | Retiré — BullMQ suffit ; à réévaluer si microservices | — |

### Couche Auth & Sécurité

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Better Auth | Auth + OTP + OAuth Google/Apple + sessions + 2FA + RBAC | 🔴 Immédiat |
| ✅ Arcjet | Anti-spam, anti-bot, emails jetables, brute force | 🟡 Semaine 2 |
| ✅ Brevo | Emails transactionnels + OTP | 🔴 Immédiat |

### Couche Stockage & Médias

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ MinIO | Stockage médias S3-compatible + uploads présignés | 🟡 Semaine 2 |
| ✅ Cloudflare | CDN, cache images, DDoS, DNS | 🟡 Semaine 2 |
| 🔷 Sharp + FFmpeg | Compression images + transcodage vidéo/audio (BullMQ) | 🟡 Semaine 2 |

### Couche Temps réel

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Redis PubSub | Événements temps réel (notifs, chat, présence) | 🟡 Semaine 2 |
| ✅ WebSocket | Gateway temps réel multi-nœuds (Redis adapter) | 🟡 Semaine 2 |

### Couche Feed

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Redis ZSET | Timelines Following (fanout push) | 🔴 Immédiat (design) |
| ✅ BullMQ | Fanout + flush compteurs | 🟡 Semaine 2 |
| ✅ Meilisearch / Redis | Feed "For You" (recommandation) | 🟡 Semaine 4 |

### Couche Notifications

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ In-app custom (PG + Redis PubSub) | Notifications dans l'interface | 🟡 Semaine 2 |
| ✅ Brevo | Email critiques (OTP, bienvenue) | 🔴 Immédiat |
| 🔷 Firebase Cloud Messaging | Push mobile (quand l'app mobile arrive) | 🟢 Plus tard |
| 🔷 Novu | Option multi-canal unifié (si besoin) | 🟢 Plus tard |

### Couche Monitoring & Qualité

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Sentry | Erreurs (front + back) | 🔴 Immédiat |
| ✅ Better Stack | Logs, uptime | 🟡 Semaine 1 |
| ✅ Grafana + Prometheus | Métriques + dashboards | 🟡 Semaine 3 |
| ✅ GitHub Actions + Tests | CI/CD, unitaires, intégration, E2E | 🔴 Immédiat |
| ✅ k6 | Load testing (scénarios millions) | 🟡 Semaine 3 |
| ✅ ESLint + Prettier + Husky | Qualité de code | 🔴 Immédiat |

### Couche Internationalisation

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ i18next | Traductions (FR, EN, ES) | 🟢 Semaine 5+ |

### Couche Contenu & Modération

| Technologie | Usage | Priorité |
|---|---|---|
| ✅ Custom (Drizzle + Hono) | Tribus, posts, traditions, commentaires | 🔴 Immédiat |
| 🔷 Hive AI / OpenAI Moderation | Modération auto (texte + image) | 🔴 Immédiat |
| ✅ PostHog | Analytics + feature flags | 🟢 Semaine 5+ |

### Couche Retirée

| Technologie | Raison |
|---|---|
| ❌ Stripe / wallet / tips / premium | Monétisation SuperFans — pas au programme My Culture Match |
| ❌ Dexie.js (offline sync) | Complexité inutile pour un réseau social web au lancement — réévaluable pour l'app mobile |

---

## 18. Points de décision & roadmap

### Décisions à trancher AVANT de coder

1. **Feed** : confirmer le modèle **push (fanout)** + seuil de bascule en pull (§6).
2. **Partitionnement** : définir les clés de partitionnement des tables chaudes dès la migration initiale (§2).
3. **Modération** : valider le fournisseur (Hive vs OpenAI) + workflow report → modération humaine.
4. **ID des contenus** : UUID v7 (ou snowflake) pour tous les IDs → compatibilité sharding futur.
5. **Hébergement** : Docker Compose (local) + choix prod (Kubernetes / Railway / Fly.io) + Cloudflare en face.

### Roadmap

```
Semaine 0  : schéma DB + migrations Drizzle + CI/CD + Better Auth (email+OTP+OAuth)
Semaine 1  : onboarding + users + settings + uploads présignés + Sharp
Semaine 2  : feed (fanout) + posts/traditions + Redis compteurs + WS + notifications in-app
Semaine 3  : tribus + commentaires + likes + Meilisearch + BullMQ + k6 + modération auto
Semaine 4  : Love (matching) + connexions (suggestions/requests/block) + stories
Semaine 5  : messagerie temps réel + recherche globale + i18n + PostHog
Semaine 6  : load testing final + hardening + monitoring + préparation prod
```

> **Règle d'or :** chaque fonctionnalité du front (audit §15) doit être couverte par un endpoint REST + un test. Si une route n'a pas de test, elle n'est pas "faite".

