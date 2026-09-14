# Explore, Culture & Community Recommendation

## Objectif

Explore doit être le moteur de découverte de My Culture Match : personnes, cultures, langues, communautés, événements, contenus et sujets.

## Le problème

Un recommender qui ne montre que ce que l'utilisateur connaît déjà crée une bulle. Un recommender totalement aléatoire détruit la pertinence.

Le moteur cherche donc :

```text
relevance + diversity + novelty + serendipity
```

## Candidate sources

```text
personal interests
social graph
culture graph
language graph
community graph
location
trending
editorial/curated
semantic retrieval
exploration
```

## Culture graph

```text
User
 ├── speaks → Language
 ├── interested_in → Topic
 ├── from → Culture
 ├── explores → Culture
 └── member_of → Community

Content
 ├── about → Culture
 ├── about → Topic
 └── in → Language
```

Ce graphe permet de recommander des chemins de découverte.

## Example

```text
Utilisateur
→ cuisine béninoise
→ cuisine ouest-africaine
→ musique béninoise
→ Fon
→ histoire du Bénin
→ culture togolaise
→ diaspora béninoise
```

La propagation doit être contrôlée par distance sémantique et comportement utilisateur.

## Community recommendation

Score :

```text
C =
  interest_fit
+ culture_fit
+ language_fit
+ friend_overlap
+ activity_fit
+ distance_fit
+ community_quality
+ novelty
- already_seen
- negative_feedback
```

## Community quality

Inclure :

- activité saine ;
- ratio signalement ;
- rétention ;
- diversité ;
- qualité des discussions ;
- modération ;
- ancienneté raisonnable ;
- taux de membres actifs.

Ne pas favoriser une communauté uniquement parce qu'elle produit énormément de posts.

## People in Explore

People discovery doit réutiliser Friendship/Love selon la surface.

```text
Explore people
    ↓
intent classification
    ├── friendship → Friendship ranker
    ├── love → Love ranker
    └── culture/social → Friendship/social ranker
```

Ainsi une personne n'est pas implicitement traitée comme prospect romantique.

## Events

Recommandation selon :

```text
location
culture
language
interests
communities
friends attending
historical attendance
calendar/context
```

Une petite composante de nouveauté permet de découvrir des événements nouveaux.

## Serendipity contrôlée

Définition :

```text
serendipity = relevance × unexpectedness × usefulness
```

Un contenu peut être nouveau sans être hors sujet.

## Diversity

Limiter la concentration :

```text
same topic
same culture
same creator
same community
same format
```

Le but est de construire une expérience riche.

## Search vs Recommendation

Search répond :

> « Je sais ce que je cherche. »

Recommendation répond :

> « Montre-moi ce que je pourrais aimer. »

Ne pas mélanger leurs métriques.

## Références

- Instagram Explore architecture: https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/
- PinnerSage, multi-modal user embeddings at Pinterest: https://arxiv.org/abs/2007.03634
- Diversity survey: https://doi.org/10.1016/j.knosys.2017.02.009
- Beyond-accuracy GNN review: https://doi.org/10.3389/fdata.2023.1251072
