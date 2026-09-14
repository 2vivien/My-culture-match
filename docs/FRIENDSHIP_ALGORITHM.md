# Friendship Recommendation Engine

## Mission

Friendship doit recommander des personnes avec lesquelles une relation amicale **a du sens**, pas simplement les utilisateurs les plus proches ou les plus populaires.

## Contraintes dures

Avant le scoring :

- soi-même exclu ;
- bloqués exclus ;
- comptes bannis/suspendus exclus ;
- consentement de découverte respecté ;
- visibilité profil respectée ;
- âge et règles produit respectés ;
- utilisateurs déjà connectés traités séparément ;
- utilisateurs ayant refusé/muté la relation respectés ;
- distance seulement si autorisée.

## Sources de candidats

```text
friends-of-friends
shared communities
shared interests
shared languages
shared culture
nearby
same events
similar activity
semantic profile retrieval
collaborative graph
exploration
```

## Score de compatibilité amicale

```text
F(A,B) =
  0.20 * interest_similarity
+ 0.15 * culture_similarity
+ 0.15 * language_fit
+ 0.12 * community_overlap
+ 0.10 * friend_graph_affinity
+ 0.10 * geographic_fit
+ 0.08 * activity_compatibility
+ 0.05 * communication_fit
+ 0.05 * profile_completeness
```

Ces poids sont une **baseline initiale**, pas une vérité permanente. Ils devront être appris/calibrés à partir du feedback.

## Mutualité

Une recommandation amicale doit être bilatérale lorsque possible :

```text
A→B = fit des préférences de A
B→A = fit des préférences de B
```

Score :

```text
mutual = sqrt(A→B × B→A)
```

Pour Friendship, la mutualité peut être moins stricte que Love car une personne peut accepter une relation amicale découverte spontanément.

## Friends-of-Friends

Le graphe fournit un signal puissant :

```text
A ─ friend ─ X ─ friend ─ B
```

Mais le nombre d'amis communs ne doit jamais être utilisé seul.

Exemple :

```text
fof_score = 1 - exp(-k * common_friends)
```

Le score sature pour éviter qu'un utilisateur très connecté domine automatiquement les recommandations.

## Similarité d'intérêts

Pour des ensembles pondérés :

```text
weighted_jaccard(A,B)
 = Σ min(a_i,b_i) / Σ max(a_i,b_i)
```

Pour les embeddings :

```text
cos(A,B) = A·B / (||A|| ||B||)
```

Les deux peuvent être combinés :

```text
interest = 0.4 * weighted_jaccard + 0.6 * cosine
```

## Complémentarité

Friendship ne doit pas être uniquement « nous sommes identiques ».

On peut rechercher :

```text
similarity + complementarity
```

Exemple : deux personnes partagent la photographie mais l'une maîtrise le montage vidéo et l'autre la photographie de rue.

La complémentarité doit rester secondaire et être validée par le feedback.

## Culture

Le moteur peut modéliser :

```text
roots
languages
countries
regions
traditions
music
food
history
migration/diaspora
cultural topics
```

Il ne doit jamais déduire une personnalité uniquement à partir d'une nationalité.

## Distance

Distance géographique : Haversine.

```text
a = sin²(Δφ/2) + cos φ1 cos φ2 sin²(Δλ/2)
D = 2R asin(√a)
```

Transformer ensuite la distance en affinité douce :

```text
distance_score = exp(-d / τ)
```

`τ` dépend de la préférence déclarée de l'utilisateur.

## Map / People Nearby

La carte est une **surface de découverte**, pas un second moteur complètement indépendant.

Pipeline :

```text
location candidates
→ privacy/ghost/block filters
→ distance bucket
→ friendship affinity
→ activity/context
→ diversity
→ map presentation
```

Pour préserver la vie privée :

- coordonnées floutées lorsque nécessaire ;
- pas de précision excessive ;
- expiration des positions ;
- pas d'historique public des déplacements ;
- visibilité configurable ;
- block immédiat.

## Activité

L'activité doit être un signal contextuel, pas une récompense permanente.

Exemples :

```text
recently active
attending same event
active in same community
currently exploring same topic
```

Éviter : « plus tu es actif, plus tu apparais » sans limite, car cela favorise le spam.

## Popularité

La popularité doit être plafonnée.

```text
popularity = log(1 + interactions)
```

et éventuellement normalisée par cohorte pour éviter qu'un gros compte écrase les nouveaux utilisateurs.

## Diversity

Top 20 Friendship : ne pas retourner 20 profils presque identiques.

Contraintes possibles :

```text
max_same_city
max_same_community
max_same_creator_cluster
max_same_topic
```

Puis MMR pour diversifier le reste.

## Sérendipité

Introduire une petite part de profils inattendus mais plausibles :

```text
serendipity = relevance × novelty × plausibility
```

Le système ne doit pas montrer quelque chose d'aléatoire simplement pour être « différent ».

## Explanations

Exemples valides :

- « 3 intérêts communs » ;
- « vous partagez une communauté » ;
- « vous parlez une même langue » ;
- « vous avez plusieurs amis en commun » ;
- « vous participez au même événement ».

Les explications doivent être générées à partir des features du ranking.

## Feedback

Événements :

```text
impression
profile_open
connect
accept
reject
pass
message
reply
conversation_qualified
mute
block
report
```

Les actions fortes ont davantage de valeur que les impressions.

## Learning-to-Rank

Créer des paires :

```text
(user, candidate_positive, candidate_negative)
```

Loss possible :

```text
L = -log σ(score_positive - score_negative)
```

Une approche BPR/pairwise peut servir de baseline.

## Cold Start

Nouveau membre :

```text
profile + onboarding + culture + language + nearby + communities
```

Puis apprendre progressivement des interactions.

## Ce qu'il ne faut pas optimiser

Ne pas maximiser uniquement :

```text
CTR
number_of_connections
session_length
```

Le vrai objectif est :

```text
meaningful friendship
```

Mesures possibles :

- acceptation ;
- premier message ;
- réponse ;
- conversation durable ;
- rencontre/événement lorsque l'utilisateur la déclare ;
- satisfaction ;
- absence de report/block ;
- rétention.

## Relation avec Love

Friendship et Love partagent :

- feature store ;
- graph ;
- embeddings ;
- safety ;
- consent ;
- culture engine.

Mais ils ont des objectifs différents.

```text
Friendship = social/cultural compatibility
Love       = reciprocal romantic compatibility
```

Un utilisateur ne doit jamais être automatiquement converti en prospect Love parce qu'il est un bon ami potentiel.

## Références

- Reciprocal recommendation literature : https://doi.org/10.1016/j.inffus.2020.12.001
- GraphSAGE : https://arxiv.org/abs/1706.02216
- LightGCN : https://arxiv.org/abs/2002.02126
- SocialLGN : https://doi.org/10.1016/j.ins.2022.01.001
- Diversity survey : https://doi.org/10.1016/j.knosys.2017.02.009
