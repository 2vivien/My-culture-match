# 04 — Graphe relationnel et recommandation réciproque

## Pourquoi un graphe

My Culture Match possède déjà des relations : amis, amis d'amis, likes, conversations, intérêts, groupes et interactions. Le moteur Love doit pouvoir représenter ces relations sous forme de graphe.

```text
G = (V, E)
```

- `V` = utilisateurs ;
- `E` = relations pondérées.

## Types d'arêtes

```text
friend
friend_of_friend
love_like
love_pass
message
shared_interest
shared_culture
conversation
report
block
```

Les arêtes négatives comme `block` et certaines sanctions ne servent pas à augmenter la compatibilité ; elles sont des contraintes d'exclusion.

## Poids temporels

```text
w_edge(t) = w_0 exp(-λ Δt)
```

Une interaction récente doit normalement refléter davantage l'état actuel.

## GraphSAGE

GraphSAGE apprend une fonction qui agrège le voisinage d'un nœud et ses attributs. C'est intéressant pour My Culture Match car de nouveaux utilisateurs arrivent en permanence et doivent obtenir une représentation sans attendre un historique énorme. [1]

Architecture conceptuelle :

```text
profile features
      ↓
neighbor sampling
      ↓
aggregation
      ↓
user embedding
```

Référence : https://arxiv.org/abs/1706.02216

## LightGCN

LightGCN est conçu pour la recommandation collaborative et conserve essentiellement la propagation de voisinage sur le graphe d'interactions. Il peut servir de baseline avancée pour apprendre des embeddings à partir des interactions Love. [2]

Référence : https://arxiv.org/abs/2002.02126

Une implémentation PyTorch de référence existe ici :

https://github.com/gusye1234/LightGCN-PyTorch

Attention : ce dépôt est archivé ; il doit servir de référence pédagogique, pas de dépendance aveugle de production.

## Embedding hybride

Le vecteur final d'une personne peut combiner :

```text
E_user =
  α E_profile
+ β E_behavior
+ γ E_graph
+ δ E_conversation
```

Après normalisation :

```text
||E_user||₂ = 1
```

## Score bilatéral avec graphe

```text
P_A(B) = f(E_A, E_B, pref_A, context)
P_B(A) = f(E_B, E_A, pref_B, context)
```

Puis :

```text
R(A,B) = sqrt(P_A(B) × P_B(A))
```

## Pourquoi ne pas simplement utiliser « amis d'amis »

Les amis communs sont un signal social mais pas une preuve de compatibilité amoureuse.

Ils peuvent toutefois servir de signal secondaire :

```text
social_affinity = min(1, log(1 + mutual_connections) / log(1 + K))
```

Le système doit éviter les recommandations trop proches dans un même cercle afin de préserver la diversité.

## Graphe de compatibilité culturelle

Construire un graphe secondaire :

```text
User → Culture
User → Language
User → Interest
User → Value
```

On obtient un graphe hétérogène :

```text
User --likes--> Interest
User --speaks--> Language
User --values--> Value
User --relates_to--> Culture
```

Ce graphe peut ensuite alimenter un modèle de représentation hétérogène.

## Matching global

Pour une sélection globale de partenaires, on peut construire une matrice :

```text
M[i,j] = compatibility(user_i, user_j)
```

Pour des campagnes ou événements où l'on veut former des paires, des méthodes d'affectation peuvent être utiles.

### Gale–Shapley

Le problème classique du mariage stable possède un algorithme de deferred acceptance en `O(n²)`. [3]

Mais il ne faut pas l'utiliser tel quel pour le feed Love : il suppose des listes de préférence et cherche une stabilité globale, alors que Love est un système dynamique avec consentement, exploration, sécurité et contexte.

Il est pertinent pour :

- événements de matching ;
- speed-dating contrôlé ;
- programmes de mise en relation avec quotas ;
- expériences scientifiques de matching global.

## Optimal Transport

Pour des campagnes de matching collectif, on peut aussi construire une matrice de coût :

```text
C_ij = 1 - compatibility(i,j)
```

Puis résoudre une version régularisée :

```text
min_P <P,C> + ε KL(P || K)
```

avec contraintes de marginales.

La solution peut être calculée efficacement avec des itérations de type Sinkhorn.

Ce n'est pas nécessaire pour le Top 4 quotidien, mais cela devient intéressant pour des événements de matching à grande échelle.

## Recommandation

Architecture cible :

```text
Rule-based candidate retrieval
        ↓
Graph / embedding retrieval
        ↓
Reciprocal ranker
        ↓
Safety / consent
        ↓
MMR diversity
        ↓
Top 4
```

## Sources

1. Hamilton, Ying & Leskovec — GraphSAGE. https://arxiv.org/abs/1706.02216
2. He et al. — LightGCN. https://arxiv.org/abs/2002.02126
3. Gale/Shapley stable matching literature. https://doi.org/10.1016/0166-218X(92)00179-P
4. RecBole — benchmark framework with general, sequential, context-aware, knowledge-based, GNN and fairness-related research packages. https://github.com/RUCAIBox/RecBole
5. PyTorch Geometric — production-oriented GNN library and implementations. https://github.com/pyg-team/pytorch_geometric
