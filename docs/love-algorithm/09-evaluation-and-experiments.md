# 09 — Evaluation, expérimentation et qualité

## Objectif

Un moteur de matching ne doit pas être déclaré « meilleur » parce qu'il donne des scores élevés. Il faut démontrer qu'il améliore les connexions réelles et sûres.

## 1. Offline metrics

### Recall@4

Parmi les candidats pertinents historiques, combien apparaissent dans les 4 propositions ?

```text
Recall@4 = relevant_in_top4 / relevant_total
```

### Precision@4

```text
Precision@4 = relevant_in_top4 / 4
```

### NDCG@4

Mesure la qualité du classement, en donnant plus de poids aux premiers résultats.

### MRR

Useful pour mesurer la position du premier candidat réellement pertinent.

## 2. Reciprocal metrics

Le vrai KPI Love est bilatéral.

```text
MutualLikeRate = mutual_likes / shown_profiles
```

Puis :

```text
ConversationRate = conversations / mutual_matches
```

Et :

```text
MeaningfulConversationRate = conversations_24h / mutual_matches
```

## 3. Safety metrics

```text
ReportRate
BlockRate
UnmatchRate
HarassmentRate
SpamRate
```

Une augmentation du match rate accompagnée d'une augmentation forte des reports n'est pas une amélioration.

## 4. Long-term quality

Mesurer à 7, 30 et 90 jours :

- conversation encore active ;
- satisfaction ;
- absence de report ;
- relation maintenue si les utilisateurs le déclarent volontairement ;
- retour positif au moteur.

## 5. Diversity

Le Top 4 doit être diversifié sans sacrifier la pertinence.

Mesurer :

```text
intra-list diversity
coverage
novelty
catalog exposure
```

## 6. Calibration

Si le système affiche un score interprétable, tester la calibration.

Exemple : parmi les paires affichées à 80–90, la fréquence réelle d'un événement défini doit être proche de la fréquence prédite si le score est présenté comme une probabilité. Pour Love, il est préférable de ne pas appeler le score une probabilité de succès sentimental.

## 7. A/B testing

Tester une modification à la fois :

```text
A = ranker actuel
B = nouveau ranker
```

Primary metric :

```text
meaningful_conversation_rate
```

Guardrails :

```text
report_rate
block_rate
latency
coverage
```

## 8. Interleaving

Pour comparer deux rankers sans doubler toute l'exposition, utiliser éventuellement du team-draft interleaving pour les expériences de ranking.

## 9. Counterfactual evaluation

Les logs d'un ancien ranker ne permettent pas toujours d'évaluer correctement un nouveau ranker car les candidats non affichés n'ont pas de feedback.

Conserver :

- candidates considered ;
- ranking score ;
- selected result ;
- policy probability lorsque pertinent ;
- outcome.

Cela permet ensuite des évaluations hors politique plus robustes.

## 10. Human evaluation

Faire relire anonymement des recommandations par des évaluateurs selon une grille :

```text
relevance
reciprocity
explainability
cultural_fit
safety
surprise_positive
```

La note humaine ne doit pas devenir le seul label.

## 11. Ablation tests

Retirer une famille de features à la fois :

```text
all
-all_distance
-all_values
-all_conversation
-all_graph
-all_behavior
```

Cela permet de savoir ce qui apporte réellement de la valeur.

## 12. Exemple de tableau d'expérience

| Version | Match | Conversation 24h | Reports | Diversity |
|---|---:|---:|---:|---:|
| Baseline | — | — | — | — |
| + values | — | — | — | — |
| + reciprocal | — | — | — | — |
| + conversation | — | — | — | — |
| + graph | — | — | — | — |
| + bandit | — | — | — | — |

Les valeurs réelles doivent venir des données de production, jamais être inventées dans la documentation.

## 13. Golden dataset

Créer un petit jeu de cas anonymisés et validés :

- profils très compatibles ;
- incompatibilités dures ;
- distance élevée mais préférence internationale ;
- langues différentes ;
- valeurs opposées ;
- profils nouveaux ;
- profils sans historique ;
- blocage ;
- consentement refusé.

Le moteur doit produire des résultats déterministes sur ce dataset lorsque les features et la seed sont fixées.

## 14. Performance

Objectif initial :

```text
p50 < 150 ms
p95 < 500 ms
```

pour la partie ranking hors appels LLM externes.

Le LLM de parsing ne doit pas bloquer le ranking s'il est indisponible : fallback déterministe obligatoire.

## 15. Benchmark open source

RecBole fournit un environnement unifié avec de nombreux algorithmes et datasets pour la recherche en recommandation, notamment des variantes GNN, fairness et recommandation séquentielle. Il peut servir de référence pour comparer certaines briques, mais les données Love réelles restent spécifiques à My Culture Match. https://github.com/RUCAIBox/RecBole
