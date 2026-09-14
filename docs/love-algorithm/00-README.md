# Love Match Engine — Architecture & Research

## Mission

Construire un moteur de mise en relation **réciproque, explicable, adaptatif et orienté qualité** pour My Culture Match.

Love ne doit pas être un catalogue de profils. Le moteur doit estimer :

1. l'adéquation entre les préférences de A et le profil de B ;
2. l'adéquation entre les préférences de B et le profil de A ;
3. la compatibilité intrinsèque entre A et B ;
4. la probabilité qu'une interaction soit saine et réciproque ;
5. la qualité et la confiance des signaux disponibles ;
6. la diversité des résultats proposés.

La littérature appelle ce problème un **Reciprocal Recommender System** : contrairement à un recommender classique, les deux côtés sont des utilisateurs et les deux doivent potentiellement accepter la recommandation. Cette propriété est centrale pour Love. [1][2]

## Principe fondateur

> **L'IA comprend la personne. Le moteur décide mathématiquement du rapprochement.**

Le LLM ne doit jamais avoir le dernier mot sur la personne à proposer. Il extrait des intentions, résume des conversations et produit des représentations sémantiques. Le moteur déterministe/ML applique ensuite consentement, sécurité, contraintes dures, ranking, réciprocité et diversité.

## Pipeline cible

```text
Onboarding 5–6 questions
        ↓
Profil structuré + préférences explicites
        ↓
Conversations Love → signaux sémantiques + comportementaux
        ↓
Feature Store / vecteurs / graphe social
        ↓
Candidate Generation
        ↓
Hard Safety & Consent Filters
        ↓
Reciprocal Compatibility
        ↓
Multi-objective Ranking
        ↓
Fairness + Diversity + Novelty
        ↓
Calibration du score
        ↓
Top 4
        ↓
Explications
        ↓
Like / Pass / Message / Match
        ↓
Feedback loop
        ↓
Apprentissage continu
```

## Architecture recommandée

### Phase 1 — Cold start

- règles + score pondéré ;
- cosine similarity sur vecteurs de préférences ;
- compatibilité de valeurs ;
- distance ;
- langue/culture ;
- objectifs relationnels ;
- consentement ;
- sécurité ;
- diversité.

### Phase 2 — Apprentissage

- pairwise learning-to-rank ;
- BPR / ranking loss ;
- embeddings utilisateur ;
- graphe d'interactions ;
- modèles séquentiels ;
- calibration ;
- contextual bandits pour l'exploration.

### Phase 3 — moteur avancé

- GNN / GraphSAGE / LightGCN ;
- représentation multimodale ;
- modèle de réciprocité ;
- modèle de conversation ;
- apprentissage contre-factuel ;
- optimisation multi-objectifs ;
- matching global pour certaines campagnes/événements.

GraphSAGE est intéressant car il peut générer des représentations pour de nouveaux nœuds à partir de leurs attributs et de leur voisinage, ce qui est utile pour le cold start. LightGCN simplifie la propagation sur les graphes d'interactions pour la recommandation. [3][4]

## Les 5 niveaux de données

| Niveau | Exemple | Utilisation |
|---|---|---|
| Explicit | âge, objectif, valeurs | contraintes et score |
| Semantic | bio, réponses libres | embeddings / thèmes |
| Behavioral | likes, passes, messages | apprentissage |
| Relational | amis, intérêts communs | graphe |
| Contextual | distance, disponibilité, activité | ranking dynamique |

## Les 6 questions d'entrée

Le moteur doit commencer avec très peu de friction. Voir `01-onboarding-and-features.md` pour le questionnaire complet.

1. **Que recherches-tu maintenant ?**
2. **Quel type de relation souhaites-tu ?**
3. **Quelles sont tes 3 valeurs non négociables ?**
4. **Quel style de vie / centres d'intérêt te ressemble le plus ?**
5. **Quelle distance est confortable pour toi ?**
6. **Qu'est-ce qui te fait te sentir réellement compris(e) par quelqu'un ?**

Les questions 1–5 alimentent le modèle structuré. La question 6 apporte un signal sémantique riche pour le modèle conversationnel.

## Score affiché

Le produit peut afficher `97%`, mais ce nombre doit être une **compatibilité calibrée**, jamais une probabilité scientifique de réussite amoureuse. Une bonne architecture conserve en interne un score brut et une confiance séparée.

```text
compatibility_raw ∈ R
confidence ∈ [0,1]
calibrated_score ∈ [0,97]
```

Un 97% signifie « très forte compatibilité selon les signaux observés », pas « cette relation réussira à 97% ».

## Sources majeures

1. Palomares et al., *Reciprocal Recommender Systems: Analysis of state-of-art literature*, Information Fusion, 2021. https://doi.org/10.1016/j.inffus.2020.12.001
2. Pizzato et al., *Recommending people to people: the nature of reciprocal recommenders with a case study in online dating*, User Modeling and User-Adapted Interaction, 2013. https://doi.org/10.1007/S11257-012-9125-0
3. Hamilton, Ying & Leskovec, *Inductive Representation Learning on Large Graphs / GraphSAGE*, 2017. https://arxiv.org/abs/1706.02216
4. He et al., *LightGCN: Simplifying and Powering Graph Convolution Network for Recommendation*, 2020. https://arxiv.org/abs/2002.02126
5. *Recommender Systems Handbook*, Springer, section People-to-People Reciprocal Recommenders. https://link.springer.com/book/10.1007/978-1-0716-2197-4

## Documents

- `01-onboarding-and-features.md` — questions, collecte et feature store
- `02-mathematical-scoring.md` — formules et ranking
- `03-conversation-intelligence.md` — compréhension des conversations
- `04-reciprocal-graph.md` — graphe, embeddings et réciprocité
- `05-learning-and-bandits.md` — apprentissage continu
- `06-distance-culture-and-values.md` — distance, culture, valeurs
- `07-astrology-optional.md` — astrologie comme signal expérimental optionnel
- `08-safety-fairness-and-privacy.md` — sécurité, équité, confidentialité
- `09-evaluation-and-experiments.md` — métriques, A/B tests et calibration
- `10-implementation-roadmap.md` — passage du design à la production
