# Recommendation Safety, Privacy & Fairness

## Principle

Un moteur très puissant peut aussi devenir très mauvais s'il optimise uniquement l'engagement.

Les systèmes de recommandation peuvent influencer fortement ce que les personnes voient et donc leurs comportements ; la littérature récente recommande d'intégrer fairness, diversity, novelty et trustworthiness au-delà de l'accuracy. [1][2]

## Hard filters before ML

Aucun modèle ne peut contourner :

- block ;
- report restrictions ;
- consentement ;
- age rules ;
- visibility ;
- ghost mode ;
- banned/suspended state ;
- privacy ;
- communication permissions.

## Privacy firewall

Le moteur doit séparer :

```text
features usable for ranking
```

et :

```text
private data
```

Une donnée privée ne devient pas automatiquement une feature parce qu'elle existe dans la base.

## Conversation privacy

Les messages peuvent aider à comprendre des préférences seulement selon les règles de consentement et de traitement du produit.

Le système doit privilégier des représentations minimisées :

```text
raw message
   ↓
allowed extraction
   ↓
topic/preference signal
   ↓
raw text can expire separately
```

## Fairness

Surveiller :

- exposition par groupe ;
- taux de recommandation ;
- acceptance ;
- qualité ;
- visibilité des nouveaux utilisateurs ;
- popularité ;
- langue/culture ;
- géographie.

Ne jamais utiliser une catégorie protégée comme raccourci pour déduire une personnalité ou une valeur humaine.

## Popularity bias

Un utilisateur populaire reçoit naturellement plus de feedback, donc le modèle peut amplifier sa popularité.

Contre-mesures :

```text
exploration
exposure normalization
new-user boost
diversity
cohort normalization
```

## Filter bubble

Le moteur doit conserver une petite capacité de découverte.

```text
personalization
+ adjacent topics
+ novel topics
+ cultural serendipity
```

## Feedback loops

```text
popular
→ more exposure
→ more interactions
→ more training signal
→ more popularity
```

Ce cycle doit être mesuré et cassé lorsque nécessaire.

## Safety-aware reward

Un engagement obtenu par conflit, harcèlement ou contenu choquant ne doit pas être un reward positif.

```text
reward = utility
          - abuse
          - reports
          - blocks
          - harmful engagement
```

## User controls

Prévoir progressivement :

- not interested ;
- mute topic ;
- mute creator ;
- reset recommendations ;
- manage interests ;
- hide recommendation reason ;
- location controls ;
- personalization controls.

## Explainability

Une recommandation importante doit pouvoir être expliquée avec une raison vraie et compréhensible.

## Model governance

Chaque modèle doit avoir :

```text
version
training_data_window
features
objective
known_limits
fairness_report
rollback
```

## Evaluation gates

Avant déploiement :

```text
accuracy
+ calibration
+ diversity
+ fairness
+ safety
+ latency
```

Un modèle avec +5% CTR mais +30% reports doit être rejeté.

## Références

[1] Zhao et al., *Fairness and Diversity in Recommender Systems: A Survey*, ACM TIST, 2025. https://doi.org/10.1145/3664928

[2] Duricic et al., *Beyond-accuracy: diversity, serendipity and fairness in GNN recommender systems*, 2023. https://doi.org/10.3389/fdata.2023.1251072

[3] Consumer-side fairness survey, 2024. https://doi.org/10.1007/s10462-023-10663-5
