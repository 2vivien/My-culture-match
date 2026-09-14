# 05 — Apprentissage continu, ranking et exploration

## Objectif

Le moteur doit devenir meilleur avec les retours réels sans transformer les utilisateurs en cobayes ni enfermer le système dans ses premières hypothèses.

## Labels utiles

Un simple `like` n'est pas suffisant.

Créer des événements :

```text
impression
profile_open
photo_expand
like
pass
message_start
reply
conversation_10_messages
conversation_24h
conversation_7d
mutual_match
unmatch
report
block
```

Les labels les plus forts sont généralement les événements de qualité, pas uniquement le clic.

## Reward hiérarchique

Exemple de reward initial :

```text
pass                  -0.10
profile_open          +0.05
like                  +0.20
mutual_match          +0.60
reply                 +0.35
conversation_24h      +0.80
conversation_7d       +1.00
report                -1.50
block                 -2.00
```

Ces nombres sont des priors de lancement. Ils doivent être calibrés et surtout ne pas être utilisés pour optimiser artificiellement l'engagement.

## Pairwise Learning-to-Rank

Pour un utilisateur `u`, si `i` est préféré à `j` :

```text
L = -log σ(s(u,i) - s(u,j))
```

C'est l'idée générale derrière le Bayesian Personalized Ranking (BPR).

Le système apprend donc :

```text
aime(i) > pass(j)
```

plutôt que seulement :

```text
i = 1
```

## Hard negatives

Un candidat peut être particulièrement utile comme exemple négatif lorsqu'il était très bien classé mais a été rejeté.

```text
hard_negative = high_rank + explicit_pass
```

Mais il faut éviter de traiter un seul pass comme une préférence permanente : un pass peut être contextuel.

## Contextual bandit

Après avoir un ranker fiable, introduire progressivement l'exploration.

Deux politiques classiques :

- Thompson Sampling ;
- Upper Confidence Bound (UCB).

La littérature récente continue d'étudier les contextual bandits pour équilibrer exploitation et exploration dans les systèmes de recommandation. [1][2]

## UCB simplifié

```text
UCB_i = μ_i + c sqrt(log t / n_i)
```

- `μ_i` = reward moyen estimé ;
- `t` = nombre total d'observations ;
- `n_i` = observations du candidat/segment ;
- `c` = exploration.

## Thompson Sampling

Pour une récompense binaire, on peut commencer avec :

```text
θ_i ~ Beta(α_i, β_i)
```

Puis choisir selon un échantillon `θ_i`.

## Important pour Love

L'exploration ne doit jamais contourner :

- blocage ;
- consentement ;
- âge ;
- règles de sécurité ;
- préférences dures ;
- paramètres de visibilité.

L'exploration ne s'effectue **qu'à l'intérieur de l'espace des candidats admissibles**.

## Cold start

Pour un nouvel utilisateur :

```text
profile + 6 questions
        ↓
content similarity
        ↓
semantic similarity
        ↓
small controlled exploration
```

Pour un utilisateur avec beaucoup d'historique :

```text
profile + behavior + graph + conversation
```

## Drift

Les goûts changent.

Pour un feature comportemental :

```text
feature_t = ρ feature_old + (1-ρ) feature_new
```

avec `ρ` adapté au type de signal.

## Online vs offline

### Offline

Tester :

- Recall@4 ;
- Precision@4 ;
- NDCG@4 ;
- reciprocal match rate ;
- calibration ;
- diversity ;
- coverage.

### Online

Tester :

- mutual match ;
- first reply ;
- conversation quality ;
- report/block rate ;
- satisfaction ;
- long-term retention ;
- proportion de personnes correctement exposées.

## Éviter le feedback loop

Si le moteur ne montre que des profils populaires, ils reçoivent plus de likes et deviennent encore plus populaires.

Solution :

```text
relevance
+ exploration
+ exposure balancing
+ diversity
```

## Ne pas optimiser uniquement le match

Un match peut être rapide mais mauvais.

Le KPI de haut niveau devrait être une combinaison :

```text
Quality =
  match
+ meaningful_conversation
+ reciprocity
+ safety
+ satisfaction
```

## Références

1. Ban et al., *Neural Exploitation and Exploration of Contextual Bandits*, JMLR, 2026. https://www.jmlr.org/beta/papers/v27/23-0582.html
2. Pires et al., *Exploitation Over Exploration: Unmasking the Bias in Linear Bandit Recommender Offline Evaluation*, RecSys 2025. https://doi.org/10.1145/3705328.3748166
3. Liu et al., *Transferable Contextual Bandit for Cross-Domain Recommendation*, AAAI. https://ojs.aaai.org/index.php/AAAI/article/view/11699
4. RecBole — framework de recherche et benchmark recommandation. https://github.com/RUCAIBox/RecBole
