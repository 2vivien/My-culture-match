# Recommendation Mathematics & Models

## 1. Similarity

### Cosine

```text
cos(a,b) = (a·b)/(||a|| ||b||)
```

Utilisation : embeddings de profils, contenus, thèmes, cultures.

### Weighted Jaccard

```text
J(A,B)=Σmin(a_i,b_i)/Σmax(a_i,b_i)
```

Utilisation : intérêts/tags pondérés.

## 2. Distance

Haversine :

```text
a = sin²((φ2-φ1)/2) + cosφ1 cosφ2 sin²((λ2-λ1)/2)
D = 2R asin(√a)
```

Distance affinity :

```text
A_d = exp(-D/τ)
```

## 3. Recency

```text
R(t)=exp(-λt)
```

## 4. Popularity normalization

```text
P = log(1 + interactions)
```

Normaliser par cohorte si nécessaire.

## 5. Reciprocal score

Pour Love ou certaines relations bilatérales :

```text
M = sqrt(S_AB × S_BA)
```

La moyenne géométrique pénalise une forte asymétrie.

## 6. Harmonic mean

Alternative :

```text
H = 2AB/(A+B)
```

Utile lorsque les deux côtés doivent être simultanément bons.

## 7. Complementarity

```text
C = similarity × s + complementarity × (1-s)
```

`s` dépend de la surface.

## 8. Confidence

Le score de compatibilité et la confiance doivent être séparés.

```text
score = model(features)
confidence = g(data_volume, recency, consistency)
```

## 9. Calibration

Un score 0.8 ne doit être présenté comme 80% que si la calibration le justifie.

Tester :

- Platt scaling ;
- isotonic regression ;
- reliability diagrams ;
- Brier score.

## 10. Ranking

### Pointwise

```text
score(user,item)
```

### Pairwise

```text
L = -log σ(s_pos-s_neg)
```

### Listwise

Optimiser directement la qualité du classement, par exemple via une perte inspirée de NDCG.

## 11. NDCG

```text
DCG@K = Σ (2^rel_i - 1)/log2(i+1)
```

```text
NDCG@K = DCG@K / IDCG@K
```

## 12. MMR

```text
MMR(x)=λ Rel(x)-(1-λ)max Sim(x,S)
```

Sert à équilibrer pertinence et diversité.

## 13. Topic propagation

Si un utilisateur interagit avec un topic enfant :

```text
activation(parent) = activation(child) × γ^depth
```

`0 < γ < 1`.

## 14. Multi-timescale interest

```text
U_topic = αU_short + βU_medium + γU_long
```

avec `α+β+γ=1`.

## 15. Exploration

Epsilon-greedy :

```text
choose best with probability 1-ε
choose exploratory candidate with probability ε
```

UCB :

```text
UCB_i = μ_i + c sqrt(ln t / n_i)
```

Thompson Sampling peut modéliser l'incertitude via une distribution sur le reward.

## 16. Graph propagation

Un graphe peut propager l'information entre utilisateurs, contenus, cultures et communautés.

GraphSAGE : agrégation du voisinage pour apprendre des représentations inductives.

LightGCN : propagation simplifiée des embeddings sur les interactions.

## 17. Two-Tower retrieval

```text
user_encoder(user_context) → u
item_encoder(item_features) → v
score = u·v
```

Le produit scalaire permet une récupération rapide par index vectoriel.

## 18. Multi-objective ranking

```text
J =
 α relevance
+ β satisfaction
+ γ diversity
+ δ novelty
+ ε fairness
- ζ safety_risk
```

Les poids peuvent dépendre de la surface.

## 19. Exposure correction

Un contenu haut dans le Feed reçoit plus d'exposition. Les logs doivent tenir compte de la position :

```text
observed_click = exposure × attractiveness
```

L'apprentissage doit éviter de confondre exposition et préférence.

## 20. Causal thinking

Question importante :

> L'utilisateur aime-t-il réellement ce contenu, ou l'a-t-il aimé parce que l'algorithme l'a beaucoup exposé ?

Approches futures :

- inverse propensity weighting ;
- randomized exploration ;
- counterfactual evaluation.

## 21. Graph centrality

PageRank / centrality peuvent aider à identifier des structures du graphe, mais ne doivent pas devenir le score principal de recommandation.

## 22. Community detection

Tester :

- Louvain ;
- Leiden ;
- spectral clustering.

Usage : découverte de communautés et représentation du graphe, pas décision automatique sur la personnalité.

## 23. Optimal Transport

Pour des événements de matching collectif, on peut résoudre :

```text
min_T Σ C_ij T_ij
```

sous contraintes marginales.

Sinkhorn permet une approximation entropique efficace.

## 24. Stable matching

Gale–Shapley peut servir à des sessions de matching collectif lorsque chaque participant fournit des préférences ordonnées.

Ce n'est pas nécessaire pour chaque requête du Feed.

## 25. Important

Aucune formule ne garantit une relation humaine réussie. Les modèles doivent rester des outils de recommandation, avec consentement, contrôle utilisateur, transparence et possibilité de corriger les inférences.

## Références

- YouTube recommendation architecture: https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/
- Instagram ranking architecture: https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/
- GraphSAGE: https://arxiv.org/abs/1706.02216
- LightGCN: https://arxiv.org/abs/2002.02126
- DeepFM: https://www.ijcai.org/Proceedings/2017/239
- Diversity survey: https://doi.org/10.1016/j.knosys.2017.02.009
