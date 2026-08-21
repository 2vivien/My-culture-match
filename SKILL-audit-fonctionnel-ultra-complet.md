# AUDIT FONCTIONNEL ULTRA-COMPLET — MY CULTURE MATCH

> **Objectif** : catalogue exhaustif de **chaque page, composant, fonctionnalité et sous-fonctionnalité** du site web (`myculturematch-web`), servant de **spécification pour construire le backend**.
> Pour chaque entrée : à quoi ça sert, quelles données sont manipulées, quelles actions sont déclenchées, et **quels endpoints / modèles backend** sont à prévoir.
> Audit réalisé sur la base d'une lecture exhaustive du code source (pages, composants, services, stores, hooks, types, mocks).

---

## 1. VUE D'ENSEMBLE

### 1.1 Nature du produit
Réseau social **interculturel** : connecter les personnes à travers leurs **traditions, tribus, cultures et affinités** (matching culturel). Concepts fondateurs :

| Concept | Définition |
|---|---|
| **Tradition** | Contenu culturel publié (texte, image, lien) rattaché à une tribu et à des tags |
| **Tribu** | Communauté culturelle (type subreddit) : posts, règles, modérateurs, membres |
| **Connexion** | Relations : suggestions, intérêts mutuels, demandes, compagnons |
| **Love** | Matching amoureux avec score de compatibilité, swipe-like, célébration |
| **Totem** | Profil personnel détaillé : niveau, statistiques, onglets de contenu |
| **Story** | Stories éphémères type réseaux sociaux |
| **Chat / Messages** | Messagerie : conversations, médias partagés, notes vocales, fichiers, réponses auto |
| **Notification** | Commentaires, likes, invitations, demandes de connexion |

### 1.2 État d'avancement technique
- L'application fonctionne **entièrement en mode mock** (`VITE_USE_MOCK=true` par défaut, via `src/services/api.ts`).
- Les **services** appellent déjà de **vrais endpoints REST** quand `VITE_USE_MOCK=false` : c'est la **liste des endpoints backend à implémenter** (cf. §12).
- Les fichiers `src/mocks/*.json` définissent les **formes exactes des réponses API attendues** : le backend doit retourner ces structures.
- Client HTTP : `api.get/post/put/patch/delete` (`src/services/api.ts`) avec base `VITE_API_URL`.

### 1.3 Stack frontend
| Élément | Technologie |
|---|---|
| Framework | React + Vite + TypeScript |
| État global | Zustand (3 stores : `useAppStore`, `useUIStore`, `useConnectionsStore`) |
| Data fetching | TanStack Query (react-query) + services dédiés + hooks `use*` |
| Validation | Zod (`src/lib/onboarding.schemas.ts`) |
| Animations | Framer Motion |
| UI | Tailwind CSS + composants shadcn/ui (avatar, badge, button, input) |
| Géo | `react-country-state-city` (pays, états, villes, langues) |
| Icônes | lucide-react + SVG custom |

### 1.4 Routage / points d'entrée (`App.tsx`)
Pas de routeur : l'application bascule sur l'état `activeTab` (Zustand) et sur les flags de session.

```
!isAuthenticated → AuthPage
!isOnboarded     → OnboardingPage
sinon            → App shell (Sidebar + Header + colonne selon activeTab)
```

`activeTab` gère : `Home | Popular | New | Explore | Connexion | Love | Tribu | Totem | Create | Settings | TribuSettings` + `Messages` (ouvre le ChatPopup flottant). Le `RightPanel` (suggestions/annonces) n'apparaît que sur les onglets Feed.

### 1.5 Stores (état global)
| Store | Rôle | Données clés |
|---|---|---|
| `useAppStore` | Session, profil courant, préférences | `theme`, `locale`, `feedSort`, `feedCulture`, `currentUser`, `selectedTotemUserId`, `profileActiveTab`, `isAuthenticated`, `isOnboarded`, `email`, `profileDetails` + actions (`loginUser`, `logout`, `joinTribe`, `toggleTheme`…) — persiste en localStorage |
| `useUIStore` | UI navigation | `activeTab`, `sidebarOpen/Collapsed`, `searchQuery`, `notificationsCount` (9 par défaut), `showCreateTribeModal`, `isChatOpen` + actions |
| `useConnectionsStore` | État des connexions | `activeSubTab`, listes `suggestions`, `interested`, `demandes`, `compagnons` + `sendRequest`, `acceptRequest`, `declineRequest` |

---

## 2. PARCOURS UTILISATEUR GLOBAL

```
1. Connexion (AuthPage) : saisie email → Continue
2. Onboarding (7 étapes) : identité → genre/orientation → âge → racines → langues → intention → CGU
3. Accueil (Feed) : feed, stories, panneau droit
4. Navigation principale :
   - Home/Popular/New → Feed trié (Best / Popular / New)
   - Explore          → Tribus + connexions + images + vidéos + accès Love
   - Connexion        → Suggestions / Interested / Demandes / Compagnons
   - Love             → Cartes de match + détails + célébration
   - Tribu            → Détail d'une tribu (posts, règles, modérateurs, à propos)
   - Totem            → Profil complet (Posts/Photos/Videos/Traditions/About/Saves)
   - Messages         → Panneau messages + ChatPopup flottant (chat)
   - Create (+)       → Créer une tradition (texte / images / lien)
   - Settings         → Paramètres du compte
5. Création de tribu : via Explore → bouton "Create Tribe" → modal
```

---

## 3. DOMAINE AUTH & ONBOARDING

### 3.1 AuthPage (`pages/AuthPage.tsx`)
**Rôle** : écran de connexion (email uniquement dans la version actuelle).

