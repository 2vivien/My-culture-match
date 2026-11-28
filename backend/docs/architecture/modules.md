# Modules

> Un paragraphe par module. La liste des endpoints est dans [`api/endpoints.md`](../api/endpoints.md).

| Module | Dossier | Rôle |
|---|---|---|
| Auth | `modules/auth/` | OTP email, OAuth Google/Apple, sessions JWT, logout |
| Onboarding | `modules/onboarding/` | Création du profil en 7 étapes (validation stricte) |
| Users / Profil | `modules/users/` | `GET/PATCH /api/users/me`, profil public |
| Settings | `modules/settings/` | Paramètres, 2FA TOTP, changement d'email |
| Uploads | `modules/uploads/` | Presigned URLs MinIO + queue de traitement média |
| Posts | `modules/posts/` | CRUD posts, likes, commentaires, partages, signets |
| Feed | `modules/feed/` | Fanout push, feeds following/foryou/new/popular, compteurs |
| Tribus | `modules/tribes/` | Communautés, règles, modérateurs, votes, pin |
| Connexions | `modules/connections/` | Suggestions, demandes, compagnons, blocage |
| Love | `modules/love/` | Candidats, swipe, match mutuel (transactions) |
| Messages | `modules/messages/` | Conversations, messages, non-lus, notifications cloche |
| Notifications | `modules/notifications/` | Notifications in-app + WS, accept/decline |
| Stories | `modules/stories/` | Stories 24h, vues, cleanup cron |
| Search | `modules/search/` | Recherche Meilisearch (users, posts, tribus) |
| Reports | `modules/reports/` | Signalement d'entités |
| Admin | `modules/admin/` | Modération, bannissement, stats (RBAC admin) |
| Moderation | `modules/moderation/` | Auto-modération IA + dead letter |
| Culture Engine | `modules/culture-engine/` | Vecteurs, scoring feed/love/amitié, health metrics |
| Email | `modules/email/` | Queue email (Brevo/SMTP), templates OTP i18n |
| Workers | `modules/workers/` | Crons : présence, sessions, suggestions |

## Infrastructure

| Dossier | Rôle |
|---|---|
| `infrastructure/database/` | Client `postgres` + `schema.ts` (tables Drizzle) + relations |
| `infrastructure/redis/` | Client ioredis (retry), `checkRedis` |
| `infrastructure/meilisearch/` | Client + `checkMeilisearch` |
| `infrastructure/minio/` | Client + bucket + `checkMinio` |
| `infrastructure/websocket/` | socket.io + Redis adapter, auth, présence |
| `infrastructure/monitoring/` | Sentry, Prometheus (metrics), Better Stack |

## Files d'attente (BullMQ)

| Queue | Nom | Rôle |
|---|---|---|
| Feed fanout | `feed.fanout` | Push du post aux followers |
| Indexation | `search.index` | Index/delete dans Meilisearch |
| Embedding | `post.embedding` | Vecteur culturel du post |
| Compteurs | `counters.flush` | Flush Redis → PG (batch 5 min) |
| Email | `email` | Emails transactionnels (i18n) |
| Médias | `media.process` | Sharp/FFmpeg |
| Modération | `moderation.scan` + DLQ | Scan toxique + dead letter |
| Culture batch | `culture-engine.batch` | Nightly 2h : vecteurs + santé |
| Crons | `presence.cleanup`, `session.cleanup`, `user.suggestions` | Tâches périodiques |

Les workers sont démarrés dans `src/index.ts` ; les schedulers dans `modules/workers/crons.ts`.
