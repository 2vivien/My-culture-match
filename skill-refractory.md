ARCHITECTURE

Respecter une architecture Enterprise et Clean Architecture.

L'objectif est d'obtenir un projet évolutif, maintenable et performant pouvant accueillir plusieurs milliers d'utilisateurs simultanément.

Ne jamais créer de gros fichiers.

Le projet doit être découpé en micro-fonctionnalités.

Chaque fonctionnalité possède son propre dossier.

Exemple :

auth/
    controllers/
    services/
    repositories/
    middlewares/
    validators/
    dto/
    routes/
    interfaces/
    types/
    utils/

Même principe pour toutes les autres fonctionnalités :

users
marketplace
products
tenants
sales
customers
notifications
otp
profile
favorites
etc.
BACKEND

Le backend doit être extrêmement modulaire.

Respecter obligatoirement la séparation suivante :

routes
middlewares
controllers
services
repositories
validators
DTO
interfaces
types
helpers
utils
constants

Les routes ne doivent jamais contenir de logique métier.

Les middlewares ne doivent gérer que :

authentification
autorisation
validation
parsing
sécurité
rate limiting
gestion des permissions

Les controllers ne doivent contenir que la réception de la requête et le retour de la réponse.

Toute la logique métier doit être déplacée dans les services.

Les services ne doivent jamais accéder directement à Express.

L'accès à Prisma doit passer par les repositories.

Créer autant de petits fichiers que nécessaire.

Chaque fonction doit avoir une seule responsabilité.

Chaque dossier représente une fonctionnalité indépendante.

LIMITE DE TAILLE DES FICHIERS

Le code doit être fortement découpé.

Backend :

idéalement moins de 50 lignes par fichier
si nécessaire, ne jamais dépasser 80 lignes

Frontend :

une page ne doit jamais dépasser 120 lignes
un composant ne doit jamais dépasser 50 lignes
si un composant devient plus grand, le découper immédiatement en plusieurs composants
un hook personnalisé doit rester petit et dédié à une seule responsabilité

Ne jamais créer de composants ou de services "fourre-tout".

FRONTEND

Organiser le frontend de manière professionnelle.

Chaque fonctionnalité possède son propre dossier.

Séparer clairement :

pages
layouts
components
hooks
contexts
providers
services
api
stores
validators
utils
constants
types
interfaces

Créer autant de composants réutilisables que possible.

Extraire automatiquement toute logique répétée dans des hooks personnalisés.

Les pages ne doivent servir qu'à assembler des composants.

QUALITÉ DU CODE

Utiliser :

TypeScript strict
Aucun any
Aucun @ts-ignore
Aucun code dupliqué
SOLID
Clean Architecture
DRY
KISS
Validation avec Zod
Prisma fortement typé
Gestion centralisée des erreurs
Logging structuré
JWT sécurisé
OTP sécurisé
Architecture évolutive
Code prêt pour plusieurs milliers d'utilisateurs

Le code doit être lisible, documenté et facilement maintenable.

IMPORTANT

Ne jamais casser les fonctionnalités existantes.

Toujours réutiliser les modèles Prisma existants lorsqu'ils répondent déjà au besoin.

Créer des migrations Prisma propres.

Mettre à jour automatiquement :

les routes
les contrôleurs
les services
les repositories
les DTO
les validators
les interfaces
les types

Toutes les nouvelles fonctionnalités doivent être entièrement intégrées à l'architecture actuelle, testées et compatibles avec le système multi-tenant existant.

PERFORMANCE & OPTIMISATION

L'application est destinée à accueillir plusieurs milliers d'utilisateurs simultanément.

Toutes les fonctionnalités doivent être développées en privilégiant les performances, la réduction du coût serveur et la diminution du nombre de requêtes.

Chaque décision technique doit être pensée pour limiter la consommation CPU, RAM, bande passante et accès à la base de données.

API

Les API doivent être conçues de manière intelligente.

Ne jamais effectuer plusieurs requêtes lorsqu'une seule peut suffire.

Éviter les appels inutiles.

Ne jamais créer de boucles de requêtes entre le frontend et le backend.

Limiter le nombre de requêtes HTTP.

Réutiliser les données déjà récupérées lorsque cela est possible.

Toujours privilégier une seule requête optimisée plutôt que plusieurs petites requêtes successives.

REQUÊTES SQL

Toutes les requêtes Prisma doivent être optimisées.

Éviter les recherches complexes lorsqu'elles ne sont pas nécessaires.

Toujours sélectionner uniquement les champs utiles avec select.

Ne jamais récupérer des colonnes inutilisées.

Limiter les relations include au strict nécessaire.

Éviter les requêtes imbriquées coûteuses.

Éviter les parcours N+1.

Créer les index Prisma nécessaires sur les colonnes fréquemment utilisées.

Optimiser les recherches avec des index adaptés.

Toujours privilégier des requêtes rapides.

PAGINATION

Toutes les listes doivent être paginées.

Ne jamais charger toute une table.

Utiliser :

pagination
cursor pagination lorsque pertinent
limite configurable
tri optimisé

Ne jamais retourner plusieurs milliers de lignes en une seule réponse.

CHARGEMENT

Ne jamais charger les données à l'infini.

Utiliser :

Lazy Loading
Infinite Scroll uniquement lorsque cela apporte une vraie valeur
Virtualisation des longues listes si nécessaire

Le frontend ne doit jamais télécharger des données invisibles.

CACHE

Mettre en place un cache intelligent.

Réutiliser les réponses déjà obtenues.

Éviter de rappeler la même API plusieurs fois.

Mettre à jour uniquement les données réellement modifiées.

Utiliser un cache côté client adapté (par exemple TanStack Query) avec des temps d'expiration cohérents.

FRONTEND

Ne jamais déclencher une requête à chaque rendu.

Toujours contrôler les dépendances des hooks.

Éviter les re-render inutiles.

Mémoïser les calculs coûteux.

Mémoïser les composants lorsque cela améliore les performances.

Ne jamais effectuer plusieurs appels identiques simultanément.

Annuler les anciennes requêtes lorsqu'une nouvelle recherche est lancée.

RECHERCHE

Les recherches doivent être optimisées.

Utiliser un debounce de 300 à 500 ms.

Ne jamais envoyer une requête à chaque frappe clavier.

Ne lancer une recherche qu'après un minimum de caractères si cela est pertinent.

Toujours paginer les résultats.

SYNCHRONISATION

Ne jamais resynchroniser toute la base de données.

Synchroniser uniquement les données modifiées.

Envoyer uniquement les différences.

Limiter les échanges réseau au strict minimum.

RÉPONSES API

Les réponses doivent être légères.

Ne jamais retourner des objets inutiles.

Compresser les réponses lorsque cela est possible.

Retourner uniquement les informations demandées.

ÉVITER ABSOLUMENT
Boucles infinies de requêtes
Appels API en cascade
Requêtes SQL non optimisées
Chargement complet d'une table
Données dupliquées
Rechargement complet d'une page après une modification
Polling inutile
Appels répétés au même endpoint
Calculs lourds côté client si le serveur peut les faire une seule fois
OBJECTIF

Construire une application fluide, rapide et économique.

Chaque fonctionnalité doit être pensée pour réduire le nombre de requêtes, limiter les accès à la base de données et garantir une excellente expérience utilisateur, tout en restant évolutive et capable de gérer plusieurs milliers d'utilisateurs simultanément.