| Composant | Fonctionnalités | Actions / données |
|---|---|---|
| `AuthIllustration` | Visuel branding à gauche | — |
| `AuthHeader` | Logo + titre | — |
| `AuthForm` | Champ **email** + bouton "Continue" | `setEmail(email)` → `setAuthenticated(true)` → `setOnboarded(false)` (simulation 600 ms) |
| `AuthSocialButtons` | Boutons **Google / Apple** | Non branchés (visuels uniquement) → à câbler : OAuth Google, Sign in with Apple |
| `AuthFooter` | "Sign in with phone", "Forgot password", "Create account" | Placeholders / logique de bascule |

**⚠️ Backend à prévoir** :
- `POST /api/auth/send-otp` (email → code) et `POST /api/auth/verify-otp` (ou login direct par email).
- `POST /api/auth/google` / `POST /api/auth/apple` (échange id_token → session).
- `POST /api/auth/logout`.
- Gestion de session : le store persiste `isAuthenticated` en localStorage (`app-store`) — le backend devra fournir un token et un endpoint `GET /api/users/me`.

### 3.2 OnboardingPage (`pages/OnboardingPage.tsx` + `components/onboarding/`)
**Rôle** : collecte du profil en 6 étapes validées (Zod) + étape 7 (CGU).

| Étape | Champs collectés (`OnboardingData`) | Validation |
|---|---|---|
| 1 | `name`, `username`, `avatarSeed` | name ≥ 2 ; username ≥ 3, regex `[a-zA-Z0-9._]` |
| 2 | `gender`, `seeking` | requis |
| 3 | `birthdate`, `age` | **âge ≥ 18** (règle bloquante) |
| 4 | `roots`: `country`, `region`, `ethnicity`, `village` | pays/région/ethnie requis |
| 5 | `languages` (≥ 1) | minimum 1 langue |
| 6 | `intention` | requis |
| 7 | `acceptedTermsAt` (timestamp) | CGU acceptées |

**Logique métier** :
- `calculateAge(birthdate)` : calcul d'âge exact (anniversaire non atteint → -1 an).
- `generateUsernameSuggestions(fullName)` : 3 suggestions de pseudo (prénom.nom, prénom_nom_NN, nom_prénom…).
- `submitProfile(payload)` → **`POST /api/onboarding`** avec `OnboardingData + email + acceptedTermsAt`.

**Référentiels embarqués** (`services/onboarding.service.ts`) :
- `DOMAINS` (domaine pro) : tech, business, creative, medical, other.
- `VALUES` (12) : foi, famille, ambition, tradition, solidarité, communication, paix, indépendance, loyauté, liberté, éducation, santé.
- `LANGUAGES` : `intl` (5), `africa` (14), `diaspora` (2).
- `CRITERIA` (13 critères de compatibilité) : Communication, Respect mutuel, Foi partagée, Ambition commune, Humour, Stabilité financière, Tendresse, Honnêteté, Passion, Autonomie, Projet familial, Culture, Proximité.

**⚠️ Backend à prévoir** :
- `POST /api/onboarding` — crée/valide le profil initial (transformation `OnboardingData` → `User`).
- Vérifier unicité du `username` côté serveur.
- Référentiels (pays/états/villes/langues) : actuellement client via `react-country-state-city` — à décider si le backend les expose.

### 3.3 Complétion de profil (`components/profile/ProfileCompletionPanel.tsx`)
**Rôle** : panneau invitant l'utilisateur à compléter les champs optionnels déplacés du formulaire d'onboarding vers le profil.
- Champs : `occupation { domain, title }`, `values[]`, `preference`, `diaspora`, `familyQuiz`, `situation`, `criteria[]`, `bio` (type `ProfileDetails`).
- `isProfileDetailFilled(field, value)` : détecte si le champ est rempli (tableau non vide, objet avec domain, bio ≥ 10 caractères…).
- Actions : `updateProfileDetail`, `resetProfileDetails` (`useAppStore`).

**⚠️ Backend à prévoir** : endpoint de mise à jour du profil :
- `PATCH /api/users/me` (ou `PUT /api/profile`) — champ par champ ou objet complet `ProfileDetails`.

---

## 4. LAYOUT / NAVIGATION

### 4.1 Sidebar (`components/layout/Sidebar.tsx` + `parts/SidebarNav.tsx`)
**Rôle** : navigation principale (logo, items, footer utilisateur), repli mini.

| Item | activeTab | Action secondaire |
|---|---|---|
| Home | Home | `setFeedSort('Best')` |
| Popular | Popular | `setFeedSort('Popular')` |
| New | New | `setFeedSort('New')` |
| Explore | Explore | — |
| Connexion | Connexion | — |
| Love | Love | — |
| Tribu | Tribu | clic neutre (menu dédié ailleurs) |
| Totem | Totem | `setSelectedTotemUserId('user-current')` |
| Messages | — | **ouvre le ChatPopup** (`openChat()`) — badge `+09` |

**Parties** : `SidebarLogo`, `SidebarMiniNav` (mode replié), `SidebarNav`, `SidebarFooter` (avatar/nom + lien réglages).

**⚠️ Backend** : le badge "non-lus" doit venir de l'API → compteur de messages/notifications non-lus (ex. `GET /api/users/me` enrichi ou `GET /api/notifications/unread-count`).

