# Feed Ranking Engine

## Mission

Le Feed doit apprendre **ce que la personne souhaite voir maintenant**, sans enfermer l'utilisateur dans une bulle.

Le système doit répondre à quatre questions :

1. ce contenu est-il pertinent ?
2. pourquoi maintenant ?
3. quelle est la qualité attendue de l'interaction ?
4. comment garder diversité, nouveauté et découverte ?

## Architecture

```text
Author/content corpus
       ↓
Candidate generation
       ↓
Eligibility / safety
       ↓
First-stage ranker
       ↓
Heavy ranker
       ↓
Diversity / freshness / fatigue
       ↓
Final reranker
       ↓
Feed
       ↓
Events
       ↓
Feature updates
```

Cette architecture suit les principes publiquement décrits par les grands systèmes industriels : Instagram décrit retrieval, first-stage ranking, second-stage ranking et final reranking ; YouTube décrit candidate generation puis ranking. [1][2]

## Candidate generators

Produire des candidats depuis plusieurs sources :

```text
followed authors
friends
communities
culture topics
recent interests
semantic similarity
collaborative filtering
trending locally
trending culturally
nearby
exploration
```

Exemple :

```text
C = union(C_follow, C_friend, C_interest, C_culture,
          C_community, C_semantic, C_trending, C_explore)
```

## User interest state

Chaque sujet possède un poids dynamique :

```text
interest(topic,t) = Σ event_i × strength_i × exp(-λ Δt_i)
```

Les événements ont des forces différentes.

### Forts

- follow ;
- save ;
- partage ;
- commentaire substantiel ;
- lecture longue répétée ;
- recherche explicite.

### Moyens

- like ;
- ouverture du contenu ;
- clic sur hashtag ;
- visite de profil.

### Faibles

- impression ;
- apparition dans le viewport ;
- clic accidentel.

## Exemple demandé

Si quelqu'un lit plusieurs contenus sur la cuisine béninoise :

```text
lecture 1 → cuisine: +0.15
lecture longue → cuisine: +0.35
save → cuisine: +0.60
follow auteur → cuisine: +0.70
```

Le thème devient temporairement plus important.

Mais :

```text
30 jours sans interaction
→ décroissance
```

Ainsi, l'algorithme apprend sans figer définitivement le profil.

## Topic graph

Les sujets doivent être organisés en graphe :

```text
Cuisine
 ├── Afrique
 │    ├── Bénin
 │    ├── Togo
 │    └── Nigeria
 ├── recettes
 └── restaurants
```

Une interaction sur `cuisine béninoise` peut donc légèrement renforcer :

```text
Bénin
Afrique de l'Ouest
cuisine
recettes
culture béninoise
```

mais avec une propagation décroissante.

```text
activation(parent) = child_activation × decay_depth
```

Cela permet une personnalisation sémantique sans faire croire qu'un seul clic signifie que toute la catégorie est préférée.

## Content representation

Chaque contenu possède :

```text
semantic_embedding
culture_embedding
language_embedding
topic_vector
quality_score
creator_embedding
freshness
safety_score
community_context
```

## Ranking score

Baseline :

```text
R =
  w1 * topic_relevance
+ w2 * semantic_similarity
+ w3 * social_affinity
+ w4 * culture_relevance
+ w5 * quality
+ w6 * freshness
+ w7 * creator_affinity
+ w8 * conversation_value
+ w9 * novelty
+ w10 * exploration
- w11 * repetition
- w12 * fatigue
- w13 * negative_feedback
```

Les poids doivent être appris progressivement.

## Quality

Le score qualité ne doit pas être uniquement l'engagement brut.

Il peut intégrer :

```text
meaningful_comments
saves
shares
long_reads
hide_rate
report_rate
creator_reputation
content_age
```

Normaliser les signaux pour éviter que les gros comptes dominent uniquement par volume.

## Freshness

```text
freshness = exp(-λ age)
```

Mais un contenu evergreen de grande qualité peut recevoir un poids de longévité.

## Creator affinity

Le système apprend si l'utilisateur apprécie régulièrement un auteur.

```text
creator_affinity = f(
  follows,
  profile_visits,
  meaningful_reads,
  likes,
  saves,
  hides
)
```

## Session context

Le ranking doit changer dans la session.

Exemple :

```text
session:
  1 culture
  2 cuisine
  3 cuisine
```

Le système peut proposer davantage de cuisine, mais doit progressivement réintroduire :

```text
culture + people + language + discovery
```

pour éviter la monotonie.

## Diversity / MMR

```text
MMR(x) = λ relevance(x) - (1-λ) max similarity(x, selected)
```

Cette étape empêche :

```text
10 posts sur exactement le même angle
```

même si les 10 ont un score élevé.

## Serendipity

Une petite fraction du Feed doit proposer :

```text
relevant but unexpected
```

Exemple : un utilisateur intéressé par la culture béninoise peut découvrir un contenu sur une post togolaise voisine, sans quitter complètement son univers.

## Exploration

Le système peut réserver un petit budget aux candidats incertains :

```text
exploration_probability = ε
```

Puis apprendre du résultat.

Avec suffisamment de données, utiliser contextual bandits :

```text
context = user + session + content + time
reward = meaningful_interaction
```

## Fatigue

Éviter de montrer trop souvent :

- même auteur ;
- même sujet ;
- même communauté ;
- même format ;
- même contenu.

```text
fatigue = Σ repeated_exposure × decay
```

## Negative feedback

Actions fortes :

```text
not_interested
hide
mute
unfollow
report
block
```

doivent réduire la probabilité de contenus similaires.

## Reward design

Éviter d'optimiser uniquement le watch time ou CTR.

Reward composite :

```text
reward =
  a * meaningful_read
+ b * save
+ c * useful_comment
+ d * share
+ e * return_quality
- f * hide
- g * report
- h * block
```

Le reward doit être validé par expérimentation.

## Long-term personalization

Construire trois mémoires :

```text
short_term_profile
medium_term_profile
long_term_profile
```

Puis :

```text
user_state =
  α short
+ β medium
+ γ long
```

Les poids dépendent du contexte.

## Feed culturel

Le moteur Culture doit être un signal important mais pas exclusif.

```text
culture relevance
+ user interest
+ language
+ social graph
+ novelty
```

Ainsi le Feed devient une porte vers les cultures, pas un catalogue enfermé dans l'origine de l'utilisateur.

## Explainability

Le Feed peut afficher des raisons légères :

- « parce que tu suis… » ;
- « parce que tu as récemment consulté… » ;
- « populaire dans ta communauté » ;
- « nouveau dans un sujet que tu apprécies ».

## Evaluation

Offline :

- Recall@K ;
- Precision@K ;
- NDCG@K ;
- MRR ;
- calibration ;
- diversity ;
- novelty ;
- coverage.

Online :

- meaningful interaction rate ;
- session satisfaction ;
- retention ;
- hide/report rate ;
- creator coverage ;
- latency.

## Références

[1] Meta Engineering, Instagram Explore recommendations, 2023. https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/

[2] Covington et al., YouTube Recommendations, RecSys 2016. https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/

[3] Kunaver & Požrl, Diversity in recommender systems, 2017. https://doi.org/10.1016/j.knosys.2017.02.009

[4] Zhao et al., Fairness and Diversity in Recommender Systems, ACM TIST 2025. https://doi.org/10.1145/3664928
