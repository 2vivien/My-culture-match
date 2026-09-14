# Recommendation Events & Feature Store

## Mission

Un moteur avancé est impossible sans une bonne mémoire des événements. Cette spécification définit ce que My Culture Match doit observer, avec quel poids, pendant combien de temps et avec quelles contraintes de confidentialité.

## Event schema

```json
{
  "eventId": "uuid",
  "userId": "uuid",
  "surface": "feed|explore|friendship|map|community|love|message",
  "entityType": "post|user|community|culture|event|topic",
  "entityId": "uuid",
  "eventType": "impression|open|read|like|save|share|comment|follow|connect|pass|hide|mute|report|block",
  "value": 1,
  "durationMs": 0,
  "position": 0,
  "sessionId": "uuid",
  "createdAt": "timestamp"
}
```

## Signal strength

Une impression n'a pas la même valeur qu'un save ou qu'un block.

Exemple initial :

```text
impression       0.01
open             0.05
short_read       0.10
long_read        0.30
like             0.35
comment          0.50
save             0.65
share            0.75
follow           0.85
explicit_search  0.90
hide            -0.70
mute             -0.80
report           -1.00
block            -1.00
```

Ces valeurs sont des priors de départ et doivent être calibrées.

## Time decay

```text
weight(t) = initial_weight × exp(-λ Δt)
```

Chaque feature peut avoir son propre `λ`.

Exemples :

```text
session_topic → heures/jours
current_interest → semaines
culture_identity → mois
explicit_preference → très lent
```

## Feature record

```text
feature_name
entity_id
value
source
confidence
first_seen
last_seen
half_life
privacy_class
```

## Explicit vs inferred

Chaque feature doit connaître son origine :

```text
explicit
inferred_behavior
inferred_semantic
social_graph
system_context
```

Une préférence explicitement déclarée doit généralement avoir plus de confiance qu'une inférence issue d'un clic.

## Confidence

```text
confidence = f(
  source_reliability,
  repetition,
  recency,
  consistency
)
```

Exemple :

```text
1 lecture → faible confiance
5 lectures longues → moyenne
explicit preference + repeated behavior → forte
```

## Contradictions

Une personne peut aimer la cuisine italienne aujourd'hui et le sport demain. Le moteur doit supporter plusieurs intérêts simultanés.

Pour une contradiction :

```text
explicit preference > inferred preference
recent repeated signal > old weak signal
```

## Topic memory

Le système maintient :

```text
TopicProfile
CultureProfile
LanguageProfile
CreatorProfile
CommunityProfile
```

## User embedding refresh

Pas besoin de recalculer tout le profil à chaque événement.

```text
real-time:
  Redis short-term state

near-real-time:
  worker feature aggregation

batch:
  embedding refresh
```

## Privacy classes

```text
PUBLIC
SOCIAL
PRIVATE
SENSITIVE
```

Les données privées ne doivent pas devenir des signaux visibles pour d'autres utilisateurs.

## Conversation events

Les messages ne doivent pas être traités comme des données de ranking ordinaires.

Seules les informations autorisées et nécessaires peuvent alimenter :

```text
topic_interest
language_preference
communication_preference
conversation_context
```

Le contenu brut des conversations doit avoir des règles de rétention et d'accès distinctes.

## Feature leakage

Attention à ne pas entraîner un modèle avec une information qui ne serait pas disponible au moment où la recommandation est faite.

Exemple interdit : utiliser `accepted_connection` pour prédire une recommandation qui a eu lieu avant l'acceptation.

## Training dataset

Créer des snapshots temporels :

```text
features_at_t
candidate_set_at_t
recommendation_at_t
outcome_after_t
```

Cela permet des évaluations réalistes.

## Feedback loop

```text
recommendation
→ impression
→ action
→ outcome
→ feature update
→ training example
→ new model
→ evaluation
→ deployment
```

## Anti-bias

Ne pas entraîner uniquement sur les interactions positives, sinon le modèle peut apprendre :

```text
popular → more exposure → more interactions → even more popular
```

Ajouter :

- negative feedback ;
- exploration ;
- exposure correction ;
- diversity ;
- fairness metrics.

## Tables recommandées

```text
recommendation_events
recommendation_features
recommendation_user_state
recommendation_candidate_logs
recommendation_experiments
recommendation_model_versions
recommendation_feedback
```

## Model versioning

Chaque ranking event doit pouvoir être relié à :

```text
model_version
feature_version
policy_version
experiment_id
```

Cela rend possible l'audit d'une recommandation.

## Observability

Mesurer :

- candidate recall ;
- ranker latency ;
- reranker latency ;
- feature freshness ;
- cache hit rate ;
- recommendation error rate ;
- event ingestion delay.

## Référence industrielle

Les architectures de recommandation à grande échelle utilisent précisément des étapes de retrieval/ranking et des systèmes de pré-calcul/caching pour rendre possible une personnalisation très large. Instagram documente cette approche pour Explore. [1]

[1] Meta Engineering, Instagram Explore: https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/
