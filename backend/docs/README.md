# My Culture Match — Documentation Backend

> Onboarding d'un nouveau développeur en **1 jour**. Lis ce README, puis les dossiers
> dans l'ordre : `architecture/` → `api/` → `database/` → `security/` → `algorithms/` → `scalability/` → `decisions/`.

## Vue d'ensemble

**My Culture Match** est un réseau social interculturel : traditions, tribus culturelles,
connexions d'amitié, matching amoureux et messagerie. Le backend est une API **REST + WebSocket**
en TypeScript strict, pensée pour scaler vers des millions d'utilisateurs dès le départ.

| Technologie | Rôle |
|---|---|
| **Hono** | Framework REST (léger, TypeScript-first) |
| **PostgreSQL (Neon)** + **Drizzle ORM** | Persistance + migrations |
| **Redis** | Cache, sessions, compteurs, présence, files (BullMQ) |
| **BullMQ** | Files d'attente & crons (fanout, médias, emails, modération) |
| **Meilisearch** | Recherche full-text (users, posts, tribus) |
| **MinIO** | Stockage médias S3-compatible + uploads présignés |
| **socket.io + Redis adapter** | Temps réel (messagerie, notifications, présence) |
| **Auth maison (`jose`)** | OTP + OAuth Google/Apple + sessions JWT + TOTP 2FA |
| **Pino / Sentry / Prometheus / Better Stack** | Logs, erreurs, métriques (MP18) |

## Démarrage rapide

```bash
# 1. Infrastructure (PostgreSQL, Redis, Meilisearch, MinIO, Mailpit)
docker compose up -d

# 2. Environnement
cp .env.example .env            # puis remplis DATABASE_URL, BETTER_AUTH_SECRET, …

# 3. Dépendances + migrations
npm install
npm run migrate

# 4. Lancer l'API (dev, hot reload)
npm run dev                     # http://localhost:3000

# 5. Vérifier
curl http://localhost:3000/health   # → {"status":"ok",...}
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur en mode watch |
| `npm run build` / `start` | Bundle esbuild (typecheck tsc) + exécution |
| `npm run typecheck` | Typecheck strict (`tsc --noEmit`) |
| `npm run lint` | ESLint (typescript-eslint) |
| `npm run test:unit` | Tests unitaires (rapides, sans services) |
| `npm run test:integration` | Tests d'intégration (services Docker requis) |
| `npm run test:coverage` | Couverture complète (unit + intégration) |
| `npm run migrate` / `migrate:generate` | Appliquer / générer les migrations Drizzle |
| `npm run migrate:prod` | Runner migrations bundle (production / image Docker) |
| `backend/scripts/seed-*.sql` | Jeux de données de dev (pas de script `npm run seed`) |
| `npm run studio` | Drizzle Studio (explorateur de schéma) |

## Observabilité (MP18)

- `GET /health`, `/health/live`, `/health/ready` — checks de dépendances.
- `GET /metrics` — métriques Prometheus (`http_requests_total`, `http_request_duration_seconds`, `queue_depth`, KPI métier).
- Dashboard Grafana provisionné : `grafana/dashboards/mcm-backend.json`.
- Démarrage : `docker compose -f docker-compose.observability.yml up -d` (Prometheus :9090, Grafana :3001).
- Logs → Better Stack si `BETTER_STACK_SOURCE_TOKEN` est défini ; erreurs → Sentry si `SENTRY_DSN` est défini.

Voir [architecture/overview.md](architecture/overview.md) et [observability/monitoring.md](observability/monitoring.md).

## Tests (MP17)

| Type | Outil | Où | Commande |
|---|---|---|---|
| Unitaires | Vitest | `tests/unit/` | `npm run test:unit` |
| Intégration | Vitest + services Docker | `tests/integration/` | `npm run test:integration` |
| Charge | k6 | `tests/load/` | `k6 run tests/load/feed.k6.ts` |
| CI | GitHub Actions | `.github/workflows/ci.yml` | lint + typecheck + build + unit + intégration + coverage |

## Sommaire de la documentation

- [Architecture](architecture/overview.md) — C4, modules, flux de données, WebSocket.
- [API](api/endpoints.md) — liste exhaustive des endpoints REST.
- [Base de données](database/schema.md) — schéma, migrations, indexation.
- [Sécurité](security/auth.md) — auth, rate limiting, modèle de menace, RBAC.
- [Algorithmes](algorithms/culture-engine.md) — Culture Engine, feed, love, amitié.
- [Scalabilité](scalability/roadmap.md) — roadmap, feed push/pull, sharding.
- [Déploiement & Ops](operations/deploy.md) — image Docker, GHCR, CI/CD, runbook (MP20).
- [ADR](decisions/adr-001-database.md) — décisions d'architecture.
