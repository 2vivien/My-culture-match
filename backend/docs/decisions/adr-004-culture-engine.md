# ADR-004 — Culture Engine : fonctions pures + pondération fixe (V1)

## Contexte
Le produit (feed, love, amitié) dépend d'un moteur de scoring culturel. Il doit être
explicable, testable et sûr d'un point de vue éthique — pas une boîte noire.

## Options étudiées
1. **Fonctions pures déterministes + pondération fixe** (retenu)
2. ML / scoring appris (embedding + modèle) dès V1
3. Service externe de recommandation (coût, latence, dépendance)

## Décision
V1 = **fonctions pures** (`src/modules/culture-engine/scoring.ts`) avec **poids fixes**
et `chemistry` constant (0.5). Apprentissage progressif en V2.

## Pourquoi
- Déterministe → **testable unitairement** à 100 % (aucun réseau).
- Auditable : chaque composant (engagement, culture, éthique, safety) est isolé et pondéré.
- Conforme aux garde-fous éthiques L01-L12 (diversité, toxicité zéro, anti-addiction).
- Zéro coût d'inférence, latence nulle, pas de drift de modèle.
- Le feedback utilisateur (swipes, conversations) ajustera les poids plus tard.

## Conséquences
- Les scores sont reproductibles (tests goldens dans `tests/unit/culture-engine/`).
- V2 : l'embedding et les poids appris s'appuieront sur cette base pure.

## Évolution future
Calibration des poids via `health_metrics` + feedback explicite, toujours avec les
garde-fous éthiques en contrainte dure.
