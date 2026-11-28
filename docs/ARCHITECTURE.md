# Architecture — My Culture Match

> **Référence canonique de l'architecture réelle.** Établie le 27 novembre 2026 et mise à jour le 28 novembre 2026 par lecture du code source, des manifestes et de la configuration. Lorsqu'un document historique contredit ce fichier, **le code fait foi** et l'écart est consigné dans [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md).

---

## 1. Topologie globale

```text
                       ┌──────────────────────────────┐
                       │  myculturematch-web (Vite)   │  :5173
                       │  React 19 · services REST    │
                       │  socket.io-client · Zustand  │
                       └───────────────┬──────────────┘
                                       │ /api/* (proxy Vite) + WS
                       ┌───────────────▼──────────────┐
                       │        backend (Hono 4)       │  :3000
                       │  REST /api/* · /health · /metrics
                       │  27 modules métier · middlewares
                       └───┬──────┬──────┬──────┬──────┬───────┘
                           │      │      │      │      │
                     Postgres  Redis  Meili  MinIO  socket.io
                     Drizzle   BullMQ search  S3      + Redis adapter
                                  queues

Infra locale : docker-compose.yml (Postgres 16, Redis 7, Meilisearch v1.11,
               MinIO, Mailpit) + backend/docker-compose.observability.yml
               (Prometheus, Grafana).
```

---

## 2. Backend (`backend/`)

### 2.1 Point d'entrée et pipeline HTTP

`src/index.ts` démarre le serveur `@hono/node-server`. `src/app.ts:34-41` construit l'application :

