# My Culture Match — Recommendation Intelligence Master Plan

## Objectif

Construire un moteur de recommandation unifié pour **Friendship, People Nearby, Feed, Explore, Communities, Culture et Messages**, avec Love comme moteur réciproque spécialisé.

L'objectif n'est pas de copier une formule propriétaire d'Instagram ou TikTok. Nous reproduisons les **principes d'architecture publiquement documentés** : retrieval, ranking multi-étapes, signaux comportementaux, embeddings, graphes, diversité, exploration et feedback continu. Instagram décrit notamment un pipeline retrieval → first-stage ranking → second-stage ranking → final reranking, et YouTube décrit la séparation candidate generation / ranking. [1][2]

## Principe

```text
USER STATE
  ├── profil explicite
  ├── culture / langues / intérêts
  ├── graphe social
  ├── historique comportemental
  ├── contenu consommé
  ├── conversations autorisées
  ├── contexte actuel
  └── préférences de confidentialité
          ↓
   USER EMBEDDING + TOPIC STATE
          ↓
   CANDIDATE GENERATION
          ↓
   SAFETY / CONSENT / ELIGIBILITY
          ↓
   MULTI-STAGE RANKING
          ↓
   DIVERSITY / NOVELTY / FAIRNESS
          ↓
   CONTEXTUAL RERANKING
          ↓
   SURFACE-SPECIFIC FEED
          ↓
   FEEDBACK EVENTS
          ↓
   TRAINING / CALIBRATION / EXPERIMENTS
```

## Surfaces

### 1. Friendship

Recommande des personnes avec une forte probabilité de connexion amicale et culturelle.

### 2. People Nearby / Map

Recommande des personnes et lieux pertinents dans la zone visible, sans transformer la localisation en outil de surveillance.

### 3. Feed

Classe les publications susceptibles d'être utiles, intéressantes ou culturellement pertinentes.

### 4. Explore

Permet la découverte au-delà des intérêts déjà connus.

### 5. Communities

Recommande groupes, discussions, événements et membres.

### 6. Culture

Recommande des sujets, cultures, langues, traditions, musique, cuisine, histoire et créateurs.

### 7. Messages

Recommande uniquement des actions utiles : personnes à contacter selon permissions, conversations à reprendre, traductions/contextes et suggestions de réponse. Le système ne doit jamais pousser artificiellement au spam.

### 8. Love

Utilise le même Feature Store et le même graphe, mais possède un **reciprocal ranker** distinct.

## Règle essentielle : ne pas tout mélanger

Le même utilisateur peut avoir plusieurs états :

```text
friendship_interest
culture_interest
content_interest
language_interest
love_interest
community_interest
```

Un utilisateur qui lit dix articles sur le Japon ne doit pas automatiquement être considéré comme cherchant une relation avec une personne japonaise. Les intentions sont séparées.

## Architecture ML multi-étapes

### Stage A — Retrieval

Produire quelques centaines ou milliers de candidats à partir de plusieurs sources :

```text
social graph
friends-of-friends
shared interests
same communities
nearby
semantic vector search
trending within culture
recent interactions
followed creators
content similarity
collaborative filtering
```

### Stage B — Lightweight ranker

Réduire le pool avec un modèle peu coûteux :

```text
score_early = f(profile, candidate, context, recency, affinity)
```

### Stage C — Heavy ranker

Sur les meilleurs candidats seulement :

```text
score_late = neural_ranker(features + embeddings + graph signals)
```

### Stage D — Reranker

Appliquer :

- diversité ;
- nouveauté ;
- fatigue ;
- répétition ;
- fairness ;
- sécurité ;
- contraintes de surface ;
- exploration.

Instagram documente publiquement une architecture de ce type à plusieurs niveaux et utilise notamment des Two-Tower networks pour la récupération de candidats à grande échelle. [1]

## État dynamique de l'utilisateur

Le système conserve plusieurs représentations, pas un seul vecteur.

```text
UserProfileVector
CultureVector
InterestVector
LanguageVector
SocialVector
ContentVector
ConversationVector
ContextVector
```

Puis :

```text
U = concat(
  profile,
  culture,
  interests,
  language,
  social,
  content,
  conversation,
  context
)
```

Le vecteur final est recalibré régulièrement et non après chaque clic de manière aveugle.

## Pourquoi l'utilisateur voit plus d'un sujet après l'avoir lu

On utilise une mémoire d'intérêt à plusieurs horizons.

```text
interest(topic,t)
 = α * short_term
 + β * medium_term
 + γ * long_term
```

avec :

```text
short_term  → heures / jours
medium_term → semaines
long_term   → mois
```

Chaque signal possède une décroissance temporelle :

```text
w(t) = exp(-λ Δt)
```

Ainsi, lire un contenu sur la cuisine japonaise augmente temporairement le poids du thème Japon/cuisine, mais ce poids diminue si l'intérêt n'est jamais confirmé.

## Attention : lecture ≠ préférence absolue

Les signaux doivent avoir des forces différentes.

```text
save          > long_read        > like
comment       > click            > impression
share         > short_view
explicit_follow > accidental_view
```

Un clic accidentel ne doit pas réécrire immédiatement le profil.

## Feedback négatif

Le moteur apprend également de :

- hide / not interested ;
- unfollow ;
- mute ;
- pass ;
- skip ;
- report ;
- réduction du temps de lecture ;
- blocage.

Un signal négatif fort doit réduire rapidement la probabilité de répétition.

## Sources de candidats

```text
C1 = social graph
C2 = semantic similarity
C3 = collaborative filtering
C4 = cultural graph
C5 = nearby
C6 = community
C7 = trending
C8 = exploration
```

