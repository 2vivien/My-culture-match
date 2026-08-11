# Sécurité — RBAC (Rôles & Permissions)

## Rôles plateforme

| Rôle | Usage |
|---|---|
| `user` | Utilisateur standard (défaut) |
| `moderator` | Modération des contenus et signalements |
| `admin` | Administration (rapports, bans, stats) |
| `superadmin` | Admin + gestion des admins |

## Endpoints protégés

- `requireAuth` : toutes les routes `/api/*` (sauf auth publique + health + metrics).
- `requireAdmin` : routes `/api/admin/*` (`src/modules/auth/require-admin.ts`).

## Permissions des routes admin

| Route | Permission |
|---|---|
| `GET /api/admin/reports` | admin+ |
| `POST /api/admin/reports/:id/action` | admin+ |
| `GET /api/admin/users` | admin+ |
| `POST /api/admin/users/:id/ban` / `unban` | admin+ |
| `GET /api/admin/stats` | admin+ |

## Rôles tribu (`tribe_role`)

| Rôle | Droits |
|---|---|
| `member` | Voir, poster, voter |
| `moderator` | Modérer les posts (pin/delete), signalements |
| `owner` | Tout : édition, suppression, règles, modérateurs |

Implémenté dans `src/modules/tribes/tribes.service.ts` : le créateur devient `owner` ;
seul l'owner peut gérer les règles et les modérateurs ; un non-membre ne peut pas poster.

## Vérifications côté propriété

Au-delà des rôles, les services vérifient la **propriété** :
- Post : seul l'auteur (ou admin) peut soft-delete.
- Conversation : seuls les participants peuvent lire/écrire.
- Settings/2FA : uniquement le propriétaire du compte.

## Implémentation

- `src/modules/auth/require-auth.ts` — lit la session et injecte `c.set('auth', { userId, email })`.
- `src/modules/auth/require-admin.ts` — vérifie `role` en DB.
- `src/modules/admin/admin.service.ts` — logique des actions admin + audit.
