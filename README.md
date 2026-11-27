# My Culture Match

Réseau social interculturel : communautés (tribus) façon Reddit, connexions Friend avec carte « autour de moi », matchmaking Love conversationnel par IA, messagerie.

| Dossier | Contenu |
|---|---|
| `backend/` | API Hono + socket.io + workers BullMQ (Node ≥ 20, TypeScript, Drizzle/PostgreSQL, Redis, Meilisearch, MinIO) |
| `myculturematch-web/` | Front Vite + React 19 + Tailwind 4 |
| `mobile-app/` | Maquette Expo / React Native (pas encore reliée à l'API) |
| `docs/`, `backend/docs/` | Spécifications, algorithmes, ADR, sécurité, audit, plan d'issues |

## Démarrer en local

Prérequis : Node ≥ 20, Docker (PostgreSQL, Redis, Meilisearch, MinIO, Mailpit).

```bash
# 1. dépendances (chaque sous-projet a son propre node_modules)
npm install
npm install --prefix backend
npm install --prefix myculturematch-web

# 2. variables d'environnement
cp backend/.env.example backend/.env    # puis compléter les secrets

# 3. services + API + front
docker compose up -d                    # stack complète, ou seulement les services de backend/docker-compose.yml
npm run dev                             # backend (3000) + web (5173)
```

Le front proxifie `/api` et `/health` vers `localhost:3000`. Hors Docker, appliquer les migrations avec `npm run migrate --prefix backend`.

## Variables du front (`myculturematch-web`)

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | URL de l'API (sockets) |
| `VITE_MEDIA_URL` | Base des médias MinIO |
| `VITE_GOOGLE_CLIENT_ID` | Connexion Google |
| `VITE_MAP_TILES_URL` | Modèle de tuiles de carte `https://…/{z}/{x}/{y}.png` — **obligatoire en production** (les tuiles OpenStreetMap ne servent qu'en développement) |
| `VITE_MAP_ATTRIBUTION` | Attribution du fournisseur de tuiles |

## Qualité

```bash
# backend
npm run typecheck --prefix backend
npm run lint --prefix backend
npm test --prefix backend              # unit + intégration (nécessite PostgreSQL et Redis)

# web
npm run lint --prefix myculturematch-web    # tsc --noEmit
npm run build --prefix myculturematch-web
npm run test:e2e --prefix myculturematch-web   # Playwright, nécessite l'API
```

La CI GitHub (`.github/workflows/`) exécute lint, typecheck, build et tests pour le backend, et typecheck + build pour le web.

## Pour aller plus loin

- État du projet et backlog : `docs/PLAN_ISSUES_2026-11-27.md`, `docs/AUDIT_360_PRE_PRODUCTION_2026-11-27.md`
- Architecture, API, sécurité : `backend/docs/`
- Guide pour les agents : `CLAUDE.md`
