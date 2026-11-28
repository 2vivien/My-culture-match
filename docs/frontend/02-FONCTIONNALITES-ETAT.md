# 02 — Fonctionnalités et état réel

✅ = implémenté et vérifié · ⚠️ = partiel / contourné / non branché · ❌ = absent ou cassé.

## Authentification & onboarding

| Fonctionnalité | État | Fichiers / endpoints | Notes |
|---|---|---|---|
| Connexion par OTP email | ✅ | `pages/AuthPage.tsx`, `services/authService.ts` | `/api/auth/send-otp`, `/api/auth/verify-otp` |
| Restauration de session | ✅ | `authService.restoreSession()` | `/api/auth/session`, puis `/api/users/me` |
| 2FA (TOTP) | ✅ | `authService` | `/api/auth/2fa/verify` |
| Google Sign-In / OneTap FedCM | ✅ | `AuthPage.tsx` | `VITE_GOOGLE_CLIENT_ID` requis |
| Apple Sign-In | ❌ | `AuthPage.tsx:165` | message « pas encore disponible » |
| Déconnexion | ✅ | `useAppStore.logout()` | `/api/auth/logout`, token effacé |
| Onboarding multi-étapes | ✅ | `pages/OnboardingPage.tsx`, `services/onboarding.service.ts` | `/api/onboarding` |

## Feed & publications

| Fonctionnalité | État | Fichiers / endpoints | Notes |
|---|---|---|---|
| Feed global | ✅ | `useFeed.ts`, `feedService.getPosts()` | `/api/feed?filter=for-you|popular` |
| Tris Best / Popular / New / Hot | ⚠️ | `useFeed.getFeedFilter()` | `Popular` → `popular` ; `New` et `Hot` retombent sur `for-you` (pas de filtre backend dédié) |
| Carte unique du feed | ✅ | `MainFeedColumn.tsx`, `PostCard flat` | tous les posts dans une carte, défilement interne |
| Création de post Texte / Images / Lien | ✅ | `CreatePostView.tsx`, `useCreatePost.ts` | `/api/posts` ; communauté **optionnelle** |
| Upload média | ⚠️ | `uploadService.ts`, `useCreatePost.ts` | `/api/uploads/request|complete|status` ; fallback `mock/` → URL locale |
| Commentaires (arbre + réponses + emojis) | ✅ | `useComments.ts`, `PostDetailPage.tsx` | `/api/posts/:id/comments` |
| Like / « flag » | ✅ | `PostActions.tsx` | `/api/posts/:id/like` |
| Repost dans une tribu | ✅ | `PostActions.tsx`, `ShareModal.tsx` | `/api/posts` avec `originalPostId` |
| Save (menu « Save this Post ») | ⚠️ | `PostHeader.tsx` | état **local uniquement** ; l'onglet Saved lit bien `/api/posts/saves/list` |
| Mute notifications d'un auteur | ⚠️ | `PostHeader.tsx` | état local uniquement |
| Report content | ⚠️ | `PostHeader.tsx` | `alert()` uniquement, aucun appel API |
| Recent Posts (panneau droit) | ✅ | `RecentPostsPanel.tsx` | réutilise le cache `['feed','Best']` ; textes sélectionnables |

## Communautés / tribus & exploration

| Fonctionnalité | État | Fichiers / endpoints | Notes |
|---|---|---|---|
| Liste / détails tribus | ✅ | `useExplore.ts`, `TribuDetailView.tsx` | `/api/explore`, `/api/tribes/:id` |
| Création de tribu | ✅ | `useCreateTribe.ts`, `createTribeService.ts` | `/api/tribes` ; topics validés côté backend (`posts` **et** `traditions`) |
| Règles et modérateurs | ✅ | `tribuService.ts`, `TribuSettingsView.tsx` | `/api/tribes/:id/rules|moderators` |
| Rejoindre une tribu depuis le feed/sidebar | ⚠️ | `useAppStore.joinTribe()` | état local, pas de POST persistant |
| Onglets Explore Tribu/Posts/Reels/Vidéo | ⚠️ | `ExploreColumn.tsx`, `useExplore.ts` | barre d'onglets retirée sur demande ; `activeSubTab` reste sur `Tribu`, les autres vues sont du code mort |
| Recherche globale | ✅ | `SearchBar.tsx`, `useSearch.ts` | `/api/search`, redirection vers Explore |

## Social / rencontres

| Fonctionnalité | État | Fichiers / endpoints | Notes |
|---|---|---|---|
| Suggestions / demandes / compagnons | ✅ | `useConnections.ts`, `useRequests.ts` | `/api/connections/*`, `/api/requests/*` |
| Carte « personnes proches » | ✅ | `PeopleNearbyMap*`, `geo.service.ts`, `locationRealtime.ts` | `/api/connections/nearby`, Socket.io |
| Love AI Chat | ✅ | `LoveColumn.tsx`, `loveService.ts` | `/api/love/conversation` ; phrases rapides, historique rétractable |
| Love search / swipe / matchs actifs | ✅ | `useLove.ts`, `loveService.ts` | `/api/love/search`, `/api/love/swipe`, `/api/love/matches`, `/api/love/search/quota` |
| Moteur de compatibilité local | ✅ | `lib/compatibility/` | scoring côté client, indépendant du backend |
| Messagerie (conversations, messages, réactions, pins) | ✅ | `chat.service.ts`, `useMessages.ts` | `/api/conversations/*` |
| Messages temporels / memory box / recap | ✅ | `chat.service.ts` | endpoints dédiés, UI dans `components/chat/` |
| Temps réel du chat | ⚠️ | `services/locationRealtime.ts` | Socket.io utilisé pour la **localisation** seulement ; le chat repose sur fetch/polling |
| Stories | ✅ | `useStories.ts`, `storiesService.ts` | `/api/stories`, upload avec fallback mock |

## Profil, paramètres, notifications, admin

| Fonctionnalité | État | Fichiers / endpoints | Notes |
|---|---|---|---|
| Profil façon Instagram | ✅ | `ProfilePage.tsx`, `ProfileHeader.tsx` | stats, bio, Edit/Share, point vert |
| Onglets Posts / Comments / Saved | ✅ | `ProfileTabs.tsx`, `tabs/` | Comments = commentaires écrits sur ses propres posts ; Saved = `/api/posts/saves/list` |
| Menu profil du header | ✅ | `UserProfileDropdown.tsx` | lignes type Reddit, séparateurs, confirmation logout |
| Notifications (page dédiée) | ✅ | `NotificationsPage.tsx` | marquer tout comme lu `/api/notifications/read-all`, statut `/api/notifications/:id` |
| Effacer les notifications | ⚠️ | `NotificationsPage.tsx` | masquage local (`cleared`), pas de suppression API |
| Paramètres (7 onglets) | ✅ | `SettingsPage.tsx`, `settings/sections/` | compte, profil, confidentialité, trust & safety, préférences, notifications, email |
| Changement d'email / 2FA | ✅ | `useEmailChange.ts`, `useSettings.ts` | `/api/settings/email/*`, `/api/settings` |
| Administration | ✅ | `useAdmin.ts`, `pages/AdminPage.tsx` | stats, users, reports, logs, health |
| AI assist (conseils de conversation) | ⚠️ | `aiAssistService.ts` | appelle Gemini **depuis le navigateur** avec une clé exposée |
| Bascule de thème | ⚠️ | `useAppStore.theme`, `UserProfileDropdown` | retirée de la sidebar mais toujours disponible dans le menu profil |
