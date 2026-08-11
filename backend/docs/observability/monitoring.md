# Observabilité & Monitoring (MP18)

> Objectif : système observable complet dès le JOUR 1. Trois piliers :
> **logs** (Pino + Better Stack), **erreurs** (Sentry), **métriques** (Prometheus + Grafana).

## 1. Logs structurés (Pino)

- Format **JSON** (pretty uniquement en dev via `pino-pretty`).
- Champs obligatoires : `timestamp`, `level`, `requestId`, `correlationId`, `userId`,
  `method`, `path`, `statusCode`, `durationMs`.
- **Redaction automatique** : `authorization`, `cookie`, `password`, `token` → `[REDACTED]`.
- `x-request-id` entrant repris (8-64 caractères) ou généré ; `x-correlation-id` propagé.

## 2. Sentry

- `initSentry()` au bootstrap (`SENTRY_DSN` requis).
- Contexte utilisateur (`userId`, email) + tag `requestId`.
- Capture de toutes les erreurs non gérées via `errorHandler` (`captureError`).
- No-op total si `SENTRY_DSN` absent → aucun impact hors prod.

## 3. Prometheus + Grafana

- `GET /metrics` (texte Prometheus) :
  - HTTP : `http_requests_total`, `http_request_duration_seconds` (labels method/path/status, chemin normalisé).
  - Métier : `posts_created_total`, `messages_sent_total`, `matches_created_total`, `notifications_sent_total`.
  - Infra : `queue_depth` (gauge BullMQ), métriques Node (`mcm_node_*`).
- **Dashboard provisionné** : `grafana/dashboards/mcm-backend.json` (API santé + KPI + infra).
- Démarrage local :
  ```bash
  docker compose -f docker-compose.observability.yml up -d
  # Prometheus http://localhost:9090 — Grafana http://localhost:3001 (admin/admin)
  ```

### Alertes (Prometheus rules)

`prometheus/alerts.yml` :
- Latence **p95 > 500 ms** (5 min).
- Taux d'erreur **> 1 %** (5xx).
- Profondeur de queue **> 1000 jobs**.
- Mémoire process **> 80 %**.
- KPI : aucun post créé pendant 1 h (info).

## 4. Better Stack

- Transport Pino actif si `BETTER_STACK_SOURCE_TOKEN` défini (batch HTTP 2 s).
- Agrégation des logs, alertes sur patterns d'erreur, uptime monitoring.
- File bornée (200 lignes) — jamais de blocage de la boucle d'événements.

## 5. Health checks

| Endpoint | Rôle | Réponse |
|---|---|---|
| `GET /health` | DB OK ? | 200 / 503 |
| `GET /health/live` | Process up (liveness) | 200 |
| `GET /health/ready` | Toutes dépendances (readiness) | 200 / 503 `{ checks }` |

Vérifie : PostgreSQL, Redis, Meilisearch, MinIO.

## 6. En prod

- `SENTRY_DSN` (prod) + `BETTER_STACK_SOURCE_TOKEN`.
- Grafana Cloud ou self-hosted ; alertes → PagerDuty/Opsgenie/Slack.
- Smoke tests après deploy + rollback auto si health KO 3 fois (CI/CD).

## Tests

- `tests/unit/observability.test.ts` — health 200/503, `/metrics` Prometheus, Sentry no-op + capture.
