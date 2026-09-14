# Recommendation Evaluation & Experimentation

## Goal

Nous ne dirons jamais qu'un algorithme est « meilleur » parce qu'il semble intelligent. Il faut le mesurer.

## Offline metrics

### Retrieval

```text
Recall@K
Candidate Recall
Coverage
```

### Ranking

```text
Precision@K
NDCG@K
MRR
MAP
```

### Beyond accuracy

```text
Diversity@K
Novelty@K
Serendipity
Catalog/User coverage
Calibration
Fairness
```

## Social metrics

Friendship :

```text
connection_accept_rate
first_message_rate
reply_rate
meaningful_conversation_rate
```

Love :

```text
mutual_like_rate
conversation_start_rate
conversation_quality
long_term_match_rate
```

## Feed

```text
meaningful_interaction_rate
save_rate
share_rate
hide_rate
report_rate
session_satisfaction
D1/D7/D30 retention
```

## Map

```text
profile_open_rate
connection_rate
privacy_action_rate
map_discovery_rate
```

## Candidate quality

Mesurer séparément :

```text
retrieval recall
ranker precision
reranker diversity
```

Sinon une mauvaise récupération peut être masquée par un excellent ranker.

## A/B testing

Chaque expérience possède :

```text
experiment_id
control
variant
population
start
end
model_version
policy_version
```

## Guardrail metrics

Un variant ne peut pas gagner si :

```text
reports ↑ fortement
blocks ↑ fortement
negative feedback ↑ fortement
latency ↑ fortement
privacy violations > 0
```

## Interleaving

Pour comparer deux rankers sur les mêmes candidats, l'interleaving peut fournir une comparaison plus efficace qu'un A/B complet dans certains scénarios.

## Counterfactual evaluation

Le système doit apprendre que les positions influencent les clics.

Techniques possibles :

- randomized exploration ;
- inverse propensity weighting ;
- counterfactual estimators.

## Model registry

```text
model_version
features_version
training_dataset
metrics
fairness
latency
rollback_target
```

## Golden dataset

Créer un dataset de cas réels anonymisés :

```text
user
candidate
expected relevance
reason
safety label
```

Il sert de test de non-régression.

## Human evaluation

Pour les premières versions :

- évaluer les recommandations ;
- vérifier les explications ;
- détecter les recommandations absurdes ;
- vérifier les risques de biais ;
- vérifier les violations de consentement.

## Model progression

```text
rules
→ weighted model
→ gradient boosting
→ learning-to-rank
→ neural ranker
→ graph models
→ contextual bandits
→ multi-objective optimization
```

On ne passe au niveau suivant que lorsque le niveau précédent est instrumenté.

## Références

- Instagram multi-stage ranking: https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/
- YouTube candidate generation/ranking: https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/
- Diversity/fairness survey: https://doi.org/10.1145/3664928