### 4.2 Header (`components/layout/Header.tsx` + `parts/`)
| Élément | Rôle |
|---|---|
| `SearchBar` | Recherche globale → état `searchQuery` (useUIStore) — **non branchée à l'API actuellement** |
| `NotificationDropdown` | Liste des notifications + "mark all read" + "view all" (voir §9) |
| `UserProfileDropdown` | Menu profil : accès Totem, Settings, logout |
| `CreateTraditionDialog` | Bouton "+" → ouvre `CreateTraditionView` |
| Toggle thème | Clair/sombre (`toggleTheme`, persiste localStorage) |
| Sélecteur locale | `setLocale` (store app) |

**⚠️ Backend** : `POST /api/notifications/read-all` (existe déjà dans `notificationService`), recherche globale `GET /api/search?q=...` à implémenter.

---

## 5. FEED (HOME / POPULAR / NEW)

### 5.1 MainFeedColumn (`components/feed/MainFeedColumn.tsx`)
**Rôle** : colonne principale du feed : `StoriesPanel` + `FeedFilterToggle` + `CreatePostBox` + liste de `PostCard`. Le `RightPanel` s'affiche à droite.

**Données** : `Post[]` (`types/post.ts`), shape issue de `mocks/feed.json` :
```
{
  id: string,
  author: { id, name, avatar, location },
  text: string,
  image?: string,
  likes, comments, views: number,
  date: string,            // affichage relatif ("Today", "Yesterday", …)
  createdAt: ISO string,
  tribe?: { id, name },
  tags?: string[]
}
```

### 5.2 FeedFilterToggle
- Bascule **"Following" / "For You"**.
- `feedService.getPosts(filter)` → **`GET /api/feed?filter=following|for-you`** (mock : for-you = liste inversée).

### 5.3 PostCard (`components/feed/PostCard.tsx` + `PostHeader`, `PostImage`, `PostActions`)
- `PostHeader` : avatar, nom, location, tribu rattachée, date.
- `PostImage` : image du post.
- `PostActions` : **like**, **commentaire**, **partage**, **signet (save)** + compteurs.
- Tri du feed : `Best` / `Popular` / `New` selon `feedSort` (store), plus filtre `feedCulture` (thématiques, cf. §11).

**⚠️ Backend à prévoir (feed / posts)** :
- `GET /api/feed?filter=following|for-you&sort=best|popular|new&culture=...` (pagination à prévoir).
- `POST /api/posts` (création), `GET /api/posts/:id` (détail), `GET /api/posts/:id/comments`.
- `POST /api/posts/:id/like` (+ unlike), `POST /api/posts/:id/comments`, `POST /api/posts/:id/share`, `POST /api/posts/:id/save` / `DELETE /api/posts/:id/save`.
- Notifications générées par ces actions (comment, like → §9).

### 5.4 CreateTraditionView (`components/feed/CreateTraditionView.tsx` + `components/create-tradition/`)
**Rôle** : création d'une **tradition** (le contenu culturel principal de l'app). 3 onglets (type `TraditionSubmission`, `types/createTradition.ts`) :

| Onglet | `type` | Champs |
|---|---|---|
| Text | `'Text'` | `title`, `body?`, `tags?`, `tribeId?` |
| Images | `'Images'` | `title`, `mediaUrl?`, `tribeId?` |
| Link | `'Link'` | `title`, `linkUrl?`, `tribeId?` |

Composants : `CreateTraditionHeader`, `CreateTraditionTabs`, `CreateTraditionTextForm`, `CreateTraditionMediaForm`, `CreateTraditionLinkForm`, `TribuSelector` (liste `TribeOption { id, name, avatar }`).

**⚠️ Backend à prévoir** :
- `POST /api/traditions` (body `TraditionSubmission`).
- `GET /api/tribes` (tribus du sélecteur).
- Upload média : `POST /api/uploads` (image) → URL.
- La soumission alimente le feed (la tradition devient un `Post` avec `tribe` + `tags`).

---

## 6. STORIES

### 6.1 StoriesPanel (`components/stories/StoriesPanel.tsx` + `StoryAvatar`)
**Rôle** : bande horizontale de stories en haut du feed.
- Premier item **"My Story"** (`isAdd: true`) → bouton "+" (ajout de story).
- `storiesService.getStories()` → **`GET /api/stories`** ; `addStory(img)` → **`POST /api/stories`**.
- Story : `{ id, name, img?, isAdd? }` (`types/story.ts`).

**⚠️ Backend à prévoir** :
- `GET /api/stories` (stories des connexions + "My Story").
- `POST /api/stories` (upload image → objet Story).
- **Vue plein-écran de story manquante côté front** — à confirmer côté produit (visionneuse, auto-advance, expiration 24 h).

---

## 7. EXPLORE

### 7.1 ExploreColumn (`components/explore/ExploreColumn.tsx`)
**Rôle** : hub d'exploration avec onglets `'Tribu' | 'Connexion' | 'Images' | 'Vidéo'` (`types/explore.ts`) + colonne Love.
Composants : `ExploreHeader`, `ExploreTabs`, `ExploreCategories`, `ExploreTribesTab`, `ExploreConnectionsTab`, `ExploreImagesTab`, `ExploreVideosTab`, `ExploreLightbox`.

**Données `mocks/explore.json`** :
```
tribes:      { id, name, tag, visitors ("4.6M"), desc, avatar, joined, glow }
moreTribes:  idem (liste "voir plus")
companions:  { id, name, avatar, matchScore, level, glow, interests[], connected }
images:      { id, url, title, likes ("12K"), comments ("342"), category }
videos:      { id, thumbnail, title, duration ("2:45"), plays ("450K"), category }
```
`glow` : `'turquoise' | 'violet' | 'amber' | 'emerald' | 'none'`.

