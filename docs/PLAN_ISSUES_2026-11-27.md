# Plan de travail — Communauté, Friend/Maps, Love IA

> Date : 27 novembre 2026. Base : transcription vocale du fondateur + lecture du code (aucune exécution, aucun test lancé).
> Mise à jour : l'affirmation initiale « pas de downvote sur les posts » était **fausse** (voir 2.1) ; l'avancement des PR ouvertes est résumé en 2.5.
> Légende : ✅ fait · 🟡 partiel · ❌ absent · 🔎 à vérifier à l'exécution.
> Hors périmètre à ce stade (demande explicite) : la messagerie (« pas encore le temps de toucher ») et la page Work/UI.

## 1. Ce que dit la transcription (reformulé)

1. **Communauté = Reddit** : le cœur du produit. Des choses sont déjà commencées.
2. **Friend** : le flux Intéressés / Demandes / Compagnons existe, mais **la carte (Maps) « n'est pas du tout gérée »**. Cible : s'inspirer d'Instagram Map et de Snap Map (recherche à faire).
3. **Love** : pas de formulaire classique. **Discussion avec une IA**. À la première utilisation de Love seulement : quelques questions. Ensuite l'utilisateur décrit la personne voulue (« une fille telle… ») ou consulte l'IA, qui **propose des profils sous forme de cartes dans la discussion**. On peut ouvrir le profil et écrire. **Comme Tinder : l'autre doit accepter la requête** ; ces requêtes vont dans l'onglet des demandes.
4. Messagerie : ne pas toucher pour l'instant.
5. Un mail avec photo/vidéo de contexte va arriver : **non reçu, non lu à ce stade**. Ce plan sera à réviser avec lui.

Priorité donnée : **Communauté, Friend, puis Love si le temps le permet.**

## 2. État des lieux (preuves dans le code)

### 2.1 Communauté (tribus + posts) — 🟡 base solide, fonctions « Reddit » manquantes

| Fonction | État | Preuve |
|---|---|---|
| CRUD tribu, join/leave, règles, modérateurs, épinglage | ✅ | `tribes.routes.ts` (≈25 routes) |
| Signalement tribu / post, file de reports | ✅ | `/:id/report`, `/:id/posts/:postId/report`, `/:id/reports` |
| Vote de post (upvote **et** downvote) | 🟡 | `POST /api/tribu/posts/:id/upvote` accepte `value` = `+1` ou `-1` (`tribes.schemas.ts`), table `post_votes` (un vote par utilisateur, bascule/annulation), score net recalculé par `votePost` (`tribes.service.ts`). Backend ✅ ; 🔎 l'UI (`TribuPostCard`) ne semble exposer que le vote positif : le downvote n'a pas de bouton repéré |
| Commentaires imbriqués | 🟡 | `comments.parentId` en base et service ; 🔎 UI d'arborescence non vérifiée |
| **Tri Hot / Top / New / Controversial** | ❌ | tri figé : `pinned desc, createdAt desc` (`tribes.service.ts:279`) |
| **Karma / score d'utilisateur, flairs, awards** | ❌ | aucun code |
| Fil d'accueil agrégé des tribus suivies (type r/all, r/popular) | 🟡 | le feed existe (`feed/`), mais lien avec les tribus non démontré |
| Modération avancée (bannir un membre, mute, file de modération par tribu, automod) | ❌ | seules règles / mods / reports |
| Tribus privées / sur invitation, demandes d'adhésion | ❌ | non vu dans les routes |
| Recherche de tribus et de posts | ✅ | Meilisearch, `search/` |
| Front : TribuHeader, About, Mods, Rules, PostCard, détail, réglages | ✅ | `components/tribu/`, `explore/Tribu*` |

### 2.2 Friend (connexions + carte) — 🟡 le flux est là, la carte est là mais incomplète

**Flux de connexion (Intéressés / Demandes / Compagnons / Suggestions)** : ✅ backend (`/connections/*`, `/requests/:id/accept|decline|block`) et ✅ front (4 onglets, `DemandesTab` accepte/refuse).

**Carte — correction importante de la transcription.** La carte n'est pas « absente » : `SuggestionsTab` monte `PeopleNearbyMapV2` (MapLibre), et le backend `location/` gère :
- visibilité (`nobody / friends / friends_of_friends / nearby / everyone`), **mode fantôme**, précision (`approximate / area`), expiration, affichage distance / statut actif, blocages, heartbeat, rafraîchissement par socket ;
- position floutée côté serveur (jitter).

Ce qui manque pour atteindre le niveau Instagram / Snap Map :

