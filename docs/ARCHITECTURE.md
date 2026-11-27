# Architecture — My Culture Match

> **Référence canonique de l'architecture réelle.** Établie le 27 novembre 2026 par lecture du code source, des manifestes et de la configuration. Lorsqu'un document historique contredit ce fichier, **le code fait foi** et l'écart est consigné dans [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md).

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
                       │  25 modules métier · middlewares
                       └───┬──────┬──────┬──────┬──────┬───────┘
                           │      │      │      │      │
                     Postgres  Redis  Meili  MinIO  socket.io
                     Drizzle   BullMQ search  S3      + Redis adapter
                                  queues
                       ┌──────────────────────────────┐
                       │  mobile-app (Expo 54 / RN)   │  prototype UI
                       │  aucun appel réseau (2026-11)│  ── isolé ──
                       └──────────────────────────────┘

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
| `/api` | `love`, `notifications`, `stories`, `search` | matching, notifications, stories, recherche |
| `/api` | `feed`, `reports`, `explore`, `relationshipMemory` | flux, signalements, découverte, mémoire relationnelle |
| `/api/admin` | `admin` | administration, modération, audit |

Modules présents dans `src/modules/` mais non montés comme routes : `culture-engine` (scoring, embeddings, files batch), `email`, `media`, `moderation`, `workers/crons`, `audit`, `temporal-messages`. Ce sont des **services et workers internes**, pas des API publiques.

### 2.3 Infrastructure

- **Persistance** : Drizzle ORM + `postgres` (`src/infrastructure/database/`). 28 migrations dans `backend/drizzle/` (dernière : `0028_story_places.sql`), dont `0014`/`0015` mémoire relationnelle, `0016` chat V2, `0017` boîte à souvenirs, `0018`/`0019` messages temporels.
- **Cache / files** : Redis + BullMQ (`src/infrastructure/redis/`, files dans `feed/`, `culture-engine/`, `email/`, `search/`, `media/`, `moderation/` ; crons dans `modules/workers/crons.ts`).
- **Recherche** : Meilisearch (`src/infrastructure/meilisearch/`).
- **Médias** : MinIO + `sharp` (`src/infrastructure/minio/`).
- **Temps réel** : socket.io avec `@socket.io/redis-adapter` (`src/infrastructure/websocket/`). Événements documentés dans `backend/docs/api/websocket-events.md`.
- **Observabilité** : Pino, Prometheus (`/metrics`), Sentry, Better Stack ; dashboard Grafana dans `backend/grafana/`.

### 2.4 Authentification

Le backend **n'utilise pas le paquet `better-auth`** (absent de `backend/package.json`). L'authentification est maison : `jose` pour les jetons, `otp.service.ts`, `oauth.service.ts`, `session.service.ts`, `totp.ts` (2FA). Le document `backend/docs/README.md` qui mentionne « Better Auth (interne) » est une formulation obsolète, corrigée dans l'audit.

### 2.5 Tests et qualité

`backend/package.json` : `typecheck`, `lint`, `build`, `test`, `test:unit`, `test:integration`, `test:coverage`, `migrate`, `migrate:generate`, `studio`. Tests dans `backend/tests/` (unitaires, intégration, charge k6). Le script `seed` annoncé dans `backend/docs/README.md` **n'existe pas** ; seuls les SQL `backend/scripts/seed-*.sql` existent.

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

## 4. Mobile (`mobile-app/`) — prototype

### 4.1 Stack

Expo SDK 54.0.33, React Native 0.81.5, React 19.1.0, New Architecture activée, twrnc 4.16, Reanimated, Gesture Handler, lucide-react-native, expo-font (Urbanist), react-native-web pour l'aperçu navigateur.

Incohérences de toolchain : `babel-preset-expo ^55` et `eslint-config-expo ^56` visent des SDK 55/56 alors que le projet est en SDK 54. `app.json` garde `name`/`slug` = `mobile-app` et aucun `bundleIdentifier`/`package`/`scheme` (pas de deep linking).

### 4.2 Navigation

`App.tsx` pilote une machine à états booléenne (`showOnboarding`, `showAuth`, `showInterestsOnboarding`, `currentTab`) ; cinq onglets : home, match, chat, friends, profile ; overlays priorisés : notifications > chat > détail profil > onglet. Aucune bibliothèque de navigation, aucune pile, aucun typage de route.

### 4.3 État réel du prototype