### 7.2 ExploreTribesTab + TribeCard
- Carte tribu : avatar, nom, tag, visiteurs, description, bouton **Join / Joined**.
- `ExploreCategories` : filtre par catégorie (`exploreCategories = ['All', ...launchThemes]`).
- "See more" → liste `moreTribes`.
- Clic sur une tribu → **`TribuDetailView`**.
- Bouton **"Create Tribe"** → **`CreateTribeModal`**.

### 7.3 CreateTribeModal (`components/explore/CreateTribeModal.tsx` + `create-tribe/`)
**Rôle** : création de tribu en 2 étapes.
- Type `TribeSubmission` (`types/createTribe.ts`) : `name`, `description?`, `topic`, `tags?`, `rules?`, `avatar?`.
- Étape 1 : nom + description + sélection d'un **topic** (26 topics, `mocks/createTribe.json` + `lib/themes.ts` — ex. Anime & Cosplay, Art, Music…).
- Étape 2 : règles de la communauté (2+ règles), image de couverture/avatar.
- `createTribeService.getTopics()` (depuis `launchThemes`/`themeIcons`), `submitTribe(data)` → **`POST /api/tribes`**.

### 7.4 ExploreConnectionsTab
- Affichage des `companions` (candidats au matching) : score, niveau, intérêts, bouton **Connect** (état `connected`).

### 7.5 ExploreImagesTab / ExploreVideosTab + ExploreLightbox
- Grilles d'images/vidéos culturelles avec compteurs (likes/comments, plays).
- `ExploreLightbox` : visionneuse plein-écran d'une image (navigation, fermeture).
- Catégories filtrables (ex. Rituals & Ceremonies, Weaving & Crafts, Ancestral Art, Gastronomy, Mythology & Tales).

### 7.6 TribuDetailView (`components/explore/TribuDetailView.tsx`)
**Rôle** : page détaillée d'une tribu (type subreddit).
- En-tête tribu : bannière, nom, tag, visiteurs, description, bouton **Join**, bouton **Settings** → `TribuSettingsView`.
- Onglets internes (tribu) : **Posts / About / Mods / Rules** → `TribuPostCard`, `TribuAbout`, `TribuMods`, `TribuRules`.

**Données `mocks/tribu.json`** :
```
posts:       { id, author ("u/YamatoScholar"), timeAgo, title, tagText, tagColor, mediaUrl?, upvotes, commentsCount }
rules:       { number, title, desc }
moderators:  { name ("u/YamatoElder"), role ("Head Elder"), avatar }
```

**⚠️ Backend à prévoir (tribu)** :
- `GET /api/tribes/:id` (détail complet).
- `GET /api/tribu/posts`, `GET /api/tribu/rules`, `GET /api/tribu/moderators` (ou namespaced sous `/api/tribes/:id/...`).
- `POST /api/tribes/:id/join` / `DELETE` (leave) ; bouton `joinTribe` met aussi à jour le `currentUser.tribes`.
- `POST /api/tribes/:id/posts` (poster dans la tribu), votes (`POST /api/tribu/posts/:id/upvote`).
- `TribuSettingsView` : paramètres de la tribu (nom, description, règles, image, suppression) → `PATCH /api/tribes/:id`.

### 7.7 LoveColumn (accès depuis Explore) — voir §8.2

---

## 8. LOVE (MATCHING AMOUREUX)

### 8.1 Données (`types/love.ts`, `mocks/love.json`)
```
LoveMatch: { id, name, age, gender, country, flag (emoji), avatar,
             matchScore, online, interest, about }
```

### 8.2 LoveColumn (`components/explore/LoveColumn.tsx`)
**Rôle** : colonne "Love" avec cartes de match.
- `LoveHeader`, `LoveActiveMatches` (tuiles des matches actifs).
- `LoveCard` : profil détaillé (photo, âge, pays/drapeau, score de compatibilité, "interest", "about") + actions **Match / Pass / Like** (swipe-like).
- `LoveDetailModal` : détails complets d'un profil.
- `LoveMatchCelebrate` : écran de célébration quand un match est accepté (confettis, message).

**Services** : `loveService.getLoveMatches()` (mock synchrone) et `fetchLoveMatches()` → **`GET /api/love/matches`**.

