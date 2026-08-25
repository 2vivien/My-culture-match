# program.md — Consignes de la boucle

> Ce fichier, tu (Vivien) le remplis une fois par projet, en 5 minutes, avant de coller `LANCEMENT-BOUCLE.md`. L'agent le relit à chaque cycle et n'a pas le droit d'y toucher. Les crochets `[ ]` sont à remplacer ; le reste ne change pas d'un projet à l'autre.

---

## Objectif

Faire passer ce projet par les 3 vérificateurs (sécurité, audit technique, frontend/QA) jusqu'à un état où les 3 rapports finaux ne contiennent plus aucun point CRITIQUE ou HAUT non traité.

## Baseline

[à remplir par l'agent à l'étape 0 de LANCEMENT-BOUCLE.md — score typecheck/lint/tests/audit de départ]

## Autorisé

- Tout le code source applicatif (`src/`, `app/`, équivalent selon la stack).
- La création de nouveaux fichiers de correction, de nouveaux tests À HAUTE VALEUR.
- `.env.example` (création/mise à jour), jamais `.env`.

## Interdit — sans exception

- `program.md` (ce fichier).
- Les 3 fichiers `verificateur-0X-*.md`.
- `experiments.md` : ajout seul, jamais de modification ou suppression d'une entrée passée.
- Tout commit direct sur `main`.
- Tout `push` ou déploiement sans validation explicite de Vivien.
- Simuler une fonctionnalité pour faire passer un test plutôt que la construire réellement. Une fonctionnalité sans backend réel est supprimée ou marquée « bientôt disponible », jamais simulée.
- Affaiblir un test ou un vérificateur pour le faire passer.

## Contraintes de code (valables sur tous mes projets)

- Composants ≤ 50 lignes, pages ≤ 120 lignes (non négociable).
- Zéro `any` en TypeScript, typages stricts.
- Séparation stricte hooks / services / stores / types.
- Pattern `USE_MOCK` respecté s'il existe déjà dans le projet.
- Aucun commentaire superflu ; TSDoc en français uniquement si le fichier en a déjà.
- Un changement par cycle. Jamais plusieurs corrections mélangées dans un même commit.
- Git à chaque cycle, jamais de commit qui regroupe plusieurs corrections.

## Terminé quand

- Vérificateur sécurité : les 20 points passés en revue, 0 point CRITIQUE ou HAUT restant sans justification écrite dans le rapport final.
- Vérificateur audit technique : typecheck 0 erreur, lint 0 erreur/0 warning, build OK, tests 100 % verts.
- Vérificateur frontend/QA : tous les flux cœur identifiés (formulaires, boutons d'action principaux, parcours d'inscription/connexion) cliqués et validés par le navigateur piloté, 0 flux cassé.

## Arrêt anticipé si

- 3 cycles consécutifs sans amélioration mesurable sur le vérificateur en cours.
- Durée totale de la session au-delà de [4] heures.
- Nombre maximum de cycles atteint : [30].
- L'agent découvre qu'un des fichiers interdits (program.md, un vérificateur, experiments.md) semble contenir une erreur — dans ce cas il s'arrête et le signale, il ne corrige pas lui-même.

## Après chaque cycle

Ajoute une entrée en fin de `experiments.md`, au format donné dans `LANCEMENT-BOUCLE.md`. Les entrées passées ne se modifient jamais.
