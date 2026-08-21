# API — Endpoints

> Base URL : `http://localhost:3000` (dev). Toutes les routes `/api/*` sauf `auth/send-otp`, `auth/verify-otp`,
> `auth/google`, `auth/apple`, `auth/session`, `health` et `metrics` exigent un `Authorization: Bearer <token>`.

## Santé & Observabilité

| Méthode | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | DB OK → 200, sinon 503 |
| GET | `/health/live` | — | Liveness (process up) |
| GET | `/health/ready` | — | Readiness (toutes dépendances) |
| GET | `/metrics` | — | Métriques Prometheus (texte) |

## Auth

| Méthode | Path | Corps | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | `{ email }` | Envoie un OTP (cooldown) |
| POST | `/api/auth/verify-otp` | `{ email, code }` | Échange OTP → `{ token, user, isNewUser }` |
| POST | `/api/auth/google` | `{ idToken }` | OAuth Google |
| POST | `/api/auth/apple` | `{ idToken }` | OAuth Apple |
| POST | `/api/auth/logout` | — | Révoque la session |
| GET | `/api/auth/session` | — | Retourne l'utilisateur de session |

## Onboarding & Profil

| Méthode | Path | Description |
|---|---|---|
| POST | `/api/onboarding` | Création du profil (validation stricte) |
| GET | `/api/users/me` | Profil complet + stats |
| PATCH | `/api/users/me` | Mise à jour du profil |
| GET | `/api/users/:id` | Profil public (sans email) |

## Settings

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/settings` | Paramètres |
| PUT | `/api/settings` | Mise à jour partielle |
| POST | `/api/settings/2fa/start` | Génère secret TOTP + QR |
| POST | `/api/settings/2fa/verify` | Active 2FA après premier code |
| POST | `/api/settings/2fa/disable` | Désactive 2FA (TOTP requis) |
| POST | `/api/settings/email/request` | Demande de changement d'email |
| POST | `/api/settings/email/change` | Confirme le changement (token) |

## Uploads

| Méthode | Path | Description |
|---|---|---|
| POST | `/api/uploads/request` | Presigned URL MinIO |
| POST | `/api/uploads/complete` | Confirme l'upload → traitement média |
| GET | `/api/uploads/:uploadId/status` | Statut du traitement |

## Posts / Traditions

| Méthode | Path | Description |
|---|---|---|
| POST | `/api/posts` | Création (Text/Images/Link) |
| GET | `/api/posts/:id` | Détail |
| POST | `/api/posts/:id/like` | Like / unlike (toggle) |
| POST | `/api/posts/:id/comments` | Ajoute un commentaire |
| GET | `/api/posts/:id/comments` | Liste (cursor pagination) |
| POST | `/api/posts/:id/share` | Partage |
| POST | `/api/posts/:id/save` | Signet (toggle) |
| DELETE | `/api/posts/:id/save` | Retire le signet |
| DELETE | `/api/posts/:id` | Soft delete (auteur/admin) |

## Feed

| Méthode | Path | Query | Description |
|---|---|---|---|
| GET | `/api/feed` | `filter=following|foryou|new|popular&cursor&limit&culture` | Feed paginé |

## Tribus

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/tribes` | Liste (recherche, pagination) |
| POST | `/api/tribes` | Création |
| GET | `/api/tribes/:id` | Détail + stats |
| PATCH | `/api/tribes/:id` | Modification (owner) |
| DELETE | `/api/tribes/:id` | Suppression (owner) |
| POST | `/api/tribes/:id/join` / DELETE `/leave` | Membership |
| GET | `/api/tribes/:id/posts` | Posts de la tribu |
| GET | `/api/tribes/:id/rules` | Règles |
| GET | `/api/tribes/:id/moderators` | Modérateurs |
| POST | `/api/tribes/:id/posts` | Poster dans la tribu |
| POST / DELETE | `/api/tribes/:id/posts/:postId/pin` | Épingler / dépinner (mod+) |
| POST | `/api/tribes/:id/moderators` | Promouvoir |
| DELETE | `/api/tribes/:id/moderators/:userId` | Rétrograder |
| POST / PATCH / DELETE | `/api/tribes/:id/rules(/:ruleId)` | Gestion des règles |
| POST | `/api/tribes/:id/report` | Signaler la tribu |
| POST | `/api/tribes/:id/posts/:postId/report` | Signaler un post |
| GET | `/api/tribes/:id/reports` | Signalements (mod+) |
| POST | `/api/tribu/posts/:id/upvote` | Upvote/downvote (tribu) |

## Connexions

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/connections/suggestions` | Profils recommandés |
| GET | `/api/connections/interested` | Intéressés par moi |
| GET | `/api/connections/requests` | Demandes reçues |
| GET | `/api/connections/companions` | Compagnons |
| POST | `/api/connections/:userId/request` | Envoyer une demande |
| POST | `/api/requests/:id/accept` | Accepter |
| POST | `/api/requests/:id/decline` | Refuser |
| POST | `/api/requests/:id/block` | Bloquer |
| DELETE | `/api/connections/:userId` | Supprimer un compagnon |

## Love

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/love/matches` | Candidats avec matchScore |
| GET | `/api/love/matches/:id` | Détail candidat |
| POST | `/api/love/swipe` | `{ userId, action: like\|pass }` |

## Messages

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/conversations` | Liste (lastMessage, unreadCount) |
| POST | `/api/conversations` | Création manuelle |
| GET | `/api/conversations/:id/messages` | Historique (cursor) |
| POST | `/api/conversations/:id/messages` | Envoi (REST) |
| POST | `/api/conversations/:id/read` | Marquer lu |
| GET | `/api/messages` | Alias panneau |
| GET | `/api/messages/unread-count` | Total non-lus |
| POST | `/api/messages/:id/notifications` | Toggle cloche |

## Notifications

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/notifications` | Liste paginée |
| GET | `/api/notifications/unread-count` | Badge |
| PATCH | `/api/notifications/:id` | `{ isUnread }` |
| POST | `/api/notifications/read-all` | Tout marquer lu |
| POST | `/api/notifications/:id/accept` | Accepter (requête) |
| POST | `/api/notifications/:id/decline` | Refuser (requête) |

## Stories

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/stories` | Stories actives (connexions + mienne) |
| POST | `/api/stories` | `{ mediaUrl }` → expiration 24h |
| POST | `/api/stories/:id/view` | Marquer vue |

## Recherche

| Méthode | Path | Query |
|---|---|---|
| GET | `/api/search` | `q&type=users\|posts\|tribes\|all&limit&offset` |

## Reports (public)

| Méthode | Path | Description |
|---|---|---|
| POST | `/api/reports` | Signaler user/post/comment/message |

## Admin (RBAC `admin`/`superadmin`)

| Méthode | Path | Description |
|---|---|---|
| GET | `/api/admin/reports` | Signalements (statut, pagination) |
| POST | `/api/admin/reports/:id/action` | `warn\|suspend\|ban\|dismiss` |
| GET | `/api/admin/users` | Liste + recherche |
| POST | `/api/admin/users/:id/ban` | Ban (raison, durée) |
| POST | `/api/admin/users/:id/unban` | Unban |
| GET | `/api/admin/stats` | Métriques globales |