**⚠️ Backend à prévoir** :
- `GET /api/love/matches` (candidats + score de compatibilité — le **score est à calculer côté backend**).
- `POST /api/love/swipe` `{ userId, action: 'like' | 'pass' }` (matching mutuel → conversation créée).
- `GET /api/love/matches/:id` (détail).
- Gestion du **match mutuel** (quand les deux se likent → notification + création d'une conversation + ajout aux compagnons).

---

## 9. CONNEXIONS (RÉSEAU SOCIAL)

### 9.1 ConnexionPage (`pages/ConnexionPage.tsx` + `hooks/useConnections.ts` + `useConnectionsStore`)
**Rôle** : gestion des relations. 4 sous-onglets : **Suggestions / Interested / Demandes / Compagnons**.

| Sous-onglet | Liste | Actions |
|---|---|---|
| Suggestions | profils recommandés | **Connect** (envoie une demande) |
| Interested | profils "intéressés" par moi | **Connect** (accepte/matche) |
| Demandes | demandes reçues | **Accept** / **Decline** |
| Compagnons | connexions établies | Message (ouvre ChatPopup), Infos, Supprimer |

**Données `mocks/connections.json`** :
```
ConnectionUser: { id, name, avatar, matchScore, country, countryFlag, countryCode,
                  interestedCount, compagnonsCount, interests[], online?, age?, gender? }
```
- `sendRequest(id)` : retire le profil de Suggestions/Interested (simulation).
- `acceptRequest(id)` : déplace de Demandes → Compagnons (online: true).
- `declineRequest(id)` : retire de Demandes.
- `ConnectionsSearch` : **recherche locale** par nom (case-insensitive) — à relier à l'API.
- `ConnectionsTabs` : compteurs par onglet.
- Cartes : `UserCard`/`UserRow` (Suggestions, Interested), `RequestCard`/`RequestRow` (Demandes), `CompanionCard`/`CompanionRow` (Compagnons), `StatsHeader` (stats globales), `ConnectionsEmptyState` (état vide).

### 9.2 Requests (demandes reçues — panneau séparé)
`components/requests/RequestCard.tsx` + `mocks/requests.json` + `requestsService` :
```
RequestItem: { id, name, avatar, actionText ("veut se connecter avec vous"),
               timeAgo, badgeType ('heart' | ...), connectionsCount, connectedCount }
```
Actions : **Okay** (accepter) / **Block** (bloquer) → `POST /api/requests/:id/okay` et `POST /api/requests/:id/block`.

**⚠️ Backend à prévoir (connexions)** :
- `GET /api/connections/suggestions`
- `GET /api/connections/interested` (intéressés par moi)
- `GET /api/connections/requests` (demandes reçues)
- `GET /api/connections/companions` (connexions établies)
- `POST /api/connections/:userId/request` (envoyer demande)
- `POST /api/requests/:id/accept` | `decline` | `block`
- `DELETE /api/connections/:userId` (supprimer un compagnon)
- Le **blocage** doit avoir un effet global (filtrage dans feed/chat/explore).

---

## 10. TOTEM (PROFIL)

### 10.1 TotemProfile (`components/totem/TotemProfile.tsx` + `hooks/useTotemProfile.ts`)
**Rôle** : profil complet d'un utilisateur (le sien ou celui d'un autre via `selectedTotemUserId`).

### 10.2 ProfileHeader
- Avatar (avec `glow` : orange, turquoise, violet, red, blue…), nom, `@username`, localisation, locale/langues, **niveau** (level).
- Statistiques : `traditionsCount`, `culturesCount`, `tribesCount`, `interestedCount`, `companionsCount`.
- Boutons : **Follow**, **Message**, **Match** (selon contexte).
- `useAppStore.currentUser` : `{ id, name, avatar, locale, level, glow, location, tribes[], traditionsCount, culturesCount, tribesCount, interestedCount, companionsCount }` (`types/user.ts`).

### 10.3 ProfileTabs (`components/totem/tabs/`)
| Onglet | Contenu |
|---|---|
| Posts | Posts/traditions publiés par l'utilisateur |
| Photos | Galerie photos |
| Videos | Vidéos |
| Traditions | Traditions partagées (compteur) |
| About | Profil détaillé (`ProfileDetails` : occupation, valeurs, langues, critères, bio…) |
| Saves | Contenus enregistrés (signets) |

### 10.4 Services (`userService`)
- `fetchUserById(id)` → **`GET /api/users/:id`** (fallback mock `user-current`).
- `fetchCurrentUser()` → **`GET /api/users/me`**.
- En mock, lecture dans `mocks/users.json` (clé = id).

