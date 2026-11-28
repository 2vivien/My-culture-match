# LANCEMENT-BOUCLE.md — Prompt maître

> Ce fichier ne se modifie jamais. Colle-le tel quel dans Claude Code, à la racine de n'importe lequel de tes projets, dès que `program.md` et les 3 vérificateurs sont présents dans le dossier `/loop/`.
> C'est le seul prompt que tu tapes. Tout le reste s'enchaîne seul.

---

## À COLLER TEL QUEL

Tu es l'opérateur d'une boucle générateur-vérificateur (méthode Karpathy). Ce dossier contient un système que tu dois faire tourner sans intervention humaine entre les cycles, sauf indication contraire.

Avant de commencer, lis dans l'ordre :
1. `/loop/program.md` — tes consignes générales, la baseline, les limites.
2. `/loop/verificateur-01-audit-technique.md`
3. `/loop/verificateur-02-securite.md`
4. `/loop/verificateur-03-frontend-qa.md`

**Règle absolue et sans exception** : tu ne modifies jamais les 4 fichiers ci-dessus, ni `experiments.md` une fois une entrée écrite. Ce sont tes fichiers de vérification et ta mémoire. Si tu penses qu'ils contiennent une erreur, arrête-toi et signale-le dans le rapport au lieu de les corriger toi-même.

### Étape 0 — Reconnaissance et préparation des outils

1. Identifie la stack exacte du projet (framework, backend, base de données, gestion des tests, CI).
2. **Skills de code pour chaque techno détectée.** Pour chaque brique de la stack (ex. Next.js, React Native, GraphQL, Node.js, Prisma, Tailwind, la techno de paiement local utilisée), cherche toi-même sur le web les meilleures pratiques et skills à jour pour cette techno précise (skills officiels Anthropic s'ils existent, guides de référence reconnus, conventions communément admises en 2026), et charge-les/installe-les comme référence avant d'écrire la moindre ligne de correction. Objectif : que chaque correction suive les meilleures pratiques actuelles de sa techno, pas seulement tes conventions à toi. Note dans `experiments.md` les skills retenus par techno, en une ligne chacun.
3. **Outils de vérification.** Regarde si un serveur Playwright MCP est déjà configuré dans ce projet ou sur cette machine. S'il ne l'est pas et que le projet a un frontend web (pas uniquement mobile natif), cherche toi-même sur le web la méthode d'installation actuelle du serveur MCP officiel de Playwright (`@playwright/mcp`), installe-le et configure-le pour cette session. Tu as besoin de contrôler un vrai navigateur pour le vérificateur 3 — pas de deviner l'UI en lisant le code.
4. Si le projet est en React Native / mobile pur sans web, cherche à la place l'outil équivalent disponible (simulateur/émulateur pilotable, Maestro, Appium) et documente ton choix dans `experiments.md` avant de continuer.
5. Si un autre skill ou outil te semble nécessaire pour bien exécuter un des 3 vérificateurs (lint spécifique au framework, scanner de dépendances, client HTTP pour tester des endpoints API directement, etc.), cherche-le et installe-le maintenant, pas en plein cycle.
6. Lance les commandes de vérification de base (typecheck, lint, tests) et note le score de départ CHIFFRÉ dans `experiments.md`. Crée un commit git `baseline`.

### Étape 1 — La boucle

Répète ce cycle jusqu'à la condition d'arrêt de `program.md` :

1. Relis `program.md`.
2. Choisis le prochain vérificateur à exécuter en respectant l'ordre imposé : d'abord `verificateur-02-securite.md` (les failles coûtent le plus cher), puis `verificateur-01-audit-technique.md`, puis `verificateur-03-frontend-qa.md`. Ne passe au vérificateur suivant que quand le précédent est à l'état « terminé » défini dans `program.md`, sauf si `program.md` dit explicitement de les alterner.
3. Exécute ce vérificateur exactement selon ses propres instructions. Il produit un rapport, PAS des corrections automatiques tant que la phase « audit » de ce vérificateur n'est pas explicitement terminée.
4. **Ne fais pas tout toi-même : délègue.** Pour l'audit comme pour la correction, lance des sous-agents spécialisés par domaine (un sous-agent sécurité, un sous-agent backend/API, un sous-agent frontend, un sous-agent tests, un sous-agent schéma DB/archi) plutôt qu'un seul agent généraliste qui fait tout séquentiellement. Donne à chaque sous-agent un périmètre de fichiers strictement disjoint de celui des autres pour qu'ils puissent tourner en parallèle sans se marcher dessus. Les fondations partagées (helpers d'auth, config, schéma DB) se corrigent en premier et seul, avant de lancer les sous-agents parallèles qui s'appuient dessus.
5. Une fois le rapport produit, corrige UN problème à la fois, dans les fichiers autorisés par `program.md` uniquement. Ne touche jamais aux fichiers de test/vérification eux-mêmes.
6. Relance la commande de vérification associée. Score meilleur ou égal → commit avec le problème corrigé en message. Score moins bon → revert immédiat.
7. Ajoute une entrée à la fin de `experiments.md` : `[vérificateur] [date] hypothèse : ... | changement : ... | résultat : ... | verdict : gardé/annulé | leçon : ...`. N'écris jamais dans une entrée déjà existante.
8. Ne répète jamais une correction déjà tentée et annulée pour la même raison.

### Étape 2 — Rapport final

Ne me redemande rien entre les cycles. Continue jusqu'à la condition « terminé » ou une condition d'arrêt de `program.md`. À la fin (ou si tu t'arrêtes sur une condition d'arrêt), rends un rapport unique :
- score de départ → score final, par vérificateur ;
- tableau de tous les cycles (vérificateur, problème, verdict) ;
- les failles de sécurité corrigées (les 20 points, présent/absent) ;
- les flux frontend testés et leur état avant/après ;
- les limitations restantes assumées, sans les enjoliver ;
- rien n'a été poussé (push) ni déployé sans validation explicite de ma part.

Travaille sur une branche dédiée (`loop/session-<date>`), jamais sur `main`. Ne commite rien en dehors de cette branche.
