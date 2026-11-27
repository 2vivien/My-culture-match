# Audit 360 — My Culture Match

> **Date :** 27 novembre 2026  
> **Dépôt audité :** [2vivien/My-culture-match](https://github.com/2vivien/My-culture-match)  
> **Périmètre :** revue documentaire et inspection ciblée du dépôt via GitHub.  
> **Limite importante :** cet audit n'est pas un pentest ni une exécution locale. Je n'ai pas accès ici à l'environnement de déploiement, aux secrets, aux données, aux journaux CI complets ni à un clone exécutable. Les éléments décrits dans la documentation ne sont donc pas considérés comme validés en fonctionnement.

## Verdict exécutif

**État de préparation production : NO-GO en l'état des preuves disponibles.** Le dépôt contient une base ambitieuse — web, backend, authentification, matching, relations Love/Friendship, chat, signalements et documentation sécurité — mais plusieurs documents sont des spécifications ou déclarations d'implémentation. Leur présence ne prouve ni que les parcours marchent de bout en bout, ni que les protections tiennent sous des tests adversariaux.

Le premier risque à traiter est **sécurité et confiance** : le produit met en relation des personnes et stocke des messages et données personnelles. Il faut démontrer avant toute ouverture publique que le blocage, les signalements, le consentement, les contrôles d'accès, l'âge minimum et la suppression des données sont appliqués côté serveur. Ensuite, il faut prouver que le frontend n'est pas déployé en mode mock, que Love et Friendship sont réellement séparés de bout en bout, et que les chemins critiques passent la CI et une bêta fermée.

**Conclusion pratique :** une bêta privée et limitée peut être envisageable après les portes P0 ci-dessous. Je ne recommande pas de déclarer une mise en production publique « prête aujourd'hui » sur la seule base de ce dépôt et de ses documents.

## Échelle de statut

- **Documenté** : mentionné dans un document ou une configuration.
- **À confirmer** : le dépôt contient une déclaration ou un élément partiel, mais le comportement réel, sa couverture ou son déploiement n'a pas été vérifié.
- **Manquant / bloquant** : explicitement listé comme travail restant, ou preuve indispensable absente de ce périmètre.
- **Non vérifié** ne signifie pas automatiquement « absent » ; il faut une preuve reproductible.

## Ce que le dépôt montre

- Le README racine ne contient qu'un titre. La documentation produit et opérationnelle est répartie dans plusieurs fichiers, et l'accueil du dépôt n'explique pas encore comment lancer, tester et déployer l'ensemble.
- `SKILL-audit-fonctionnel-ultra-complet.md` indique que le web a été conçu initialement en mode mock, avec `VITE_USE_MOCK=true` par défaut et des services REST utilisés quand le mock est désactivé. Cette indication doit être revalidée sur le code actuel et les variables de chaque environnement.
- `backend/package.json` déclare des commandes de lint, typecheck, build, tests unitaires et intégration. Leur existence ne confirme pas leur dernier résultat.
- `.github/workflows/ci.yml` décrit une CI backend (lint, typecheck/build, tests unitaires et intégration). Les filtres de déclenchement sont centrés sur `backend/**` ; les changements web ne semblent pas couverts par cette CI backend. L'état des exécutions n'a pas été vérifié.
- `.github/workflows/deploy.yml` décrit une construction/poussée d'image GHCR et un smoke test de services. Le déploiement réel vers un environnement public, les validations de promotion/rollback et l'état des exécutions ne sont pas confirmés.
- `docs/CONSENT_TRUST_SAFETY.md`, `docs/CHAT_V2.md` et `backend/docs/security/threat-model.md` documentent des protections et interactions. Ce sont des affirmations à confronter au code et à des tests.
- `docs/MY_CULTURE_MATCH_AUDIT_ROADMAP.md` reconnaît déjà des portes de lancement non négociables : Trust & Safety, visibilité/privacy, boucle MVP, tests, CI, monitoring, sauvegarde et restauration. C'est une feuille de route, pas une preuve de réalisation.

## Registre détaillé des écarts et actions restantes

### P0 — à fermer avant toute bêta ouverte ou production publique

#### 1. Sécurité applicative et autorisations — **À démontrer, priorité urgente**
Le modèle de menace décrit OTP, sessions, OAuth, SQL, téléversements, blocage global, modération et journaux admin. Je n'ai pas pu valider chaque route, middleware, politique de stockage ou test d'autorisation.

À faire :
- Construire une matrice **route × rôle × propriétaire × état de consentement** ; auditer toutes les routes REST, WebSocket, tâches et interfaces admin.
- Tester qu'un utilisateur ne lit/modifie jamais le profil, la conversation, le message, le média ou le signalement d'un autre utilisateur (IDOR/BOLA).
- Vérifier dans le code les contrôles de participation aux conversations sur chaque lecture et mutation, pas uniquement à l'envoi.
- Vérifier l'authentification et l'autorisation des sockets, l'origine autorisée, les événements rejoués, la reconnexion et les limites de débit.
- Vérifier OTP : réponse non énumérable, expiration, usage unique, limites par compte/IP/appareil, verrouillage et invalidation ; vérifier aussi récupération de compte et révocation globale des sessions.
- Vérifier OAuth par validation cryptographique et audience/issuer/nonce, et les cookies `HttpOnly`, `Secure`, `SameSite` selon le flux réellement déployé.
- Revoir téléversements : taille réelle, MIME et signature du fichier, décodage/ré-encodage, antivirus/modération selon risque, accès privé, URLs signées à durée courte, limites et purge.
- Vérifier secrets, CORS, CSP et en-têtes, CSRF si applicable, logs sans données sensibles, dépendances vulnérables et accès admin avec RBAC + audit.
- Faire un audit indépendant/pentest ciblé et corriger les constats avant ouverture.

**Critère de sortie :** revue route par route documentée, tests négatifs automatisés sur les accès croisés et validation sécurité signée avec aucun P0/P1 ouvert.

#### 2. Love / Friendship et consentement — **Documenté, parcours réel non prouvé**
La documentation dit séparer les relations Love et Friendship, les réglages `loveEnabled` et `friendshipEnabled`, et faire primer le blocage. Il faut vérifier que cette séparation est vraie dans le modèle, les API, les recommandations, les compteurs, les notifications et l'interface.

À faire :
- Exécuter les scénarios croisés : consentement désactivé, visibilité limitée, blocage dans un sens et l'autre, désactivation après match, suppression de compte, demande répétée et comptes suspendus.
- Confirmer qu'un match Love ne crée jamais une relation compagnon Friendship par effet secondaire et qu'une connexion d'amitié ne déclenche pas une intention amoureuse.
- Contrôler l'âge minimum côté serveur, les préférences affichées, les filtres sensibles et l'absence d'exposition de localisation précise.
- Définir l'expérience si l'un des utilisateurs retire son consentement : visibilité, conversation, notifications, données déjà partagées et recours.
- Vérifier explication du matching, biais, reproductibilité et absence de score trompeur/non expliqué.

**Critère de sortie :** tests d'intégration de la matrice de consentement et du blocage sur discovery, Love, Friendship, chat et notifications.

#### 3. Signalement, blocage, modération et abus — **Décrit, capacité opérationnelle inconnue**
Le document Trust & Safety liste reports d'utilisateurs/posts/commentaires/messages, mute, modération, appels et anti-spam. Le modèle de menace évoque une file de modération, mais l'équipe, les délais et le fonctionnement réel ne sont pas confirmés.

À faire :
- Vérifier l'UI et l'API de signalement sur profil, contenu et message ; accusé de réception, motif, preuve, anti-doublon et confidentialité du déclarant.
- Tester l'effet immédiat du blocage sur découverte, recherche, flux, Love, Friendship, messages, sockets et push ; vérifier la réciprocité et la levée du blocage.
- Définir file admin, rôles minimum, SLA, procédures d'escalade, sanctions graduées, preuves, audit immuable et appel.
- Contrôler anti-spam/rate limit par action et par compte, limites de nouveaux contacts, liens, pièces jointes, création de comptes et contournement après blocage.
- Préparer procédures d'urgence pour menace crédible, harcèlement, contenu illégal et comptes compromis, adaptées aux pays d'ouverture.

**Critère de sortie :** une équipe peut recevoir, prioriser, traiter et tracer un signalement de test, et bloquer effectivement l'auteur.

#### 4. Données personnelles et conformité — **Partiel / non démontré**
La feuille de route reconnaît les politiques, consentements, export, suppression et conservation comme travaux à documenter. Le threat model mentionne la purge après soft delete « à prévoir ». Pour un produit relationnel, c'est un bloqueur de lancement public.

À faire :
- Établir inventaire des données, finalités, bases légales, sous-traitants, transferts, durées de conservation et accès internes.
- Publier conditions, politique de confidentialité, règles communautaires, procédure de signalement et politique IA, cohérentes avec les flux réellement activés.
- Implémenter et vérifier export, suppression de compte et purge/expiration des copies dans DB, médias, recherche, cache, queues, logs et sauvegardes selon la politique.
- Ajouter réglages de visibilité granulaires, préférences de contact, consentement séparé Love/Friendship, retrait et journal de consentement.
- Valider l'âge, les exigences des pays ciblés et le traitement spécifique des données sensibles/inférées avec conseil compétent avant expansion.

**Critère de sortie :** parcours testé d'export et de suppression complète, textes publiés, registre des traitements et fournisseurs validés.

#### 5. Le produit doit sortir du mode mock — **Risque concret mentionné dans la doc**
Le document d'audit fonctionnel affirme que le web fonctionne entièrement en mock par défaut. Tant que la configuration effective des déploiements web n'est pas vérifiée, on ne peut pas savoir si les utilisateurs testent une vraie API.

À faire :
- Inspecter `src/services/api.ts`, les services, les mocks et les configurations de build/déploiement actuels.
- Rendre impossible le démarrage de build production avec `VITE_USE_MOCK=true) ou sans `VITE_API_URL` valide ; afficher une erreur explicite.
- Vérifier chaque écran majeur avec données persistées : auth, profil, onboarding, Explore, recherche, Love, Friendship, chat, signalement, notifications.
- Supprimer les actions factices ou les étiqueter uniquement dans les environnements de développement/démo.

**Critère de sortie :** build production configuré sur API réelle, parcours e2e utilisant un backend non mock et preuve qu'une écriture survit au rechargement.

#### 6. Parcours MVP et critères de lancement — **À fermer par E2E**
Prouver le chemin complet : inscription → consentements/onboarding → profil culturel → découverte → raison de recommandation → demande Love ou Friendship distincte → acceptation → conversation → blocage/signalement → retour et notification.

Inclure erreurs API, latence, état vide, compte suspendu, réseau coupé, doublon et suppression. Documenter ce qui est effectivement dans le MVP ; ne pas laisser des boutons ou menus promettre des actions inactives.

### P1 — avant généralisation et croissance

#### 7. Chat, livraison et pièces jointes — **Fonctions documentées, sémantique à clarifier**
`docs/CHAT_V2.md` décrit historique paginé, optimisme avec rollback, lecture, réponse, édition 15 minutes, suppression logique, réactions, épinglage, typing, événements socket et polling REST toutes les 5 secondes. La même documentation indique que le client actuel s'appuie sur le polling REST comme fallback et qu'un abonnement WebSocket natif peut venir plus tard.

À faire :
- Vérifier l'expérience réelle sur web et mobile : reçu/envoyé/échoué, reprise après reconnexion, ordre des messages, doublons, pagination, read receipts et synchronisation multi-appareil.
- Décider si le polling 5 s est acceptable en coût et batterie à l'échelle ; mesurer avant de le conserver.
- Compléter les pièces jointes si promises dans l'interface, et modération/suppression des médias.
- Clarifier la confidentialité des messages épinglés, réactions, mémoire relationnelle/IA et journalisation.

#### 8. Qualité, tests et CI — **Scripts/workflow présents, couverture et résultats non vérifiés**
À faire :
- Récupérer les derniers résultats CI et rendre obligatoires les checks pertinents sur PR.
- Ajouter CI web : lint/typecheck, build, tests unitaires et E2E ; intégrer mobile si livré.
- Vérifier les tests de sécurité/consentement, permissions, chat et Love/Friendship ; mesurer la couverture utile plutôt qu'un chiffre global.
- Revoir le scope des workflows : les chemins web, infra, migrations et docs contractuelles doivent déclencher leurs validations adaptées.
- Ajouter scans de dépendances/secrets et analyses statiques ; mettre à jour les dépendances à risque.
- Définir migrations compatibles, backup pré-déploiement et procédure de retour arrière.

#### 9. Exploitabilité / production — **Architecturé, preuves manquantes**
À faire :
- Health et readiness checks testés, métriques utiles, logs structurés avec correlation ID, traces et alertes actionnables.
- Dashboards et alertes pour erreurs auth, OTP, messages, jobs en échec, saturation DB/Redis, abus, temps de réponse et coûts.
- Backups chiffrés, rétention et **restauration réellement testée** ; définir RPO/RTO et procédure de crise.
- Tester files de jobs : retry, idempotence, poison messages, DLQ et rejeu.
- Tester charge réaliste du feed, recherche, matching, chat, sockets, stockage média et workers ; fixer des objectifs SLO.
- Documenter environnements dev/staging/prod, propriétaires, rotation des secrets et accès, runbooks, déploiement progressif, rollback et statut de l'environnement public.
- Vérifier licences, provenance et versions d'images Docker (éviter les tags flottants de type `latest` pour composants critiques de CI/prod).

#### 10. UX, accessibilité et internationalisation — **Non démontrées**
À faire :
- Parcours clavier/lecteur d'écran, labels, focus, contrastes, zoom, erreurs accessibles et tailles de cible mobile.
- Tester mobile réel, écrans étroits, appareils lents, réseau dégradé et langues longues/RTL si ciblées.
- Vérifier traductions complètes, formats locaux, fuseaux horaires, consentements compréhensibles et contenu culturel contextualisé.
- Expliquer clairement l'intention Love vs amitié, les contrôles de visibilité et les raisons de recommandation.

#### 11. Lancement produit et support — **À définir**
À faire :
- Choisir une zone/langue/communauté initiale et mesurer la densité réelle de profils actifs, sinon matching et discovery paraîtront vides.
- Définir critères d'admission à la bêta, support, retours, gestion d'incident, responsables et calendrier de réponse.
- Mesurer activation, complétion onboarding, taux de connexion acceptée, premier message/réponse, conversation utile, rétention et signalements.
- Établir limites de coûts (infra, email, recherche, IA) et mécanisme de désactivation des fonctionnalités coûteuses.

### P2 — après validation du cœur et de la sécurité

- Groupes/tribus, événements, Culture Cards, vidéo/audio et monétisation : les maintenir hors du chemin critique jusqu'à ce que discovery → relation → conversation fonctionne sûrement.
- Traduction et Lyra : définir quelles données quittent l'app, consentement explicite, conservation, erreurs/hallucinations, signalement et possibilité de désactivation.
- Réputation/vérification : préciser la preuve, les risques d'exclusion et l'appel avant d'ajouter des badges ou scores.

## Plan de travail conseillé

### Porte 0 — immédiatement
1. Geler toute ouverture publique annoncée tant que les preuves P0 ne sont pas réunies.
2. Vérifier l'environnement web déployé et interdire mock en production.
3. Revue sécurité des routes, autorisations, sessions, sockets, uploads et secrets.
4. Tester block/report/consentement sur tous les canaux ; corriger tout contournement.
5. Vérifier âge, conditions, confidentialité, export et suppression.
6. Exécuter les workflows CI disponibles, relever les résultats et ajouter les checks web manquants.

### Porte 1 — bêta privée
1. Fermer le parcours E2E Auth → profil → Love/Friendship → chat → sécurité.
2. Ouvrir à un petit groupe avec support humain et monitoring actif.
3. Tester la restauration, les alertes, la charge de pointe attendue et le rollback.
4. Revoir les signalements et retours de la bêta avant l'extension.

### Porte 2 — production publique
1. Aucun P0/P1 sécurité ou données personnelles ouvert.
2. Restauration et rollback éprouvés ; alertes et responsables opérationnels.
3. CI obligatoire verte pour web/backend et parcours critiques.
4. Modération staffée, procédures publiées et support en capacité.
5. Décision de lancement basée sur indicateurs de sécurité, stabilité et densité communautaire.

## Questions qui restent à trancher dans le projet

- Quelle URL et quel environnement sont réellement considérés comme la production ?
- Les apps mobile et admin sont-elles dans le périmètre de la première sortie ?
- Quel pays ou groupe d'âge est ciblé pour le premier lancement ?
- Love signifie-t-il exclusivement rencontres adultes, et quel est le traitement des comptes qui retirent leur consentement ?
- Qui surveille les signalements et les incidents, et à quel délai de réponse s'engage-t-on ?
- Quelles fonctions actuellement visibles sont garanties pour la bêta, et lesquelles doivent être masquées jusqu'à leur disponibilité ?

## Sources internes consultées

- [README.md](https://github.com/2vivien/My-culture-match/blob/main/README.md)
- [Audit fonctionnel ultra-complet](https://github.com/2vivien/My-culture-match/blob/main/SKILL-audit-fonctionnel-ultra-complet.md)
- [Roadmap d'audit produit et technique](https://github.com/2vivien/My-culture-match/blob/main/docs/MY_CULTURE_MATCH_AUDIT_ROADMAP.md)
- [Consentement et Trust & Safety](https://github.com/2vivien/My-culture-match/blob/main/docs/CONSENT_TRUST_SAFETY.md)
- [Chat V2](https://github.com/2vivien/My-culture-match/blob/main/docs/CHAT_V2.md)
- [Modèle de menace backend](https://github.com/2vivien/My-culture-match/blob/main/backend/docs/security/threat-model.md)
- [Scripts backend](https://github.com/2vivien/My-culture-match/blob/main/backend/package.json)
- [Scripts web](https://github.com/2vivien/My-culture-match/blob/main/myculturematch-web/package.json)
- [CI backend](https://github.com/2vivien/My-culture-match/blob/main/.github/workflows/ci.yml)
- [Déploiement backend](https://github.com/2vivien/My-culture-match/blob/main/.github/workflows/deploy.yml)

---
**Cet audit est un instantané documentaire au 27 novembre 2026.** Refaire la vérification après correction des écarts et contre l'environnement réellement déployé avant toute décision de mise en production.
