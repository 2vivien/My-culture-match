# 08 — Sécurité, consentement, équité et confidentialité

## 1. Le ranking ne remplace jamais la policy

Pipeline obligatoire :

```text
candidate retrieval
  ↓
age / ban / block
  ↓
consent
  ↓
Love enabled
  ↓
visibility
  ↓
hard preferences
  ↓
ranking
```

Un excellent score ne doit jamais permettre à un candidat interdit de remonter.

## 2. Trust score séparé

Créer un score interne de qualité du compte, sans l'afficher comme « valeur humaine ».

Signaux possibles :

- ancienneté du compte ;
- profil complété ;
- email/phone verification ;
- cohérence d'activité ;
- signalements confirmés ;
- spam ;
- comportements automatisés ;
- sanctions.

Le trust score peut servir à réduire l'exposition d'un compte suspect, mais ne doit pas devenir une discrimination opaque.

## 3. Hard safety gates

Exemples :

```text
if blocked(A,B): reject
if banned(B): reject
if age(B) < 18: reject
if !loveEnabled(B): reject
if !loveProposalAllowed(B): reject
if consentPolicyDenies(A,B): reject
```

## 4. Fairness

Les systèmes de recommandation peuvent créer des biais d'exposition et de popularité. Les travaux de synthèse sur l'équité recommandent de considérer à la fois pertinence, exposition, groupes et contexte. [1][2]

Pour Love, mesurer au minimum :

- distribution des impressions ;
- taux d'ouverture par groupe ;
- taux de like ;
- taux de match ;
- taux de conversation ;
- taux de signalement ;
- couverture des profils.

## 5. Popularity bias

Sans correction :

```text
popular → more impressions → more likes → more popular
```

Introduire une régularisation de popularité :

```text
S_pop_corrected = S_relevance - λ log(1 + impressions)
```

Le terme ne doit pas punir artificiellement les profils appréciés ; il doit seulement empêcher qu'une popularité historique domine complètement la pertinence.

## 6. Calibration

Un score 90 doit avoir une signification stable dans le temps.

Mesurer :

- reliability curve ;
- Brier score pour les probabilités ;
- Expected Calibration Error ;
- calibration par segment lorsque cela est nécessaire.

## 7. Privacy

Les données de matching sont potentiellement intimes.

Principes :

- data minimization ;
- purpose limitation ;
- retention limitée ;
- suppression ;
- chiffrement en transit et au repos ;
- logs sans contenu sensible ;
- accès administratif audité ;
- pas de données privées dans les explications publiques.

## 8. Conversations

Le système ne doit pas donner à un utilisateur :

> « Nous savons que cette personne a dit X à quelqu'un. »

Il doit plutôt produire une explication générale :

> « Vous avez plusieurs intérêts communs autour du voyage et des langues. »

## 9. Explicabilité

Chaque carte doit pouvoir être expliquée par les signaux autorisés :

```text
+ valeurs compatibles
+ objectif relationnel proche
+ intérêts communs
+ langues compatibles
+ distance compatible
```

Pas :

```text
« L'IA pense que vous êtes faits l'un pour l'autre. »
```

## 10. Fairness-aware reranking

Une fonction de ranking peut combiner pertinence et diversité :

```text
Score_final = relevance - λ redundancy + μ novelty
```

Les paramètres doivent être contrôlés et mesurés.

## 11. Human moderation

Le modèle ne doit pas prendre seul les décisions de sanctions lourdes.

Architecture :

```text
AI signal
   ↓
risk score
   ↓
automatic low-risk action
   ↓
moderator review for serious action
```

## Sources

1. *Fairness in Recommender Systems: Evaluation Approaches and Assurance Strategies*, ACM TKDD. https://doi.org/10.1145/3604558
2. Deldjoo et al., *Fairness in recommender systems: research landscape and future directions*. https://link.springer.com/article/10.1007/s11257-023-09364-z
3. Jin et al., *A survey on fairness-aware recommender systems*. https://doi.org/10.1016/j.inffus.2023.101906