- **Aucun appel réseau** : ni `fetch`, ni client HTTP, ni WebSocket, ni variable `EXPO_PUBLIC_*`, ni `/api/` dans le code (vérifié par recherche exhaustive).
- Auth factice (`AuthScreen.tsx` appelle `onAuthSuccess` immédiatement), chat statique, carte simulée avec un faux token Mapbox, profils codés en dur.
- Aucune persistance : `showOnboarding` est `true` au démarrage, donc l'onboarding rejoue à chaque lancement.
- Collision d'identifiants entre `MATCHES` et `MESSAGES` (`data/conversations.ts`) : le routage d'une conversation peut ouvrir le mauvais profil.
- Composants `components/ui/{Card,Button,Badge}.tsx` jamais importés ; `tailwind.config.js` jamais lu (twrnc est configuré en dur dans `lib/tailwind.ts`) avec une couleur primaire divergente.
- Aucun test, aucun script `lint`/`typecheck`, pas de `eas.json`.

Ce workspace doit être traité comme une **maquette fonctionnelle** et non comme un client de production.

---

## 5. Flux transverses

| Flux | Chemin réel |
|---|---|
| Authentification | Web → `POST /api/auth/send-otp` → `verify-otp` → jeton `jose` stocké côté web → `Authorization: Bearer` sur les appels suivants |
| Feed | Web `useFeed` → `GET /api/feed` → services `feed` + file BullMQ de fanout → PostgreSQL/Meilisearch |
| Chat | Web `useMessages` → `/api/conversations/*` (REST) + socket.io ; persistance chat V2 et mémoire relationnelle (`0016`, `0017`) |
| Découverte / Love | Web `useLove`, `useExplore` → `/api/love/*`, `/api/explore/*` → scoring `culture-engine` |
| Localisation | Web `/api/location/*` + `locationRealtime.ts` (socket.io) ; politiques de consentement dans `location.policy.ts` |
| Administration | Web `AdminPage` → `/api/admin/*`, RBAC et journal d'audit |

Le mobile ne participe à **aucun** de ces flux : il affiche des données locales.

---

## 6. Écarts entre documentation et code

| Document | Affirmation | Réalité vérifiée |
|---|---|---|
| `backend/docs/README.md:21` | « Better Auth (interne) » | Aucun paquet `better-auth` ; auth maison via `jose` |
| `backend/docs/README.md:57` | script `npm run seed` | Script absent du `package.json` |
| `stack.md:7` | « le frontend existant est 100 % REST » | Vrai pour le web ; **faux pour le mobile**, qui n'appelle aucune API |
| `stack.md:288-290, 568` | FCM / Dexie « quand l'app mobile arrive » | L'app mobile existe déjà (prototype), mais sans push ni stockage |
| `SKILL_react_native.md:12-31` | structure `src/`, `app/`, `services/`, `stores/`, navigation React Navigation | Structure réelle : `screens/`, `components/`, `hooks/`, `lib/`, `data/` ; navigation maison |
| `SKILL_react_native.md:8.3` | `react-native-fast-image` | Non installé ; recommandation à remplacer par `expo-image` |
| `myculturematch-web/README.md` | « Run and deploy your AI Studio app », clé `GEMINI_API_KEY` | Template Google AI Studio sans rapport ; remplacé par le README du workspace |
| `resolve-issues.md` | liens `file:///home/vivien/Workspace/...` et composants `StepAvatar`, `StepsBasicInfo`, … | Chemins morts et fichiers absents du dépôt actuel |
| `loop/*` | références à `LANCEMENT-BOUCLE.md` | Fichier nommé `LANCEMENT-BOUCLE (1).md` ; renommé pour réparer les liens |

---

## 7. Décisions et points de vigilance

- **REST + WebSocket plutôt que GraphQL** : le data layer web est déjà REST et le backend est déjà Hono (cf. `stack.md`). Le mini-routeur par hash évite une refonte de navigation web mais limite le deep linking.
- **Azure/Neon, MinIO, Meilisearch** : choix d'infrastructure séparés des services applicatifs ; la configuration locale est centralisée dans `docker-compose.yml`.
- **Spécifications non implémentées** : les corpus `RECOMMENDATION_*`, `love-algorithm/`, `RELATIONSHIP_FUTURE_FEATURES` décrivent des cibles. Leur présence ne prouve pas une fonctionnalité livrée ; se référer aux migrations et aux modules pour l'implémenté.
- **Risque principal** : l'écart entre le prototype mobile et les attentes produit, et l'absence de preuves automatisées sur les contrôles de sécurité. Voir `AUDIT_360_PRE_PRODUCTION_2026-11-27.md`.
