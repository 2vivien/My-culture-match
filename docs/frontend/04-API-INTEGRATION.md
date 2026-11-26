# 04 — Intégration API

## Client HTTP

`services/api.ts` : `fetch` minimal, base `''` (proxy Vite `/api` → `localhost:3000` en dev).

- JSON automatique quand un `body` est fourni.
- `Authorization: Bearer <token>` si présent, `credentials: 'include'`.
- Erreurs normalisées : `ApiError(status, code, message, details)`.
- `204` → `undefined` ; réponse non-JSON → `undefined`.

## Endpoints par domaine (relevés dans `src/services/`)

### Auth / session
`/api/auth/send-otp`, `/verify-otp`, `/2fa/verify`, `/session`, `/logout`, `/google`, `/apple`.

### Utilisateurs / profil
`/api/users/me`, `/api/users/:id`, `/api/onboarding`.

### Feed / posts / commentaires
`/api/feed?filter=…`, `/api/posts`, `/api/posts/:id/like`, `/api/posts/:id/comments`, `/api/posts/saves/list`, `/api/tribes/:id/posts`, `/api/tribu/posts/:id/upvote`.

### Tribus / exploration / recherche
`/api/tribes`, `/api/tribes/mine`, `/api/tribes/:id`, `/api/tribes/:id/rules`, `/api/tribes/:id/moderators`, `/api/explore`, `/api/search?…`.

### Social
`/api/connections/suggestions|interested|requests|companions`, `/api/connections/:id/request`, `/api/requests/:id/:action`, `/api/connections/nearby`.

### Love
`/api/love/conversation`, `/api/love/search`, `/api/love/search/quota`, `/api/love/swipe`, `/api/love/matches`, `/api/love/active`.

### Chat / mémoire
`/api/conversations`, `/api/conversations/:id/messages`, `/…/messages/:id`, `/…/reactions`, `/…/reply`, `/…/typing`, `/…/read`, `/…/pins`, `/api/conversations/:id/temporal-messages`, `/…/relationship-memory/rebuild`, `/…/relationship-timeline`, `/…/relationship-recaps`, `/…/relationship-capsules`, `/…/memory-box`, `/api/messages`.

### Notifications
`/api/notifications`, `/api/notifications/:id`, `/api/notifications/:id/:action`, `/api/notifications/read-all`.

### Stories / uploads / paramètres / admin
`/api/stories`, `/api/uploads/request|complete|status`, `/api/settings`, `/api/settings/email/request|change`, `/api/admin/stats|users|reports|logs|health|analytics|activity`.

> Certains chemins apparaissent avec `:id` dans les commentaires et `${id}` dans le code : c'est le même endpoint, pas une duplication.

## Correspondance services → hooks

| Service | Hooks principaux | Cache TanStack |
|---|---|---|
| `feedService`, `postService` | `useFeed`, `useCreatePost` | `['feed', feedSort]`, `['tribu-posts']` |
| `authService`, `userService` | `App`, `useProfile` | `['user', id]` |
| `notificationService` | `useNotifications` | `['notifications']` |
| `loveService` | `useLove`, `LoveColumn` | état local + quota |
| `chat.service`, `messagesService` | `useMessages`, `useUnreadMessagesCount` | `['conversations']` |
| `settingsService` | `useSettings`, `useEmailChange` | `['settings']` |
| `adminService` | `useAdmin` | `['admin', …]` |
| `exploreService`, `searchService` | `useExplore`, `useSearch` | `['explore']`, `['search']` |

## Incohérences relevées

1. **Save** : `PostHeader` ne fait qu'un `setSaved` local ; l'API `/api/posts/saves/list` n'est lue que par `SavesTab`. Le toggle n'est pas persisté.
2. **Join tribu** : `joinTribe()` modifie `currentUser.tribes` localement ; aucun POST.
3. **Report / Mute** : UI locale (`alert()` / `setMuted`), aucun endpoint.
4. **Upload** : fallback `objectKey.startsWith('mock/')` → `URL.createObjectURL(file)` ; l'URL locale meurt au rechargement.
5. **Tri New/Hot** : les deux envoient `filter=for-you` ; le backend a bien `new`, mais le front ne l'utilise pas (`getFeedFilter`).
6. **Notifications clear** : masquage local, pas de suppression serveur.
7. **AI assist** : appelle directement Gemini depuis le navigateur (voir `03-AUTH-SECURITE.md`).
8. **Endpoint `/api/tribu/posts/:id/upvote`** : présent dans `tribuService.ts`, naming différent de `/api/posts/:id/like` ; à vérifier côté backend.

## Gestion des erreurs

- `ApiError.code` est affiché dans certains écrans (auth, settings), pas partout.
- Les mutations utilisent `console.error` dans `useCreatePost` et quelques hooks : peu d'erreurs utilisateur.
- Aucun retry spécifique sur 401/403 : un token expiré est effacé seulement au `restoreSession` suivant.
