# 02 — Modèle mathématique de compatibilité

## 1. Philosophie

Le moteur ne doit pas chercher un seul « score magique ». Il doit calculer plusieurs dimensions puis les fusionner.

```text
Hard constraints
    ↓
Feature compatibility
    ↓
Reciprocity
    ↓
Trust / confidence
    ↓
Diversity / novelty
    ↓
Final ranking
```

## 2. Vecteurs de préférence

Pour chaque personne `u`, construire un vecteur :

```text
x_u = [values, interests, goals, communication, culture, language, lifestyle]
```

Normaliser les dimensions dans `[0,1]`.

## 3. Similarité cosinus

Pour deux vecteurs `x` et `y` :

```text
cos(x,y) = (x · y) / (||x|| ||y||)
```

Puis :

```text
S_cos = (cos(x,y) + 1) / 2
```

utile lorsque les embeddings ou features sont centrés autour de valeurs négatives et positives.

## 4. Similarité pondérée

```text
S_content = Σ_i α_i s_i
```

avec :

```text
Σ_i α_i = 1
```

Exemple initial :

| Dimension | Poids initial |
|---|---:|
| Valeurs | 0.24 |
| Objectif relationnel | 0.18 |
| Communication | 0.14 |
| Intérêts | 0.14 |
| Culture / langues | 0.10 |
| Style de vie | 0.08 |
| Distance | 0.07 |
| Nouveauté / complémentarité | 0.05 |

Ces poids sont des **paramètres de départ**. Le système doit ensuite les apprendre et les recalibrer à partir des résultats.

## 5. Valeurs : intersection + importance

Pour les valeurs pondérées par importance :

```text
V(u,v) = Σ_k min(V_u,k, V_v,k) / Σ_k max(V_u,k, V_v,k)
```

Cette forme est proche d'une similarité de Jaccard pondérée.

Pour une valeur marquée « non négociable » :

```text
if hard_u ∩ incompatible_v ≠ ∅:
    reject
```

Une incompatibilité dure doit être traitée comme une contrainte, pas simplement comme -5 points.

## 6. Intérêts

Pour des ensembles simples :

```text
J(A,B) = |A ∩ B| / |A ∪ B|
```

Pour des intérêts pondérés : utiliser la version pondérée.

## 7. Distance

La distance géographique peut être calculée avec la formule de Haversine :

```text
a = sin²(Δφ/2) + cos(φ1) cos(φ2) sin²(Δλ/2)
c = 2 atan2(√a, √(1-a))
d = R c
```

où `R ≈ 6371 km`.

Transformations possibles :

```text
affinity_distance = exp(-d / τ)
```

`τ` dépend de la préférence de distance de l'utilisateur.

La distance ne doit jamais écraser une excellente compatibilité si l'utilisateur a explicitement choisi « international ».

## 8. Réciprocité

Le cœur du moteur est :

```text
A_prefers_B = P(B | A)
B_prefers_A = P(A | B)
```

On peut utiliser une moyenne géométrique :

```text
R = sqrt(A_prefers_B × B_prefers_A)
```

Pourquoi la moyenne géométrique ? Parce qu'elle pénalise fortement une relation unilatérale.

Exemple :

```text
A → B = 0.95
B → A = 0.20
R = sqrt(0.95 × 0.20) ≈ 0.436
```

Un simple moyenne arithmétique aurait donné 0.575 et serait trop indulgente.

## 9. Modèle bilatéral

Score de préférence de A envers B :

```text
P_A(B) = σ(f_A(B))
```

où `σ` est la fonction sigmoïde :

```text
σ(z) = 1 / (1 + e^-z)
```

Même chose pour B envers A.

Score réciproque :

```text
S_recip = sqrt(P_A(B) P_B(A))
```

## 10. Score global

Version production initiale :

```text
S_raw =
  0.32 × S_recip
+ 0.22 × S_values
+ 0.14 × S_goal
+ 0.10 × S_communication
+ 0.08 × S_interests
+ 0.06 × S_culture
+ 0.04 × S_distance
+ 0.04 × S_novelty
```

Puis appliquer la confiance :

```text
S_conf = C × S_raw + (1-C) × S_prior
```

`C` représente la confiance dans les données disponibles.

## 11. Similarité vs complémentarité

Deux personnes ne doivent pas être identiques.

Pour certaines dimensions :

```text
similarity = 1 - |x-y|
```

Pour d'autres, une distance intermédiaire peut être meilleure :

```text
complementarity = exp(-(x-y)² / (2σ²))
```

Le modèle doit apprendre dimension par dimension si « pareil » ou « complémentaire » produit de meilleurs résultats.

## 12. Embeddings

Pour les bios, réponses libres et conversations :

```text
E_u ∈ R^d
E_v ∈ R^d
S_semantic = cosine(E_u, E_v)
```

Ne jamais remplacer tout le modèle par l'embedding. Un embedding ne connaît pas correctement les contraintes de consentement, distance, disponibilité ou sécurité.

## 13. Score calibré

Le score brut n'est pas une probabilité.

Pour calibrer un score de ranking :

```text
p = sigmoid(a × S_raw + b)
```

ou utiliser isotonic regression / Platt scaling selon les données.

Ensuite seulement :

```text
UI_score = round(97 × p)
```

Le `97` est un choix UX : il évite l'illusion d'une certitude de 100%.

## 14. Incertitude

Deux profils peuvent avoir le même score mais des niveaux de confiance différents.

```text
final_utility = compatibility × confidence
```

Un 92 avec `confidence=0.95` peut être préférable à un 94 avec `confidence=0.40`.

## 15. Diversité Top 4

Ne pas retourner quatre clones.

Après le ranking initial, appliquer une sélection de type MMR :

```text
MMR(c) = λ Relevance(c) - (1-λ) max_j Similarity(c,j)
```

Ainsi, le Top 4 maximise à la fois la pertinence et la diversité.

## 16. Reranking final

```text
Final(c) =
  S_reciprocity
  × S_safety
  × S_confidence
  × S_consent
  + λ novelty
  - μ redundancy
```

Les facteurs de sécurité et consentement doivent idéalement être des **gates** avant le ranking, pas des bonus permettant à un profil dangereux de remonter.

## 17. Ce qui ne doit jamais être optimisé

Le modèle ne doit pas optimiser :

- temps passé dans l'application à tout prix ;
- nombre de messages à tout prix ;
- volume de likes ;
- dépendance émotionnelle ;
- exposition de personnes vulnérables ;
- discrimination sur des attributs protégés.

L'objectif principal est la **qualité d'une connexion réciproque et saine**.

## Références

- Palomares et al. — reciprocal recommendation. https://doi.org/10.1016/j.inffus.2020.12.001
- Pizzato et al. — people-to-people recommendation. https://doi.org/10.1007/S11257-012-9125-0
- Recommender Systems Handbook. https://link.springer.com/book/10.1007/978-1-0716-2197-4
