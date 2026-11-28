# F11 — Contenu sur la carte : conception

Statut : ordre de livraison **validé** (stories → lieux → événements). Décisions confirmées : lieux saisis par la communauté seulement (pas d'import OpenStreetMap), modérés par les administrateurs de la plateforme ; posts non géolocalisés en v1. Lot 1 : PR #104. Lot 2 : PR #105. Lot 3 (événements) à faire.

## Ce qui existe aujourd'hui

- Position des personnes : `users.latitude / longitude`, réglages `user_location_settings`, audience, floutage (`location.privacy.ts`, `fuzz`).
- Stories : table `stories` (`userId`, `url`, `caption`, `expiresAt`), **sans aucune position**.
- Posts : table `posts` (`tribeId`, tags…), **sans aucune position**.
- Aucun modèle de lieu culturel ni d'événement.

F11 demande trois choses : stories ou posts géolocalisés, événements, lieux culturels. Ce sont trois produits distincts avec des risques différents. Je recommande de les livrer dans cet ordre, chacun derrière son propre opt-in.

## Principe de confidentialité commun

Un contenu géolocalisé révèle où se trouvait son auteur. Règles proposées :

1. **Opt-in par contenu** : la position n'est jamais jointe automatiquement. L'auteur choisit « Ajouter à la carte » à la publication.
2. **Position publique = position choisie**, pas la position réelle : l'auteur place un point (ville, quartier, lieu nommé), jamais les coordonnées GPS brutes du téléphone. On applique ensuite la même grille et le même floutage que `obfuscatePosition`.
3. **Audience héritée** : un contenu sur la carte n'est visible que par ceux qui pourraient voir la position de l'auteur selon `canSeeLocation` (visibilité, audience « sélection / tous sauf », blocages, mode fantôme). Un contenu ne doit pas contourner le mode fantôme.
4. **Pas de trace dans le temps** : une story géolocalisée expire avec la story ; on ne conserve pas l'historique des positions.
5. **Retrait total** : supprimer le contenu, ou désactiver le partage de position, retire immédiatement le marqueur (y compris des caches).

## Lot 1 — Stories géolocalisées (MVP recommandé)

- Colonnes `stories.place_lat`, `stories.place_lon`, `stories.place_label` (nullable), migration à la suite.
- Création : le client envoie un point **choisi** (via la recherche de lieu / le proxy de géocodage), pas le GPS brut. Le serveur le ramène à la grille floue avant stockage.
- Lecture : `GET /location/stories?bbox=...` renvoie les stories actives dont l'auteur est visible pour le lecteur (réutiliser `canSeeLocation` et la même requête de candidats que `getPeopleNearby`, y compris blocages et audience).
- Web : marqueur de story sur la carte V2 (anneau autour de l'avatar), ouverture dans le lecteur de stories existant.
- Tests : matrice de visibilité identique à F10, plus expiration et suppression.

## Lot 2 — Lieux culturels

- Table `cultural_places` : nom, catégorie (restaurant, centre culturel, lieu de culte, marché…), point, description, pays, `createdBy`, `status` (`pending | published | rejected`).
- **Modération obligatoire** : un lieu proposé est `pending` ; publication par un modérateur. Sans cela, la carte devient un vecteur de spam et d'adresses privées.
- Les lieux sont publics (pas d'audience), donc pas de lien avec la position des personnes.
- Lecture par boîte englobante avec index spatial simple (`(lat, lon)` ou `earthdistance` si l'extension est autorisée).
- Question ouverte : source de départ des lieux (saisie communautaire seule, ou import d'un jeu ouvert type OpenStreetMap avec sa licence ODbL à respecter).

## Lot 3 — Événements

- Table `events` : titre, date de début et de fin, lieu (point ou `cultural_places.id`), organisateur, tribu optionnelle, visibilité (`public | tribe | friends`), RSVP.
- Dépend du lot 2 pour les lieux et des tribus (y compris privées : un événement d'une tribu privée suit les règles de lecture de C7).
- Notifications et rappels : à cadrer avec F9 pour ne pas multiplier les canaux.

## Décisions à prendre

1. Valides-tu l'ordre stories → lieux → événements ?
2. Lieux : saisie communautaire modérée seulement, ou import OpenStreetMap ?
3. Qui modère les lieux : l'équipe, ou les modérateurs de tribu concernés ?
4. Les posts (pas seulement les stories) doivent-ils pouvoir être géolocalisés ? Je le déconseille pour la v1 : un post est durable, donc la position aussi.

## Risques

- Fuite de position par recoupement (plusieurs stories au même endroit à des heures différentes) : la grille et le décalage par fenêtre de temps de F6 doivent s'appliquer aux marqueurs de contenu.
- Coût : requêtes par boîte englobante sur toute la table des stories actives. Prévoir un index sur `expires_at` (déjà présent) et un plafond de résultats.
- Dépend de F10 (tests de visibilité de `getPeopleNearby`) : ne pas démarrer le lot 1 avant que cette matrice existe.
