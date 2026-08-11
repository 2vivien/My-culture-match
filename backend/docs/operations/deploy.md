# Déploiement & Ops (MP20)

> Cycle de vie complet : image Docker multi-stage → registre GHCR → smoke tests →
> déploiement staging (branche `develop`) / production (branche `main`).

## Image Docker

`backend/Dockerfile` :

- **Multi-stage** : étape `build` (npm ci + `tsc`) → étape `production` (deps runtime seules, `--omit=dev`).
- **Alpine** (`node:20-alpine`) pour une image légère.
- **Non-root** : user `mcm` créé à la construction.
- **Healthcheck intégré** : `GET /health/live` (wget) toutes les 30 s.
- Migrations SQL (`drizzle/`) incluses dans l'image pour `npm run migrate` au déploiement.

```bash
cd backend
docker build -t myculturematch-backend .
```

## Environnements

| Environnement | Branche | Cible | Stack |
|---|---|---|---|
| `dev` | — | `docker compose up -d` | `backend/docker-compose.yml` |
| `staging` | `develop` | Railway / Fly.io / PaaS | Neon staging + Redis + Meilisearch + MinIO managés |
| `prod` | `main` | Railway / Fly.io / PaaS | Neon prod, secrets manager, Sentry DSN, Grafana |

Le stack complet (API + PostgreSQL + Redis + Meilisearch + MinIO + Mailpit) tourne aussi
avec l'image en un seul fichier :

```bash
cd backend
cp .env.example .env        # secrets à adapter
docker compose -f docker-compose.prod.yml up -d --build
```

## CI/CD GitHub Actions

- **`ci.yml`** (toutes branches) : lint → typecheck → build → tests unitaires → tests
  d'intégration (PostgreSQL/Redis/Meilisearch/MinIO via services) → coverage ≥ 80 %.
- **`deploy.yml`** (push `develop`/`main`, chemin `backend/**`) :
  1. `build-and-push` — image construite et poussée sur **GHCR** (`ghcr.io/<owner>/My-culture-match/backend`), tags `sha-<sha>` + `staging` (develop) / `latest` (main).
  2. `smoke` — démarre le stack prod (compose) et exécute `scripts/smoke.sh` contre l'image poussée (`/health/live`, `/health`, `/health/ready`, `/metrics`).
  3. `deploy` — appelle `scripts/deploy.sh` selon `DEPLOY_TARGET` (voir secrets).

### Secrets GitHub à définir

| Secret | Utilisé par | Requis pour |
|---|---|---|
| `DEPLOY_TARGET` | deploy.yml | `railway` \| `fly` \| `ssh` |
| `RAILWAY_TOKEN` | deploy.sh | déploiement Railway |
| `FLY_API_TOKEN` | deploy.sh | déploiement Fly.io |
| `SSH_HOST` / `SSH_USER` / `SSH_KEY` | deploy.sh | déploiement SSH + Docker |
| `BETTER_AUTH_SECRET` | API | auth (≥ 32 caractères) |

Sans cible configurée, le job `deploy` s'arrête proprement : l'image reste **prête et testée**
dans GHCR (aucun faux déploiement).

## Smoke tests

```bash
BASE_URL=http://localhost:3000 ./scripts/smoke.sh
```

4 vérifications avec retries : liveness, health, readiness, métriques. Sortie 0 si tout passe.

## Migrations

- Génération : `npm run migrate:generate` → revue du SQL → commit séparé.
- Application en prod : exécutée **automatiquement au démarrage du conteneur**
  (`node dist/migrate.js`, bundle esbuild sans dépendance `drizzle-kit` en runtime).
  En local : `npm run migrate` (dev) ou `node dist/migrate.js` (bundle).
- **Backup Neon avant chaque migration** (export pg_dump), rollback = migration inverse documentée.

## Runbook production

| Événement | Action |
|---|---|
| Health check échoue 3× | Le conteneur est redémarré par l'orchestrateur ; vérifier `POSTGRES`/`REDIS` via `/health/ready` |
| Erreurs > 1 % | Alerte Sentry → diagnostic via logs structurés (requestId) + traces |
| Latence p95 > 500 ms | Dashboard Grafana (`mcm-backend.json`) → examiner `http_request_duration_seconds`, queue depth BullMQ |
| Migration à dérouler | Backup → `npm run migrate` → smoke test → observabilité 15 min |
