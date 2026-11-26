# 01 — Architecture frontend

## Stack

- React 19 + TypeScript 5.8, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`).
- TanStack Query 5 (`src/lib/queryClient.ts`) pour l'état serveur.
- Zustand 5 (`src/stores/`) pour l'état UI/session.
- Framer Motion / `motion` pour les transitions.
- `lucide-react` + `@tabler/icons-react` pour les icônes.
- `socket.io-client` utilisé uniquement par `services/locationRealtime.ts`.
- `maplibre-gl` pour la carte « Friends nearby ».
- `@google/genai` pour `services/aiAssistService.ts` (⚠️ clé exposée au navigateur).

## Arborescence fonctionnelle

```
src/
  pages/            AuthPage, OnboardingPage, ConnexionPage, SettingsPage,
                    NotificationsPage, AdminPage
  components/
    layout/         Header, Sidebar, search, menu profil, notifications
    feed/           MainFeedColumn, PostCard, PostHeader, PostActions,
                    comments, création de post, RecentPostsPanel
    explore/        ExploreColumn, cartes tribus, recherche, LoveColumn
    profile/        Profil façon Instagram, onglets Posts/Comments/Saved
    chat/, love/, connections/, requests/, stories/, tribu/, settings/, admin/, ui/
  hooks/            useFeed, useProfile, useCreatePost, useNotifications,
                    useMessages, useLove, useSettings, useAdmin, ...
  services/         api.ts (fetch), auth.token.ts, 25 services métier
  stores/           useAppStore, useUIStore, useConnectionsStore
  lib/              router.ts, postMapper.ts, themes.ts, compatibility/, validations.ts
  types/            post.ts, user.ts, notification.ts, explore.ts, chat.types.ts...
```

## Flux de données

```
Composant → hook (TanStack Query / mutation) → service → api.ts → /api/* (proxy Vite) → backend
                                      ↑
                         stores Zustand (état UI + session)
```

- `api.ts` ajoute `Authorization: Bearer <token>` depuis `localStorage` (`mcm.auth.token`) et `credentials: 'include'`.
- Les erreurs HTTP sont normalisées en `ApiError` avec `code`, `message`, `details`.
- `queryClient` : `staleTime` 2 min, `retry: 1`, `refetchOnWindowFocus: false`.

## Routage (History API, sans `#`)

`src/lib/router.ts` :

- `buildPath(tab, id)` → `/`, `/love`, `/explore`, `/profil/:id`, `/tribu/:id`, `/post/:id`, `/settings`, `/notifications`…
- `navigate(tab, id)` → `history.pushState` + `applyRoute()` (utilisé pour les liens explicites : post, retour Home).
- `syncFromStores()` → `history.replaceState` quand l'onglet/l'id change via les stores.
- `applyRoute()` → lit `location.pathname`, remplit les stores (`activeTab`, `selectedPostId`…).
- `startRouter()` → deep-link initial + écoute `popstate` + abonnements aux stores.

**Prod** : le serveur doit réécrire toutes les routes SPA vers `index.html` (Vite le fait en dev). Sans cela, un rafraîchissement sur `/post/:id` renvoie 404.

Anciens noms conservés pour compatibilité : `buildHash`, `applyHash` (ils renvoient désormais des chemins sans `#`).

## Stores

| Store | Responsabilité |
|---|---|
| `useAppStore` | `currentUser`, `isAuthenticated`, `isOnboarded`, `theme`, `feedSort`, `feedCulture`, `selectedPostId`, `selectedProfileUserId`, `selectedTribeId`, `profileActiveTab`, actions profil/tribu/login/logout |
| `useUIStore` | `activeTab`, `searchQuery`, sidebar (open/collapsed), chat popup, modale création tribu, `notificationsCount`, `likedPosts` |
| `useConnectionsStore` | liste locale des suggestions/relations |

## Configuration / variables d'environnement

**`vite.config.ts`**

- Alias `@` → racine du projet web.
- Proxy dev `/api` et `/health` → `http://localhost:3000`.
- `envPrefix: ['VITE_', 'GEMINI_']` — ⚠️ expose `GEMINI_API_KEY` au navigateur (voir `03-AUTH-SECURITE.md`).
- `DISABLE_HMR=true` désactive HMR et le watcher.

**Variables lues dans le code**

| Variable | Usage |
|---|---|
| `VITE_API_URL` | URL Socket.io (fallback `origin`) |
| `VITE_MEDIA_URL` | URL publique MinIO (fallback `http://localhost:9000/mcm-media`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OneTap / FedCM |
| `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY` | AI assist (⚠️ risque P0) |

## Dettes d'architecture visibles

- `src/lib/security/` est un dossier vide : aucune couche de sanitization, CSP, garde de route côté client.
- Aucun Error Boundary React : une erreur de rendu casse toute l'application.
- Plusieurs composants morts conservés (`PhotosTab`, `VideosTab`, `AboutTab`, `NotificationDropdown`, `ExploreTabs`, tabs Explore devenus inaccessibles).
- Les URLs propres nécessitent une règle de rewrite en production (à documenter côté déploiement).