| Écart | Gravité |
|---|---|
| Trois composants carte en doublon (`FriendsProximityMap` 404 l., `PeopleNearbyMap`, `PeopleNearbyMapV2`), dont seul V2 est monté → dette et risque de divergence | moyenne |
| **Tuiles `tile.openstreetmap.org` en direct** : interdit pour une app en production (politique d'usage OSM). Il faut un fournisseur de tuiles (MapTiler, Stadia, Protomaps/OpenFreeMap…) | **haute (prod)** |
| **Recherche de lieu : le navigateur appelle Nominatim directement** : fuite de la requête, limite de débit, pas de contrôle. À passer par le backend | moyenne |
| Choix « qui me voit » trop grossier : pas de **liste de personnes choisies** ni de « sauf… » (Snap : « Ces amis seulement » ; Instagram : « Amis proches » / personnes sélectionnées) | haute |
| Pas de **notification/transparence** « telle personne voit ta position » ni de rappel que le partage est actif | moyenne |
| Le flou est **déterministe par id** : décalage constant, donc contournable par recoupement ; pas de grille / cellule | moyenne (vie privée) |
| Pas de clustering des marqueurs (`supercluster` est en dépendance mais 🔎 non utilisé par V2) | moyenne |
| Pas de contenu sur la carte (stories/posts géolocalisés, lieux/événements culturels) — c'est ce qui fait l'intérêt de Snap Map | basse (phase 2) |
| `matchScore: 0` en dur dans `getPeopleNearby` : pas de lien avec le moteur d'affinité décrit dans `FRIENDSHIP_ALGORITHM.md` | moyenne |
| `PeopleNearbyMap` V1 : `goProfile` fait `window.location.href=/profile/...` alors que le routeur est par hash → lien cassé (🔎 vérifier V2) | basse |
| Aucun test d'intégration de `getPeopleNearby` (seul `location.policy.test.ts` existe, hors périmètre vitest) | haute |

Recherche à mener avant de coder (demande du fondateur) : comportement de Snap Map et d'Instagram Map (opt-in explicite, mode fantôme, liste d'amis autorisés, expiration automatique, affichage « dernière activité », notifications). Je ne l'ai pas encore faite : c'est le ticket F0 ci-dessous.

### 2.3 Love (IA conversationnelle) — 🟡 le squelette existe, trois écarts avec la vision

Existant : `POST /love/conversation` (clarification puis résultats), quota **3 recherches / 7 jours**, **4 profils max**, filtres de consentement/blocage/âge, `love/swipe`, match mutuel → conversation, UI `LoveColumn` avec cartes (score, raisons, sous-scores, J'aime / Passer / Message).

| Vision du fondateur | Réalité | État |
|---|---|---|
| Questions **uniquement à la première utilisation de Love** | Aucun profil Love, aucune table de préférences, aucun flux « première fois ». La doc `love-algorithm/01` prévoit 6 questions + feature store : **non implémenté** | ❌ |
| L'IA comprend la demande libre | Parsing par **regex** (`deterministicParse`) ; un LLM n'est utilisé que si `LOVE_AI_ENABLED=true` + clé + modèle. Questions de clarification **codées en dur** (genre → âge → objectif) | 🟡 |
| Cartes **dans la discussion** | Les cartes s'affichent **sous** le fil, pas comme messages du chat (le type `ChatMessage` a un champ `results` mais le rendu est séparé) | 🟡 |
| Cliquer → voir le profil / écrire | `LoveDetailModal` existe ; bouton Message OK | 🟡 |
| **La personne doit accepter la requête** (Tinder) | Un **like** n'ouvre une conversation que si l'autre a aussi liké (✅). **Mais** le bouton Message appelle `ensureConversationWith` → **ouvre une conversation sans accord** : contourne le consentement (🔎 à confirmer côté `/conversations`) | ❌ **bloquant** |
| Requêtes Love dans l'onglet des demandes | L'onglet Demandes ne traite que les `connections` (Friend). Un like Love n'y apparaît pas ; il génère seulement une notification `love:like` | ❌ |
| Quota 3/semaine | Compatible avec la vision « qualité » mais peut frustrer la boucle « je veux une fille telle… » : décision produit à confirmer | 🟡 |

### 2.5 État d'avancement — PR ouvertes (#63 à #89)

Aucune de ces PR n'est fusionnée à la date de rédaction : « en PR » ne veut pas dire « livré ». Plusieurs PR sont **empilées** (la base d'une PR est la branche d'une autre) et doivent être fusionnées dans l'ordre. Rien n'a été exécuté de bout en bout ici (tests d'intégration non lancés faute de Docker).

