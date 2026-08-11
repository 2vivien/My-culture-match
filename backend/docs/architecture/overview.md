# Architecture — Vue d'ensemble (C4)

## Contexte (C1)

```
[Utilisateur web] ──HTTPS──▶ My Culture Match  ──▶ PostgreSQL (Neon)
[App mobile (futur)] ──REST/WS──▶                ──▶ Redis
                                                 ──▶ Meilisearch
                                                 ──▶ MinIO
                                                 ──▶ SMTP (Brevo/Mailpit)
                                                 ──▶ Sentry / Better Stack / Prometheus
```

## Containers (C2)

```
┌──────────────────────────────────────────────────────────────┐
│                        API backend (Hono)                    │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │ HTTP REST │ │ WebSocket   │ │  BullMQ    │ │  Crons      │  │
│  │ /api/*    │ │ socket.io   │ │  workers   │ │  schedulers │  │
│  └──────────┘ └────────────┘ └────────────┘ └─────────────┘  │
│       │              │            │              │           │
│  Redis (cache, rate limit, sessions, compteurs, présence)     │
│  PostgreSQL (données de référence)                            │
│  Meilisearch (index de recherche)                             │
│  MinIO (médias, presigned URLs)                               │
└──────────────────────────────────────────────────────────────┘
```

## Bootstrap du serveur (`src/index.ts`)

1. `initSentry()` — capture d'erreurs si `SENTRY_DSN` défini.
2. `startNodeMetrics()` — métriques Node (GC, event loop, mémoire).
3. `ensureBucket()` — création du bucket MinIO (non bloquant si hors-ligne).
4. Démarrage des workers BullMQ : `email`, `counters.flush`, `moderation.scan`, `culture-engine.batch`.
5. `startCronWorkers()` + `startStoriesCleanup()` — crons périodiques.
6. `startQueueMetricsSampler()` — profondeur des queues → Prometheus.
7. Serveur HTTP (`serve`), socket.io sur le même port.
8. Shutdown gracieux sur `SIGINT`/`SIGTERM` (ferme connexions, clear des timers).

## Couches de code

```
src/
├── config/           # env.ts (Zod, fail fast)
├── infrastructure/   # clients externes : database, redis, meilisearch,
│                     # minio, websocket, monitoring (sentry, metrics, better-stack)
├── middleware/       # request-id, cors, logger, error-handler, require-auth, require-admin
├── modules/          # un dossier par domaine (auth, users, posts, feed, …)
│   └── */*.routes.ts     # déclaration des routes + validation Zod
│   └── */*.schemas.ts    # schémas Zod
│   └── */*.service.ts    # logique métier (DB, Redis, queues)
├── shared/           # utils purs : AppError, age, totp, usernames, rate-limit, enums
└── app.ts            # assemble l'app Hono (middleware + routes)
```

**Règle d'or** : les `routes` ne contiennent que l'HTTP ; la logique vit dans les `services` ;
les algorithmes purs vivent dans `modules/culture-engine/` et `shared/utils/`.

## Flux de requête typique

```
Client → requestId (X-Request-Id) → CORS → logger → metrics
       → auth (requireAuth, session Redis) → route (Zod validation) → service
       → réponse JSON { data } ou { error: { code, message, details? } }
```

Les erreurs passent par `error-handler.ts` : ZodError → 400, AppError → statut dédié,
autre → 500 + capture Sentry.
