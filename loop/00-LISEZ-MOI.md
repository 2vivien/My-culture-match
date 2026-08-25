# La boucle universelle — mode d'emploi

Ce kit applique la méthode Karpathy (générateur ≠ vérificateur, jamais le même agent qui fait et qui juge) à 3 vérifications que tu veux systématiques sur **tous** tes projets, sans exception : l'audit technique, la sécurité, et le frontend testé comme un vrai utilisateur.

## Les 5 fichiers

| Fichier | Rôle | Qui le touche |
|---|---|---|
| `00-LISEZ-MOI.md` | ce fichier | toi seul, jamais l'agent |
| `program.md` | tes consignes, à adapter par projet (baseline, limites) | toi une fois par projet, jamais l'agent |
| `verificateur-01-audit-technique.md` | backend, frontend logique, tests, DB — condensé de `PROMPT_AUDIT.md` | jamais l'agent |
| `verificateur-02-securite.md` | les 20 failles + l'agent sécurité — condensé de `failles.pdf` | jamais l'agent |
| `verificateur-03-frontend-qa.md` | clic réel dans un navigateur via Playwright MCP | jamais l'agent |
| `LANCEMENT-BOUCLE.md` | le prompt maître que tu colles dans Claude Code | toi seul, jamais l'agent |
| `experiments.md` | la mémoire de la boucle — créé automatiquement au premier cycle | l'agent, en ajout seul |

## Installation sur un nouveau projet

1. Copie ces 6 fichiers dans un dossier `/loop/` à la racine du projet.
2. Ouvre `program.md`, remplis les crochets `[ ]` (durée max, nombre de cycles max) — le reste ne change jamais d'un projet à l'autre, c'est tes conventions habituelles.
3. Ouvre Claude Code à la racine du projet, sur une nouvelle branche (`git checkout -b loop/session-<date>`).
4. Colle le contenu de `LANCEMENT-BOUCLE.md`. C'est tout. La boucle recherche elle-même les outils qui lui manquent (Playwright MCP pour le clic navigateur, tout autre skill nécessaire), fait tourner les 3 vérificateurs dans l'ordre imposé (sécurité → audit technique → frontend), et ne s'arrête que sur une condition de `program.md`.

## Pourquoi cet ordre (sécurité → audit → frontend)

Une faille de sécurité coûte le plus cher si elle traîne, donc elle passe en premier. L'audit technique répare la base sur laquelle le frontend s'appuie. Le frontend/QA vient en dernier parce qu'il vérifie le résultat final avec un vrai navigateur — inutile de cliquer dans une app qui a encore des routes cassées.

## Ce que tu gardes sous contrôle

- Rien n'est jamais poussé (`push`) ou déployé sans ta validation.
- Tout se passe sur une branche dédiée, jamais sur `main`.
- Le rapport final te dit clairement ce qui a été corrigé et ce qui reste, sans enjoliver.
- `experiments.md` grossit projet après projet : relis-le de temps en temps, c'est là que sont les leçons apprises (ce qui a déjà été essayé et raté, pour ne pas le refaire).