| Issue du backlog | PR | Remarque |
|---|---|---|
| F1 (tuiles) + L0 côté UI (plus de chat Love vide si consentement requis) | #63 | base : `main` |
| L1 / L2 / L7 (requêtes Love à accepter) | #64 | base : `main` |
| C2 (tri Hot / Top / Controversial / New) | #66 | base : `main` ; le vote de post `+1/-1` (table `post_votes`) existait déjà dans `main` |
| F2 (cartes dupliquées, XSS marqueurs) | #67 | empilée sur #63 |
| Typecheck backend (45 erreurs → 0) | #68 | base : `main` |
| D2 / D5 (CI web, README) | #69 | base : `main` |
| D3 (mocks d'upload) | #70 | base : `main` |
| F6 / F10 (position par grille, tests) | #71 | empilée sur #68 |
| F3 (proxy de géocodage) | #72 | empilée sur #67 |
| C5 (ban / mute de membre) | #73 | base : `main` |
| L3 (profil + questionnaire Love) | #74 | empilée sur #73 |
| L4 / L5 (garde-fous IA, cartes dans la discussion) | #75 | empilée sur #74 |
| D1 (export / suppression de compte) | #76 | base : `main` |
| F4 API (audience de partage) | #77 | empilée sur #74 |
| C3 (votes de commentaires, tri best/top/new/old) | #78 | repli et pagination par branche restent à faire (voir C3) |
| C4 (fil d'accueil des tribus rejointes) | #79 | base : `main` |
| C7 (tribus privées) | #80 | empilée sur #79 |
| C8 (flairs) | #81 | empilée sur #80 |
| C9 (matrice d'accès croisés) | #82 | empilée sur #81 |
| C6 (karma) | #83 | empilée sur #78 |
| F5 (opt-in position) | #84 | empilée sur #77 |
| F4 UI (sélecteur d'audience) | #85 | empilée sur #84 |
| F7 (états carte, clusters) | #86 | empilée sur #85 |
| F8 (score d'affinité carte) | #87 | empilée sur #86 |
| F11 (conception du contenu carte) | #88 | document de conception uniquement, pas de code |
| Correctif : sanctions appliquées au vote de post de tribu | #89 | empilée sur #78 ; fermait un contournement du ban/mute (C5) |

Non couvert par une PR à ce jour : F0 (recherche Snap/Instagram Map), F9 (notifications de position), F12 (e2e Friend), le correctif serveur de L0 (le contournement du consentement côté API est traité par les requêtes Love #64, 🔎 à confirmer), L6, L8, D4, et la décision produit sur l'affichage du downvote.

### 2.4 Transversal (rappel de l'audit 360)

Suppression/export de compte absents, tests d'accès croisés absents, CI web absente, mobile en maquette, i18n absente. Non traité ici, sauf mention dans le backlog.

## 3. Backlog d'issues

Priorité : **P0** bloquant / sécurité · **P1** cœur du produit demandé · **P2** après. Taille : S ≤ ½ j · M ≈ 1–2 j · L > 2 j.

### Bloc A — Communauté (priorité n°1)

| ID | Titre | Prio | Taille | Dépend de |
|---|---|---|---|---|
| C1 | Vote complet : upvote/downvote de post et de commentaire, score net, un vote par utilisateur, annulation | P1 | M | — |
| C2 | Tri des posts de tribu : Hot / New / Top (jour/semaine/mois/an) / Controversial, via paramètre `sort` | P1 | M | C1 |
| C3 | Commentaires : arborescence, tri (best/new/top), repli, pagination par branche — vérifier UI existante | P1 | M | C1 |
| C4 | Fil d'accueil agrégé des tribus rejointes + page « Popular/All » | P1 | M | C2 |
| C5 | Modération de tribu : bannir/muter un membre, file de reports par tribu, retrait de post, journal | P1 | L | — |
| C6 | Karma utilisateur (posts + commentaires) affiché sur le profil, utilisé comme signal anti-spam | P2 | M | C1 |
| C7 | Tribus privées / restreintes, demandes d'adhésion, invitations | P2 | L | C5 |
| C8 | Flairs de post et de membre, sujets/tags | P2 | M | — |
| C9 | Tests d'intégration : tribus, vote, permissions modérateur, accès croisés | P0 | M | C1–C5 |

### Bloc B — Friend + Maps (priorité n°2)

| ID | Titre | Prio | Taille | Dépend de |
|---|---|---|---|---|
| F0 | **Recherche** : comportement Instagram Map / Snap Map → fiche de spécifications (opt-in, ghost, listes, expiration, notifications, contenu) | P1 | S | — |
| F1 | Remplacer les tuiles OSM directes par un fournisseur autorisé ; clé en variable d'env ; un seul composant de style carte partagé | **P0** | S | — |
| F2 | Supprimer `FriendsProximityMap` et `PeopleNearbyMap` (V1) ; garder V2 ; corriger les liens profil vers le routeur hash | P1 | S | — |
| F3 | Proxy backend de géocodage (recherche de lieu) avec cache et limite de débit ; retirer Nominatim du navigateur | P1 | S | F1 |
| F4 | Partage de position **par liste** : « tous les compagnons », « sélection », « tous sauf… » (type Snap/Instagram) : table `location_audience`, UI de sélection, filtre serveur | P1 | M | F0 |
| F5 | Opt-in guidé à la première ouverture de la carte (explication, choix d'audience, durée) + bandeau permanent « ta position est partagée avec N personnes » | P1 | S | F4 |
| F6 | Flou robuste : arrondi à une grille/cellule + décalage non constant par fenêtre de temps (anti-recoupement) ; documenter le modèle de menace | P1 | M | — |
| F7 | Clustering des marqueurs (supercluster), perf avec 200+ points, états vide/erreur/permission refusée | P1 | M | — |
| F8 | Brancher le score d'affinité Friend (`FRIENDSHIP_ALGORITHM.md`) à la place de `matchScore: 0` ; tri/filtre « Culture / Langues » réels | P2 | M | — |
| F9 | Notification discrète « X a partagé sa position » / « X est près de toi » (opt-in, plafonnée) | P2 | M | F4 |
| F10 | Tests : `getPeopleNearby` (visibilité × blocage × fantôme × expiration × audience), déplacer `location.policy.test.ts` dans `tests/unit` | **P0** | M | F4 |
| F11 | Contenu sur la carte : stories/posts géolocalisés, événements et lieux culturels | P2 | L | F4 |
| F12 | Parcours Friend e2e (suggestion → demande → acceptation → compagnon → carte) avec Playwright | P1 | M | F2 |

### Bloc C — Love IA (priorité n°3)

| ID | Titre | Prio | Taille | Dépend de |
|---|---|---|---|---|
| L0 | **Correctif consentement** : interdire d'ouvrir une conversation Love sans acceptation (vérifier `/api/conversations` et le bouton Message) | **P0** | S | — |
| L1 | Modèle « requête Love » (pending/accepted/declined/expired) : table, routes `send/accept/decline`, notifications, blocage prioritaire | **P0** | M | L0 |
| L2 | Onglet « Demandes » unifié (Friend + Love, avec étiquette de mode) ; acceptation crée la conversation Love | P1 | M | L1 |
| L3 | Profil Love + **questions de première utilisation** (déclenchées une seule fois, reprenables, modifiables ensuite) ; stockage = feature store minimal | P1 | L | — |
| L4 | IA conversationnelle : extraction de critères par LLM avec schéma validé, questions de clarification générées, repli déterministe conservé, garde-fous (aucune donnée sensible inférée, pas de choix direct des personnes) | P1 | L | L3 |
| L5 | Cartes de profils **dans le fil de la conversation** (messages de type `profile-cards`) ; ouvrir profil, écrire = envoyer une requête (L1) | P1 | M | L1, L4 |
| L6 | Décision produit : quota hebdomadaire, nombre de profils, durée de vie d'une sélection | P1 | S | — |
| L7 | Tests : consentement croisé Love/Friend/blocage, quota Redis, requête acceptée/refusée, âge ≥ 18 | **P0** | M | L1 |
| L8 | Observabilité Love : taux de clarification, requêtes acceptées, coût LLM par recherche | P2 | S | L4 |

### Bloc D — Dette transversale à planifier (rappel audit 360)

D1 suppression + export de compte · D2 CI web (lint, build, e2e) · D3 nettoyage des branches `mock/` d'upload · D4 snapshots Drizzle à régénérer proprement · D5 README racine et runbook de démarrage.

## 4. Ordre d'exécution proposé

1. **Sécurité d'abord (½ journée)** : L0 (conversation sans accord), F1 (tuiles OSM interdites en prod).
2. **Communauté** : C1 → C2 → C3 → C4, puis C5 ; C9 en continu.
3. **Friend / Maps** : F0, F2, F3, puis F4 → F5 → F10, puis F6 / F7 / F12.
4. **Love** : L1 → L2 → L3 → L4 → L5 → L7.
5. Messagerie : **gelée** jusqu'à instruction.

Une issue = une branche = un commit atomique + test. Chaque issue se termine par : typecheck + lint + test ciblé verts, et un scénario manuel décrit dans la description.

## 5. Estimation honnête

Tout ce backlog dépasse « l'heure ». Réaliste dans l'heure : cette cartographie, la création des issues, et les deux correctifs P0 (L0, F1). La suite s'enchaîne ensuite par bloc, dans l'ordre ci-dessus.

## 6. Points à trancher avec le fondateur

1. Quota Love : garder 3 recherches/7 jours ?
2. Carte : quel fournisseur de tuiles (coût vs contrôle) ?
3. Communauté : le downvote existe déjà côté API (`+1`/`-1`) ; faut-il l'**afficher** dans l'UI (Reddit) ou ne montrer qu'un score d'utilité ?
4. Le mail/la photo annoncés : à transmettre pour réviser ce plan.
5. Messagerie : confirmer qu'elle reste gelée même pour L0 (qui touche `/api/conversations`).