**⚠️ Backend à prévoir** :
- `GET /api/users/:id` — profil public (stats + tribus + contenu).
- `GET /api/users/me` — profil privé courant (session).
- `GET /api/users/:id/posts`, `photos`, `videos`, `traditions` (onglets).
- `GET /api/users/:id/saved` (signets).
- `GET /api/users/:id/about` (ProfileDetails).
- `POST /api/users/:id/follow` / `DELETE` (suivre) ; `POST /api/users/:id/match`.
- **Calcul du `level`** (niveau) côté backend (règles d'XP non définies → à spécifier).

---

## 11. MESSAGES & CHAT

### 11.1 MessagesPanel (`components/messages/MessagesPanel.tsx` + `MessageItem`)
**Rôle** : liste des conversations (panneau messages).
- `messagesService.getMessages()` → **`GET /api/messages`**.
- Chaque ligne : avatar, nom, rôle, **toggle notifications** (cloche) → `POST /api/messages/:id/notifications`.
- `mocks/messages.json` : `{ id, name, role, img, notificationsOn, lastMessage }`.

### 11.2 ChatPopup + Chat (`components/chat/`)
**Rôle** : messagerie temps réel flottante (`isChatOpen`).

| Composant | Rôle |
|---|---|
| `ChatPopup` | Fenêtre de chat flottante : liste de conversations + fil actif |
| `ConversationListItem` | Une conversation (avatar, nom, dernier message, heure, badge non-lus) |
| `ActiveChatColumn` | Fil de discussion active |
| `ChatMessageBubble` | Message entrant/sortant (texte, note vocale `audioDur`, fichier `file {name,size}`) |
| `CulturalProfileColumn` | Profil culturel de l'interlocuteur (bio, pays, langues, traditions, tribus, médias partagés) |

**Données `mocks/chat.json`** :
```
Conversation: { id, name, avatar, culture ("Traditional Shintoism × Cyber-Neon"),
                lang ("Japanese (Native), English (Fluent)"), online, lastSeen?,
                lastMsg, timeAgo, unreadCount, glow, level, bio, country ("Japan 🇯🇵"),
                traditions[], tribes[], sharedMedia[] }
ChatMessage:  { id, senderId, senderName, text?, time, audioDur?, file? { name, size } }
```
`chatService` :
- `getConversations()` → **`GET /api/conversations`**
- `getMessages(conversationId)` → **`GET /api/conversations/:id/messages`**
- `sendMessage(conversationId, text)` → **`POST /api/conversations/:id/messages`** `{ text }`

**Réponses automatiques** : `getAutomatedReply(partnerName, textInput)` — bot simulé (keywords hello/culture/music → réponse + délai 2500 ms). **Backend : à remplacer par un bot réel ou des replies templates stockées.**

**⚠️ Backend à prévoir (messagerie)** :
- `GET /api/conversations` (liste + `unreadCount` + derniers messages).
- `GET /api/conversations/:id/messages` (historique paginé).
- `POST /api/conversations/:id/messages` (envoi texte — **WebSocket/SSE pour temps réel**).
- Envoi média : image, **note vocale**, fichier → `POST /api/uploads` + message avec `file`/`audioDur`.
- `POST /api/conversations/:id/read` (marquer lu, décrémenter `unreadCount`).
- `POST /api/messages/:id/notifications` (toggle notif).
- Création de conversation lors d'un **match Love** ou d'un **match Connexion**.
- Profil culturel de l'interlocuteur = `GET /api/users/:id`.

---

## 12. NOTIFICATIONS

### 12.1 NotificationDropdown (`components/layout/parts/NotificationDropdown.tsx` + `NotificationItemView`, `NotificationHeader`, `NotificationFooter`)
**Rôle** : cloche en header, liste déroulante des notifications + "mark all read" + "view all".

**Données `mocks/notifications.json`** (`types/notification.ts`) :
```
NotificationItem: { id, user: { name, avatar, action, target }, type, time, isUnread }
type: 'comment' | 'like' | 'invite' | ...
```

**Service `notificationService`** :
- `getNotifications()` → **`GET /api/notifications`**
- `markAllAsRead()` → **`POST /api/notifications/read-all`**
- `updateReadStatus(id, isUnread)` → **`PATCH /api/notifications/:id`** `{ isUnread }`
- `handleInviteAction(id, action)` → **`POST /api/notifications/:id/accept` | `/decline`**

### 12.2 Règles de génération des notifications (à implémenter backend)
- **comment** : quelqu'un commente une de mes traditions.
- **like** : quelqu'un aime ma tradition ou mon image dans une tribu.
- **invite** : invitation à collaborer (ex. matchmaking culturel).
- **demande de connexion** reçue.
- **match Love** réussi.
- **nouveau message** (compteur non-lus).

**⚠️ Backend à prévoir** :
- `GET /api/notifications` (pagination, filtres type).
- `PATCH /api/notifications/:id` (lu/non-lu), `POST /api/notifications/read-all`.
- `POST /api/notifications/:id/accept` / `decline` (invitations).
- Compteur global non-lus (badge sidebar/header).
- Poush temps réel des nouvelles notifications (WS/SSE) et éventuellement **email push**.

---

## 13. SETTINGS (PARAMÈTRES)

### 13.1 SettingsPage (`pages/SettingsPage.tsx` + `components/settings/`)
**Rôle** : paramètres du compte.

**Données `mocks/settings.json`** (`types/settings.ts`) :
```
UserSettings: { email, gender, locationType,
                googleConnected, appleConnected, twoFactor }
```

**Composants** : `SettingsHeader`, `SettingsTabs` (ex. Account / Preferences / Security), lignes (`rows/`) et sections (`sections/`).

**Fonctionnalités / sous-fonctionnalités attendues** :
| Section | Paramètres |
|---|---|
| Compte | Email, genre, localisation (`locationType` : "Use approximate location (based on IP)") |
| Connexions | Google connecté / Apple connecté (états booléens) |
| Sécurité | **2FA** (`twoFactor` booléen) — à activer/désactiver |
| Préférences | Thème, langue, notifications (à compléter) |
| Confidentialité | (UI à compléter) |

**Service `settingsService`** :
- `getSettings()` → **`GET /api/settings`**
- `updateSettings(data)` → **`PUT /api/settings`** (body `Partial<UserSettings>`)

**⚠️ Backend à prévoir** :
- `GET /api/settings` / `PUT /api/settings`.
- Activation 2FA (génération secret + vérification code → endpoints dédiés).
- Gestion des connexions sociales (link/unlink Google/Apple).
- **Suppression de compte** à prévoir (non présente en UI actuellement).

---

## 14. COMPOSANTS TRANSVERSAUX / UI

| Composant (`components/ui/`) | Rôle |
|---|---|
| `avatar.tsx`, `badge.tsx`, `button.tsx`, `input.tsx` | Primitives shadcn/ui |
| `TotemAvatar.tsx` | Avatar avec halo `glow` + niveau |
| `SearchableSelect.tsx` (+ `Trigger`, `Dropdown`, `.types.ts`) | Selecteur recherche (pays/villes/langues…) |
| `FiltersButton.tsx` / `FiltersModal.tsx` (+ `filters/`) | Modale de filtres du feed |
| `SandboxIcon.tsx` | Icône custom |

Autres transverses :
- `components/RightPanel.tsx` : panneau droit (connexions suggérées, annonces) — affiché sur les onglets Feed.
- `components/chat/ChatPopup.tsx` : chat flottant accessible depuis Messages / Connexion / profils.
- `lib/constants.ts`, `lib/utils.ts`, `lib/animations.ts`, `lib/queryClient.ts` : utilitaires.

---

## 15. INVENTAIRE DES ENDPOINTS BACKEND À CRÉER

> Les services front exposent déjà ces chemins exacts (`src/services/*.ts`). Forme des réponses = celle des fichiers `mocks/*.json`.

### 15.1 Auth & Compte
| Méthode | Endpoint | Body / Query | Service front |
|---|---|---|---|
| POST | `/api/onboarding` | `OnboardingData + email + acceptedTermsAt` | `onboarding.service.ts` |
| GET | `/api/users/me` | — | `userService` |
| GET | `/api/users/:id` | — | `userService` |
| PATCH | `/api/users/me` | `Partial<ProfileDetails>` | `useAppStore` (à brancher) |
| GET | `/api/settings` | — | `settingsService` |
| PUT | `/api/settings` | `Partial<UserSettings>` | `settingsService` |

*(Auth OTP/OAuth : non encore exposés côté service — endpoints suggérés : `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `POST /api/auth/google`, `POST /api/auth/apple`, `POST /api/auth/logout`.)*

### 15.2 Feed & Posts
| Méthode | Endpoint | Notes |
|---|---|---|
| GET | `/api/feed?filter=following\|for-you` | (+ sort, culture, pagination) |
| GET | `/api/posts/:id` | détail |
| POST | `/api/posts` | création |
| POST | `/api/posts/:id/like` | toggle like |
| POST | `/api/posts/:id/comments` | ajout commentaire |
| POST | `/api/posts/:id/share` | partage |
| POST | `/api/posts/:id/save` | signet |
| DELETE | `/api/posts/:id/save` | retrait signet |

### 15.3 Traditions & Upload
| Méthode | Endpoint | Notes |
|---|---|---|
| POST | `/api/traditions` | `TraditionSubmission` |
| GET | `/api/tribes` | sélecteur `TribeOption[]` |
| POST | `/api/uploads` | upload image/média → URL |

### 15.4 Tribus
| Méthode | Endpoint | Notes |
|---|---|---|
| GET | `/api/tribes/:id` | détail tribu |
| POST | `/api/tribes` | création (`TribeSubmission`) |
| PATCH | `/api/tribes/:id` | settings tribu |
| DELETE | `/api/tribes/:id` | suppression |
| POST | `/api/tribes/:id/join` | rejoindre (leave : DELETE) |
| GET | `/api/tribu/posts` · `/api/tribu/rules` · `/api/tribu/moderators` | contenus tribu (ou `/api/tribes/:id/...`) |
| POST | `/api/tribu/posts` | poster dans la tribu |
| POST | `/api/tribu/posts/:id/upvote` | vote |

### 15.5 Explore / Love
| Méthode | Endpoint | Notes |
|---|---|---|
| GET | `/api/explore/tribes` | `tribes` + `moreTribes` |
| GET | `/api/explore/companions` | `companions` |
| GET | `/api/explore/images` | galerie images |
| GET | `/api/explore/videos` | galerie vidéos |
| GET | `/api/love/matches` | candidats Love (score backend) |
| GET | `/api/love/matches/:id` | détail |
| POST | `/api/love/swipe` | `{ userId, action: like\|pass }` |
| POST | `/api/users/:id/match` | match direct |

### 15.6 Connexions / Requests
| Méthode | Endpoint | Notes |
|---|---|---|
| GET | `/api/connections/suggestions` | recommandations |
| GET | `/api/connections/interested` | intéressés par moi |
| GET | `/api/connections/requests` | demandes reçues |
| GET | `/api/connections/companions` | connexions établies |
| POST | `/api/connections/:userId/request` | envoyer demande |
| POST | `/api/requests/:id/accept` | accepter |
| POST | `/api/requests/:id/decline` | refuser |
| POST | `/api/requests/:id/block` | bloquer |
| DELETE | `/api/connections/:userId` | retirer compagnon |

### 15.7 Messages / Chat
| Méthode | Endpoint | Notes |
|---|---|---|
| GET | `/api/messages` | liste conversations (panneau) |
| POST | `/api/messages/:id/notifications` | toggle notif |
| GET | `/api/conversations` | liste chat |
| GET | `/api/conversations/:id/messages` | historique |
| POST | `/api/conversations/:id/messages` | envoi `{ text }` |
| POST | `/api/conversations/:id/read` | marquer lu |
| WS/SSE | — | temps réel (messages, notifications, présence `online`) |

### 15.8 Notifications / Stories / Recherche
| Méthode | Endpoint | Notes |
|---|---|---|
| GET | `/api/notifications` | liste paginée |
| PATCH | `/api/notifications/:id` | `{ isUnread }` |
| POST | `/api/notifications/read-all` | tout marquer lu |
| POST | `/api/notifications/:id/accept` · `/decline` | invitations |
| GET | `/api/notifications/unread-count` | badge compteur |
| GET | `/api/stories` | stories |
| POST | `/api/stories` | ajout story `{ img }` |
| GET | `/api/search?q=...` | recherche globale |

---

## 16. MODÈLE DE DONNÉES (ENTITÉS BACKEND)

```
User ──────────┬── Auth (email, google/apple ids, password?/OTP)
               ├── Profile (name, username, avatar, avatarSeed, gender, seeking,
               │            birthdate, age, locale, level, glow, location,
               │            roots{country,region,ethnicity,village}, languages[],
               │            intention, diaspora)
               ├── ProfileDetails (occupation{domain,title}, values[], preference,
               │            familyQuiz, situation, criteria[], bio)
               ├── Stats (traditionsCount, culturesCount, tribesCount,
               │          interestedCount, companionsCount)
               ├── Settings (email, gender, locationType, googleConnected,
               │            appleConnected, twoFactor)
               └── tribes[] (membership)

Tribe ──┬── meta (name, tag, topic, visitors, desc, avatar, glow, joined)
        ├── posts[] (author, title, body, mediaUrl, tagText, upvotes, commentsCount)
        ├── rules[] (number, title, desc)
        └── moderators[] (user, role)

Post/Tradition ── author{id,name,avatar,location}, text, image?, mediaUrl?,
                  linkUrl?, type (Text|Images|Link), tribe{id,name}, tags[],
                  likes, comments, views, saves, date, createdAt

Story ── user, img, createdAt (expiration 24h)

Conversation ── participants[], name, avatar, culture, lang, online,
                lastMsg, timeAgo, unreadCount, glow, level, bio, country,
                traditions[], tribes[], sharedMedia[]
Message ── conversationId, senderId, text?, audioDur?, file{name,size}, time, read

Connection ── from, to, status (suggestion|interested|request|companion|blocked), createdAt
LoveMatch ── userId, matchScore, swipes (like/pass), matched, conversationId

Notification ── type (comment|like|invite|request|match|message), user{...},
                action, target, isUnread, time

Comment / Like / Save / Share ── postId, userId, createdAt
```

---

## 17. RÈGLES MÉTIER TRANSVERSES

1. **Âge minimum 18 ans** — bloquant à l'onboarding et recalculé via `calculateAge`.
2. **Username unique** — format `[a-zA-Z0-9._]`, ≥ 3 caractères.
3. **Matching mutuel (Love)** : deux `like` réciproques → match → **création d'une conversation** + notification + ajout compagnons.
4. **Blocage utilisateur** : doit filtrer l'utilisateur de tout le produit (feed, explore, chat, connexions).
5. **Niveau (level) & XP** : règles de gain non définies → à spécifier.
6. **Score de compatibilité (matchScore)** : calculé côté backend (profils, tribus communes, valeurs, langues, localisation…).
7. **Stories** : expiration (24 h) et visibilité (connexions uniquement).
8. **Notions de suivi (follow)** et **abonnements (following)** : nécessaires pour le feed "Following" — non encore implémentées côté store.
9. **Feed "For You"** : algorithme de recommandation (à définir).
10. **L10n/i18n** : la plupart des textes UI sont en anglais ; les référentiels onboarding sont en français. `locale` est stockée par utilisateur.
11. **Notifications** : déduplication, pagination, compteurs non-lus, mark-all-read.

---

## 18. POINTS D'ATTENTION / INCOHÉRENCES POUR LE BACKEND

| # | Sujet | Constat | Décision à prendre |
|---|---|---|---|
| 1 | Recherche | `searchQuery` stockée mais **non branchée à l'API** (recherche locale seulement sur Connexions) | Implémenter `GET /api/search` ? |
| 2 | Auth réelle | AuthPage simule le login (setTimeout 600 ms) ; pas de token/OTP | Définir le flux d'auth backend |
| 3 | OAuth Google/Apple | Boutons visuels non fonctionnels | Câbler OAuth côté backend |
| 4 | Mise à jour profil | `ProfileDetails` éditable dans le store mais **aucun service PATCH** | Ajouter `PATCH /api/users/me` |
| 5 | Niveau/XP | `level` statique dans les mocks | Définir système d'XP |
| 6 | Story viewer | Pas de vue plein-écran des stories | À confirmer scope |
| 7 | Pagination | Aucun mock ni service paginé (feed, messages, notifs) | À prévoir (cursor/offset) |
| 8 | Temps réel | Mock `getAutomatedReply` simule un bot chat | WS/SSE + bot ou templates |
| 9 | Counters | Compteurs (visiteurs, vues, likes "12K") formatés en chaînes dans les mocks | Stocker en nombres, formater côté front |
| 10 | Badge sidebar | `notificationsCount` codé en dur (9) | Le servir via API |
| 11 | `users.json` | Doublons/alias d'IDs (`user-current`, `1`, `m1`, `req-1`…) | Normaliser le modèle utilisateur |
| 12 | Géolocalisation | `locationType` "based on IP" présent dans les settings | Endpoint IP→geo backend |
| 13 | Tribu "clic neutre" | Item sidebar Tribu inactif (menu dédié ailleurs) | Préciser le flux de navigation Tribu |
| 14 | Connexions recherche | Recherche locale uniquement | API de recherche connexions |
| 15 | Notification `updateReadStatus` | `isUnread` patché (semantics inversée : isUnread=true = non lu) | Normaliser `read` vs `isUnread` |

---

## 19. CONCLUSION

Ce document couvre **toutes les fonctionnalités visibles du site web** : de la connexion (`AuthPage`) jusqu'aux réglages (`SettingsPage`), en passant par l'onboarding, le feed (cartes de post, actions like/comment/share/save), les stories, l'exploration (tribus, connexions, images, vidéos, création de tribu), le matching amoureux (Love), la gestion des connexions (suggestions/intérêts/demandes/compagnons), le profil Totem, la messagerie (panneau + chat flottant avec médias), les notifications et les paramètres.

Le **backend doit reproduire** : (1) les **13 fichiers de mock** comme contrat de réponse API, (2) les **chemins d'endpoints** déjà présents dans les services (`/api/feed`, `/api/posts/:id/like`, `/api/conversations/:id/messages`, `/api/notifications/read-all`, `/api/settings`, `/api/traditions`, `/api/tribes`, `/api/requests/:id/okay`, `/api/connections/*`, `/api/love/matches`, `/api/users/me`, `/api/onboarding`, `/api/stories`…), et (3) les **règles métier** transverses (§17). Les endpoints **suggérés** (recherche, auth, upload, unread-count, mise à jour profil) complètent le périmètre à valider avec le produit.