1. middlewares globaux dans l'ordre : `requestId` → `cors` → `httpLogger` (Pino) → `metricsMiddleware` (prom-client) ;
2. `GET /metrics` protégé par `METRICS_TOKEN` (refusé en production si le token n'est pas défini) ;
3. enregistrement des modules (préfixes de routes) ;
4. `notFound` JSON uniforme et `onError` centralisé (`AppError`).

Les réponses d'erreur suivent le contrat `{ error: { code, message, details } }` (voir `backend/docs/api/errors.md`).

### 2.2 Modules enregistrés

Préfixes montés dans `src/app.ts:38` :

| Préfixe | Module | Responsabilité |
|---|---|---|
| `/health` | `health` | liveness / readiness / santé des dépendances |
| `/api/auth` | `auth` | OTP, OAuth Google/Apple, sessions, révocation |
| `/api/onboarding` | `onboarding` | profil initial, validation Zod |
| `/api/users` | `users` | profils public/privé, stats |
| `/api/settings` | `settings` | préférences, 2FA/TOTP, changement d'email |
| `/api/uploads` | `uploads` | URLs présignées MinIO, suivi de traitement |
| `/api/posts` | `posts` | traditions, likes, commentaires, partages, signets |
| `/api/tribes`, `/api/tribu` | `tribes` | tribus, règles, modération, upvotes |
| `/api` | `messages` + `messages.v2` | conversations, messages, chat V2 |
| `/api` | `connections`, `location`, `consent`, `safety` | amitié, géolocalisation, consentement, blocage |
| `/api` | `love`, `notifications`, `stories`, `search` | matching conversationnel, notifications, stories (avec lieu flouté), recherche |
| `/api/places`, `/api/admin/places` | `places` | lieux culturels proposés par la communauté, modération obligatoire (administrateurs) |
| `/api/events` | `events` | événements publics (lieu culturel publié), de tribu ou entre amis, réponses |
| `/api` | `feed`, `reports`, `explore`, `relationshipMemory` | flux, signalements, découverte, mémoire relationnelle |
| `/api/admin` | `admin` | administration, modération, audit |

Modules présents dans `src/modules/` mais non montés comme routes : `culture-engine` (scoring, embeddings, files batch), `email`, `media`, `moderation`, `workers/crons`, `audit`, `temporal-messages`. Ce sont des **services et workers internes**, pas des API publiques.

### 2.3 Infrastructure

- **Persistance** : Drizzle ORM + `postgres` (`src/infrastructure/database/`). 34 migrations dans `backend/drizzle/` (dernière : `drizzle\0033_posts_vocabulary.sql`), dont `0014`/`0015` mémoire relationnelle, `0016` chat V2, `0017` boîte à souvenirs, `0018`/`0019` messages temporels, `0020` à `0030` communauté (sanctions, tribus privées, flairs, votes de commentaires), Love (profil), position (audience, opt-in, notification), stories géolocalisées, lieux et événements. Elles sont écrites à la main : voir [MIGRATIONS.md](MIGRATIONS.md) et `npm run check:migrations`.
- **Cache / files** : Redis + BullMQ (`src/infrastructure/redis/`, files dans `feed/`, `culture-engine/`, `email/`, `search/`, `media/`, `moderation/` ; crons dans `modules/workers/crons.ts`).
- **Recherche** : Meilisearch (`src/infrastructure/meilisearch/`).
- **Médias** : MinIO + `sharp` (`src/infrastructure/minio/`).
- **Temps réel** : socket.io avec `@socket.io/redis-adapter` (`src/infrastructure/websocket/`). Événements documentés dans `backend/docs/api/websocket-events.md`.
- **Observabilité** : Pino, Prometheus (`/metrics`), Sentry, Better Stack ; dashboard Grafana dans `backend/grafana/`.

### 2.4 Authentification

Le backend **n'utilise pas le paquet `better-auth`** (absent de `backend/package.json`). L'authentification est maison : `jose` pour les jetons, `otp.service.ts`, `oauth.service.ts`, `session.service.ts`, `totp.ts` (2FA). Le document `backend/docs/README.md` qui mentionne « Better Auth (interne) » est une formulation obsolète, corrigée dans l'audit.

### 2.5 Tests et qualité

`backend/package.json` : `typecheck`, `lint`, `build`, `test`, `test:unit`, `test:integration`, `test:coverage`, `migrate`, `migrate:generate`, `studio`. Tests dans `backend/tests/` : unitaires (`tests/unit/`, dont `tests/unit/web/` pour la logique pure du front), intégration (`tests/integration/`, exécutés un par un car ils partagent Redis et la base) et charge k6. Une matrice d'accès croisés (`tribe-access-matrix.test.ts`) vérifie chaque surface d'une tribu privée pour cinq types d'acteurs. Le script `seed` annoncé dans `backend/docs/README.md` **n'existe pas** ; seuls les SQL `backend/scripts/seed-*.sql` existent.

---

## 3. Web (`myculturematch-web/`)

### 3.1 Stack réelle

Vite 6.2.3, React 19.0.1, TypeScript 5.8, Tailwind CSS 4, TanStack Query 5, Zustand 5, React Hook Form + Zod 4, Framer Motion / Motion, MapLibre GL, socket.io-client 4.8, Recharts, `@google/genai` (assistant IA), Playwright (E2E).

Le champ `name` du `package.json` est encore `"react-example"` : résidu de template, sans effet fonctionnel mais à renommer.

### 3.2 Organisation

- `src/pages/` : `AuthPage`, `OnboardingPage`, `ConnexionPage`, `SettingsPage`, `AdminPage`.
- `src/components/` : composants par domaine (`feed`, `explore`, `connections`, `chat`, `tribu`, `totem`, `settings`, `admin`, …) et atomes `ui/`.
- `src/hooks/` : 21 hooks de domaine (`useFeed`, `useLove`, `useMessages`, `useSettings`, …).
- `src/services/` : 27 services d'accès aux données (`api.ts`, `authService.ts`, `feedService.ts`, `tribuService.ts`, …).
- `src/stores/` : `useAppStore`, `useUIStore`, `useConnectionsStore` (Zustand).
- `src/types/`, `src/lib/` : types métier et utilitaires.

### 3.3 Routage et communication

**Pas de React Router** : `src/lib/router.ts` implémente un routeur par hash (`#/explore`, `#/tribu/:id`, `#/totem/:id`, `#/post/:id`, `#/messages`, `#/settings`, `#/admin`, …) synchronisé avec les stores Zustand.

`src/services/api.ts` utilise `API_BASE = ''` (chemins relatifs) et s'appuie sur le proxy Vite `/api` → `http://localhost:3000`. Le jeton est lu via `src/services/auth.token.ts` et envoyé en `Authorization: Bearer <token>` avec `credentials: 'include'`. Le temps réel passe par `src/services/locationRealtime.ts` et `socket.io-client`.

### 3.4 Scripts

`dev` (port 5173), `build`, `preview`, `lint` (`tsc --noEmit`), `test:e2e` (Playwright). Il n'y a **pas** de tests unitaires web dans le dépôt.

---

## 4. Mobile

`mobile-app/` (prototype Expo sans couche réseau) a été **retiré du dépôt** (commit « retire mobile-app »). Aucune API n'est écrite pour lui. S'il revient, il faudra un contrat d'API mobile ↔ backend et une stratégie de build.

---

## 5. Flux transverses

| Flux | Chemin réel |
|---|---|
| Authentification | Web → `POST /api/auth/send-otp` → `verify-otp` → jeton `jose` stocké côté web → `Authorization: Bearer` sur les appels suivants |
| Feed | Web `useFeed` → `GET /api/feed` → services `feed` + file BullMQ de fanout → PostgreSQL/Meilisearch |
| Chat | Web `useMessages` → `/api/conversations/*` (REST) + socket.io ; persistance chat V2 et mémoire relationnelle (`0016`, `0017`) |
| Découverte / Love | Web `useLove`, `useExplore` → `/api/love/*`, `/api/explore/*` → scoring `culture-engine` |
| Localisation | Web `/api/location/*` + `locationRealtime.ts` (socket.io) ; activation par consentement explicite, visibilité par défaut « amis », audience (sélection / tous sauf), position publique ramenée à une grille (`location.privacy.ts`), décision de visibilité unique (`location.nearby.filter.ts`) |
| Contenu sur la carte | Stories avec lieu flouté, lieux culturels modérés, événements : chaque marqueur passe par la même décision de visibilité que la position de son auteur |
| Administration | Web `AdminPage` → `/api/admin/*`, RBAC et journal d'audit |


---

## 6. Écarts entre documentation et code

| Document | Affirmation | Réalité vérifiée |
|---|---|---|
| `backend/docs/README.md:21` | « Better Auth (interne) » | Aucun paquet `better-auth` ; auth maison via `jose` |
| `backend/docs/README.md:57` | script `npm run seed` | Script absent du `package.json` |
| `stack.md:7` | « le frontend existant est 100 % REST » | Vrai pour le web (le mobile a été retiré) |
| `myculturematch-web/README.md` | « Run and deploy your AI Studio app », clé `GEMINI_API_KEY` | Template Google AI Studio sans rapport ; remplacé par le README du workspace |
| `resolve-issues.md` | liens `file:///home/vivien/Workspace/...` et composants `StepAvatar`, `StepsBasicInfo`, … | Chemins morts et fichiers absents du dépôt actuel |
| `loop/*` | références à `LANCEMENT-BOUCLE.md` | Fichier nommé `LANCEMENT-BOUCLE (1).md` ; renommé pour réparer les liens |

---

## 7. Intégration continue et déploiement

| Workflow | Rôle |
|---|---|
| `ci.yml` | lint, typecheck + build, tests unitaires, tests d'intégration, couverture (seuil 80 %, mesuré 76,9 %). Services : Postgres, Redis, Meilisearch et un serveur S3 de test (`adobe/s3mock`) : **MinIO ne publie plus d'image ni de binaire**. Variable `BREVO_API_KEY` requise par `config/env.ts` |
| `web-ci.yml` | typecheck et build du web |
| `people-nearby-validation.yml`, `trust-safety-validation.yml` | tests unitaires ciblés de politique (position, consentement) + typecheck |
| `deploy.yml` | construit et publie l'image (GHCR), test de fumée ; **le déploiement de production est manuel** (`workflow_dispatch`), le staging (`develop`) est automatique |

## 8. Décisions et points de vigilance

- **REST + WebSocket plutôt que GraphQL** : le data layer web est déjà REST et le backend est déjà Hono (cf. `stack.md`). Le mini-routeur par hash évite une refonte de navigation web mais limite le deep linking.
- **Azure/Neon, MinIO, Meilisearch** : choix d'infrastructure séparés des services applicatifs ; la configuration locale est centralisée dans `docker-compose.yml`.
- **Spécifications non implémentées** : les corpus `RECOMMENDATION_*`, `love-algorithm/`, `RELATIONSHIP_FUTURE_FEATURES` décrivent des cibles. Leur présence ne prouve pas une fonctionnalité livrée ; se référer aux migrations et aux modules pour l'implémenté.
- **Risque principal** : les contrôles de sécurité sont désormais démontrés par des tests d'intégration (matrice d'accès, position, consentement), mais ces tests ne tournent qu'en CI avec des services réels. Une revue de code du 28 novembre 2026 a relevé des vulnérabilités de confidentialité de position et de contrôle d'accès, corrigées en partie (voir [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md) §7).
