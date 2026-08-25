# verificateur-03-frontend-qa.md

> Vérificateur indépendant. Le générateur n'a pas le droit de modifier ce fichier.
> Contrairement aux 2 autres, celui-ci ne lit pas le code pour juger : il clique réellement dans un navigateur, comme un utilisateur. C'est un test en boîte noire.

## Prérequis (une seule fois par machine/projet)

Si aucun serveur MCP de contrôle navigateur n'est déjà connecté à cette session : cherche sur le web la méthode d'installation actuelle du serveur MCP officiel de Playwright (`@playwright/mcp`), installe-le, connecte-le à Claude Code, et vérifie qu'il répond (navigation vers une page de test) avant de continuer. Si le projet est mobile natif sans surface web, cherche l'équivalent pilotable (Maestro, Appium, simulateur scriptable) et adapte les étapes ci-dessous en conséquence — note ton choix dans `experiments.md`.

Pendant ce vérificateur, limite-toi aux outils de contrôle navigateur (navigation, clic, saisie, capture d'écran) et à la lecture des réponses réseau observées dans le navigateur. Ne relis pas le code source pour deviner ce qu'un bouton devrait faire : clique, observe ce qui se passe réellement, et compare au comportement attendu. C'est ce qui force un test réellement en boîte noire, au plus proche d'un vrai utilisateur.

## Volet API — en complément du clic navigateur

Ce vérificateur ne se limite pas au clic dans le navigateur : il teste aussi directement les endpoints API, en boîte noire côté contrat (sans lire le code serveur). Pour chaque route API touchée par un flux de la phase A, cherche/installe si besoin un client HTTP scriptable (curl, httpie, ou un client déjà présent dans le projet) et vérifie : le code de statut retourné correspond au cas testé (200/201 sur succès, 400/401/403/404 sur les cas d'erreur attendus, jamais un 500 sur une simple erreur de validation) ; le format de la réponse est stable et cohérent avec ce que le frontend attend réellement (pas ce que la doc promet) ; un appel sans authentification sur une route protégée est bien refusé ; les messages d'erreur renvoyés au client ne contiennent pas de trace technique complète. Note chaque route testée dans le même format que la phase B ci-dessous, avec `flux :` remplacé par `route :`.

## Phase A — Cartographie des flux à tester

Avant de cliquer, liste les flux cœur du projet (typiquement, sans s'y limiter) :
- inscription, connexion, déconnexion, mot de passe oublié ;
- chaque formulaire principal (création, édition, suppression d'une ressource) ;
- chaque bouton d'action visible sur les écrans principaux ;
- navigation entre les pages/sections principales ;
- recherche et filtres s'ils existent ;
- flux de paiement / Mobile Money s'ils existent (Kkiapay, Fedapay ou équivalent) — sans jamais utiliser de vraies données de paiement.

## Phase B — Exécution, un flux à la fois

Pour chaque flux : navigue, remplis les champs avec des données de test réalistes, clique, observe le résultat réel dans le navigateur (pas ce que le code est censé faire). Note pour chaque flux :

```
[OK] ou [CASSÉ] ou [PARTIEL]
flux : [nom]
étapes reproduites : ...
comportement observé : ...
comportement attendu : ...
capture d'écran prise : oui/non
```

Vérifie systématiquement sur chaque flux :
- le retour visuel en cas de succès et d'erreur (toast, message, état de chargement) ;
- qu'un formulaire vide ou mal rempli donne un message clair, pas un plantage silencieux ;
- que le clavier/tab permet d'atteindre les éléments cliquables principaux ;
- qu'aucune donnée factice n'est affichée à la place d'une vraie donnée (compteur à 0 fixe, date « il y a 2j » codée en dur, email hardcodé) ;
- la réactivité de base : pas de gel visible de plus de quelques secondes sur une action simple.

## Phase C — Rapport

Un tableau : flux testé → état → capture si cassé → correctif proposé. Classe les flux cassés par gravité : un flux qui empêche de créer un compte ou de payer passe avant un flux secondaire.

## Phase D — Correction

Le générateur corrige un flux à la fois, dans le code source (jamais dans ce fichier). Après chaque correction, ce vérificateur reclique le même flux dans le navigateur pour confirmer avant de passer au suivant — pas de correction validée sur la seule lecture du code corrigé.

## Terminé quand

Tous les flux cœur listés en phase A sont `[OK]`, avec au moins une capture d'écran de confirmation par flux critique (inscription, connexion, action de paiement si applicable) dans `experiments.md`.
