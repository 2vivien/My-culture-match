# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble

My Culture Match : réseau social interculturel (traditions, tribus, connexions, Love/Friendship, messagerie). Monorepo sans workspace npm — chaque sous-projet a son propre `package.json` / `node_modules` :

- `backend/` — API Hono + socket.io + workers BullMQ (Node ≥ 20, ESM, TypeScript)
- `myculturematch-web/` — front Vite + React 19 + Tailwind 4 (export AI Studio ; alias `@` = racine du projet web, pas `src/`)
- `mobile-app/` — Expo / React Native (embryonnaire, aucun lien avec l'API pour l'instant)
- `docs/` (algos de reco, relationship memory, chat, audit 360) et `backend/docs/` (architecture, ADR, sécurité, API) — **source de vérité des specs**. `stack.md` et les `*PROMPT*.md` / `SKILL*.md` à la racine sont des prompts/specs de travail, pas du code ; `loop/` est un kit d'audit en boucle (ne pas modifier : lire `loop/00-LISEZ-MOI.md`). Docs rédigées en français.

## Commandes

Racine (lance backend + web en parallèle, après `npm install` à la racine **et** dans chaque sous-projet) :
```powershell
npm run dev
```

Backend (`cd backend`) :
```powershell
npm run dev                # tsx watch src/index.ts (port 3000)
npm run typecheck          # tsc --noEmit
npm run lint               # eslint src
npm test                   # vitest : tests/unit + tests/integration
npm run test:unit          # tests/unit seulement
npm run test:integration   # tests/integration (nécessite Postgres, Redis, etc. — cf. docker compose)
npx vitest run tests/integration/posts.test.ts          # un seul fichier
npx vitest run -t "nom du test"                          # un seul test
npm run migrate:generate   # drizzle-kit generate (depuis schema.ts)
npm run migrate            # drizzle-kit migrate
npm run build              # scripts/build.mjs -> dist/ ; migrate:prod = node dist/migrate.js
```
Note : `src/modules/consent/consent.policy.test.ts` est colocalisé dans `src/` donc **non couvert** par les `include` vitest (`tests/**` uniquement).

Web (`cd myculturematch-web`) : `npm run dev` (port 5173, proxy `/api` et `/health` → `localhost:3000`), `npm run lint` (= `tsc --noEmit`), `npm run test:e2e` (Playwright, `e2e/`).

Stack complète : `docker compose up -d` à la racine (web + backend + Postgres, Redis, Meilisearch, MinIO, Mailpit). Le front tourne en mock si `VITE_USE_MOCK` ≠ `false`.

CI (`.github/workflows/`) : lint → typecheck+build → tests unit/intégration sur le backend, plus workflows `people-nearby-validation` et `trust-safety-validation`.

## Architecture backend

- **Entrée** : `src/index.ts` démarre tout dans un seul process — init Sentry/métriques, bucket MinIO, **tous les workers BullMQ** (email, counters flush, modération, culture-engine, embedding, média, search, feed fanout, crons), serveur Hono, puis socket.io sur le même serveur HTTP (adapter Redis). Un nouveau worker/queue doit être enregistré ici (start + close dans `shutdown` + liste des queues pour les métriques).
- **App** : `src/app.ts` `createApp()` monte les routes ; REST uniquement, préfixe `/api`, erreurs au format `{ error: { code, message } }`. Beaucoup de modules sont montés sur `/api` nu (messages, connections, love, safety…), les chemins réels sont dans chaque `*.routes.ts`.
- **Modules** `src/modules/<domaine>/` : convention `*.routes.ts` (Hono + `@hono/zod-validator`), `*.schemas.ts` (Zod), `*.service.ts` (logique + Drizzle), `*.queue.ts` (BullMQ). Auth via `auth/require-auth.ts` / `require-admin.ts` (auth maison : OTP, OAuth Google/Apple, sessions Redis, JWT `jose` — pas Better Auth malgré `stack.md`).
- **Infra** `src/infrastructure/` : database (Drizzle + `postgres`, `schema.ts` unique), redis, meilisearch, minio, websocket, monitoring (Sentry, Prometheus, Better Stack). Config validée par Zod dans `src/config/env.ts` (crash au démarrage si var manquante ; modèle : `backend/.env.example`).
- **Moteurs algorithmiques** : `culture-engine/` (vecteurs profil/post, scoring, embeddings, batch nightly), `feed/` (fanout push Redis ZSET + compteurs Redis flushés vers PG), `love/`, `relationship-memory/`, `temporal-messages/`, `moderation/`, `safety/` + `consent/` (trust & safety). Détails dans `docs/` et `backend/docs/algorithms/`.

Pièges :
- **Migrations** : `drizzle/` contient des `.sql` jusqu'à `0019_*` mais les snapshots `meta/` s'arrêtent à `0010`. Les migrations récentes sont écrites à la main (le journal `_journal.json` les référence). `drizzle-kit generate` part d'un snapshot obsolète : vérifier le SQL généré avant de l'appliquer. `people-nearby-*.sql` sont des scripts hors journal.
- `src/app.ts` est très compact (plusieurs instructions par ligne) ; respecter la structure existante en l'éditant.
- Tests `tests/integration/*` supposent des services réels (Postgres/Redis/…) accessibles via les env de la CI.

## Architecture web

- `src/services/*.ts` = couche d'appel REST (un fichier par domaine, base `api.ts`, token dans `auth.token.ts`) ; `src/hooks/use*.ts` = React Query par-dessus ; état global Zustand dans `src/stores/` (`useAppStore`, `useUIStore`, `useConnectionsStore`).
- **Pas de react-router** : mini-routeur par hash dans `src/lib/router.ts`, synchronisé avec les stores (`#/totem/:id`, `#/tribu/:id`, …). Nouvelle vue = ajouter l'onglet dans `TAB_SEGMENTS` + le rendu dans `App.tsx`.
- Les chemins attendus du contrat API sont dérivés des services front ; garder services front et routes backend alignés.
- Temps réel via `socket.io-client` ; clé Gemini (`GEMINI_API_KEY`) exposée via `envPrefix` dans `vite.config.ts`.
