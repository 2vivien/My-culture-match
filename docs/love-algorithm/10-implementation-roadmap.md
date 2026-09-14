# 10 — Roadmap d'implémentation

## Phase 0 — Sécurité et contrats

Avant tout ML :

- consentement ;
- block ;
- age gate ;
- Love enabled ;
- visibilité ;
- rate limit ;
- audit logs ;
- minimisation des données.

## Phase 1 — MVP intelligent

Déjà proche de l'état actuel du projet :

```text
natural language query
→ structured criteria
→ hard filters
→ deterministic ranking
→ top 4
→ explanations
```

À améliorer immédiatement :

1. brancher `Pass` au backend de façon persistante ;
2. ajouter le profil détaillé depuis une carte ;
3. transformer Love en vrai transcript conversationnel ;
4. retourner les critères compris par l'IA ;
5. rendre le score explicable ;
6. enregistrer les impressions et résultats pour l'apprentissage.

## Phase 2 — Feature Store

Créer des tables/structures pour :

```text
love_features
love_feature_events
love_search_events
love_ranking_events
love_feedback_events
```

Chaque événement doit contenir :

```text
userId
candidateId
feature
value
source
confidence
createdAt
```

## Phase 3 — Structured preferences

Ajouter dans le profil Love :

```text
relationshipGoal
communicationStyle
values
interests
distancePreference
languagePreferences
lifestylePreferences
```

Cette étape est importante pour que « relation sérieuse » devienne un vrai signal bilatéral et non une constante approximative.

## Phase 4 — Embeddings

Ajouter un service séparé :

```text
ProfileEmbeddingService
ConversationEmbeddingService
```

Stockage possible :

- pgvector dans PostgreSQL/Neon ;
- ou une base vectorielle dédiée si le volume le justifie.

Ne pas introduire une nouvelle base juste pour quelques milliers d'utilisateurs.

## Phase 5 — Candidate retrieval

Trois voies parallèles :

```text
SQL / hard filters
semantic vector retrieval
graph retrieval
```

Fusion :

```text
candidate_pool = union(sql, semantic, graph)
```

Puis déduplication et sécurité.

## Phase 6 — Ranker

Commencer par un modèle interprétable :

```text
weighted logistic model / gradient boosted trees
```

Puis tester :

- pairwise learning-to-rank ;
- DeepFM ;
- neural ranker ;
- LightGCN ;
- GraphSAGE.

DeepFM est une architecture connue pour apprendre des interactions de features de différents ordres dans des systèmes de recommandation. https://www.ijcai.org/Proceedings/2017/239

## Phase 7 — Reciprocal ranker

Deux scores :

```text
A→B
B→A
```

Puis :

```text
reciprocity = sqrt((A→B)(B→A))
```

Le ranking final doit donner une place importante à cette réciprocité.

## Phase 8 — Conversation intelligence

Le système analyse uniquement les données autorisées :

```text
messages
→ topics
→ preferences
→ embeddings
→ confidence
```

Les préférences doivent être révisables et avoir une durée de vie.

## Phase 9 — Bandit

Lorsque suffisamment de feedback existe :

```text
ranker
+ exploration policy
```

Commencer avec une petite part d'exploration, par exemple 5–10% du ranking admissible, puis apprendre.

## Phase 10 — GNN

Lorsque le graphe possède suffisamment de données :

```text
user-interest-value-language graph
```

Tester GraphSAGE et LightGCN comme baselines.

## Phase 11 — Matching global

Réserver Gale–Shapley / optimal transport aux contextes de matching collectif :

- événements ;
- sessions ;
- speed dating ;
- communautés.

Le feed Love reste un système de ranking dynamique.

## Phase 12 — Astro optionnel

Après validation du moteur principal seulement :

```text
scientific_match_score
+
optional_astrology_affinity
```

L'astrologie reste séparée et opt-in.

## Architecture cible

```text
                    ┌───────────────────┐
                    │  Love Conversation │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ Intent / NLP / AI │
                    └─────────┬─────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   Profile Store         Feature Store          Graph Store
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
                    Candidate Generation
                              ↓
                     Safety / Consent
                              ↓
                    Reciprocal Ranker
                              ↓
                Diversity / Fairness / Novelty
                              ↓
                       Calibration
                              ↓
                           Top 4
                              ↓
                     User Interaction
                              ↓
                       Feedback Events
                              ↓
                      Learning Pipeline
```

## Stack compatible avec le projet

Le backend actuel Hono + PostgreSQL/Neon + Drizzle + Redis peut rester la base.

Ajouter progressivement :

- pgvector ;
- worker BullMQ ;
- Python/PyTorch uniquement quand le ML devient nécessaire ;
- object storage pour datasets/model artifacts ;
- monitoring expérimental.

Le backend TypeScript ne doit pas être remplacé trop tôt par une stack ML lourde.

## Critère de passage en production

Ne pas déclarer le moteur « intelligent » parce qu'un LLM fonctionne.

Production lorsque :

- consentement testé ;
- sécurité testée ;
- ranking déterministe stable ;
- metrics instrumentées ;
- score calibré ;
- feedback stocké ;
- tests offline ;
- A/B framework ;
- rollback ;
- monitoring ;
- explications cohérentes.

## Résultat recherché

Le produit doit progressivement passer de :

```text
« voici 4 profils qui ressemblent à ta recherche »
```

à :

```text
« voici les 4 personnes qui ont la meilleure combinaison
entre compatibilité avec toi, compatibilité avec elles,
valeurs, objectifs, communication, culture, distance,
contexte et signaux de réciprocité — avec un niveau de
confiance explicite. »
```

C'est cette réciprocité qui distingue le moteur Love d'un simple recommender de contenu.