Le pool final est :

```text
C = unique(C1 ∪ C2 ∪ C3 ∪ C4 ∪ C5 ∪ C6 ∪ C7 ∪ C8)
```

Cette architecture évite qu'une seule source domine toute la découverte.

## Score générique

```text
S =
  w1 * relevance
+ w2 * affinity
+ w3 * freshness
+ w4 * quality
+ w5 * social_proximity
+ w6 * cultural_fit
+ w7 * language_fit
+ w8 * context_fit
+ w9 * novelty
+ w10 * exploration
- w11 * repetition
- w12 * fatigue
- w13 * negative_feedback
```

Les poids sont appris ou calibrés par surface et non copiés définitivement.

## Diversity

Un top 20 contenant 20 contenus identiques est mauvais même si chacun possède un score élevé.

On utilise une logique MMR :

```text
MMR(x) = λ Rel(x) - (1-λ) max Sim(x,S)
```

où `S` est l'ensemble déjà sélectionné.

La diversification est un sujet majeur de recherche dans les systèmes de recommandation, avec des objectifs allant au-delà de l'accuracy : diversité, nouveauté, sérendipité et fairness. [3][4]

## Exploration

Une partie contrôlée du système doit tester de nouvelles choses :

```text
exploitation → ce que l'utilisateur aime déjà
exploration  → ce qui pourrait lui plaire
```

Des contextual bandits pourront gérer ce compromis une fois le volume de feedback suffisant.

## Cold Start

### Nouveau utilisateur

Priorités :

1. onboarding ;
2. intérêts déclarés ;
3. culture/langues ;
4. localisation approximative si autorisée ;
5. communautés ;
6. tendances locales ;
7. exploration.

### Nouveau contenu

Utiliser :

- auteur ;
- texte ;
- média ;
- hashtags ;
- culture ;
- langue ;
- embeddings ;
- qualité ;
- contexte.

### Nouveau membre

Friendship peut commencer avec attributs + culture + langue + proximité + intérêts, puis basculer vers le graphe après interactions.

## Graph Engine

Construire un graphe hétérogène :

```text
User ──friend── User
User ──follows── User
User ──likes── Content
User ──joins── Community
User ──speaks── Language
User ──interested_in── Topic
User ──from── Culture
Content ──about── Topic
Community ──about── Culture
```

GraphSAGE peut fournir des représentations inductives ; LightGCN est une baseline pertinente pour les graphes d'interactions ; les modèles sociaux GNN peuvent combiner graphe social et graphe d'interaction. [5][6][7]

## Feature Store

Chaque feature doit avoir :

```text
name
value
source
confidence
first_seen
last_seen
half_life
privacy_class
```

Exemple :

```text
interest:photography
value:0.83
source:explicit+behavioral
confidence:0.91
last_seen:...
half_life:30d
```

## Explicabilité

Le moteur doit pouvoir répondre :

```text
Pourquoi cette personne ?
Pourquoi ce post ?
Pourquoi cette communauté ?
Pourquoi maintenant ?
```

Les raisons doivent provenir de features réellement utilisées :

- « vous aimez tous les deux la photographie » ;
- « vous partagez une langue » ;
- « plusieurs personnes de votre réseau participent à cette communauté » ;
- « tu as récemment consulté plusieurs contenus sur ce sujet ».

Ne jamais inventer une raison.

## Messages

Le ranking des messages n'est pas un feed.

Priorités :

```text
direct_message
unread
recent
relationship_strength
urgency
safety
```

La priorité doit être la communication utile, pas l'engagement artificiel.

## Architecture de données

```text
Postgres
 ├── users
 ├── connections
 ├── communities
 ├── posts
 ├── interactions
 ├── interests
 ├── languages
 └── recommendation_events

Redis
 ├── short-term user state
 ├── counters
 ├── caches
 └── candidate pools

Meilisearch
 ├── lexical search
 └── discovery

pgvector
 ├── profile embeddings
 ├── content embeddings
 └── culture embeddings

BullMQ
 ├── embedding jobs
 ├── feature updates
 ├── ranking jobs
 └── training exports
```

## Principe de mesure

Le succès n'est pas seulement CTR.

Mesurer :

- meaningful interaction rate ;
- long-term retention ;
- conversation quality ;
- connection acceptance ;
- hide/report/block ;
- diversity ;
- novelty ;
- fairness ;
- latency ;
- satisfaction ;
- repeat usage.

## Références

[1] Meta Engineering, *Scaling the Instagram Explore recommendations system*, 2023. https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/

[2] Covington, Adams & Sargin, *Deep Neural Networks for YouTube Recommendations*, RecSys 2016. https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/

[3] Kunaver & Požrl, *Diversity in recommender systems — A survey*, 2017. https://doi.org/10.1016/j.knosys.2017.02.009

[4] Duricic, Kowald, Lacic & Lex, *Beyond-accuracy: a review on diversity, serendipity, and fairness in recommender systems based on graph neural networks*, 2023. https://doi.org/10.3389/fdata.2023.1251072

[5] Hamilton, Ying & Leskovec, *GraphSAGE*, 2017. https://arxiv.org/abs/1706.02216

[6] He et al., *LightGCN*, 2020. https://arxiv.org/abs/2002.02126

[7] *SocialLGN: Light graph convolution network for social recommendation*, Information Sciences, 2022. https://doi.org/10.1016/j.ins.2022.01.001

[8] Zhao et al., *Fairness and Diversity in Recommender Systems: A Survey*, ACM TIST, 2025. https://doi.org/10.1145/3664928
