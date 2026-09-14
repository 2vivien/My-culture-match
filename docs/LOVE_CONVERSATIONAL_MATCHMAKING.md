# Love — Conversational Matchmaking

## Vision

Love n'est plus un catalogue de profils à swiper. L'utilisateur décrit naturellement la personne qu'il souhaite rencontrer et My Culture Match lui propose une sélection courte de **4 profils maximum**.

> **Nous ne cherchons pas beaucoup de personnes. Nous cherchons les bonnes.**

Cette première spécification est maintenant complétée par un dossier d'architecture algorithmique :

- `docs/love-algorithm/00-README.md` — architecture globale ;
- `01-onboarding-and-features.md` — 6 questions et feature store ;
- `02-mathematical-scoring.md` — formules de compatibilité ;
- `03-conversation-intelligence.md` — compréhension des conversations ;
- `04-reciprocal-graph.md` — graphe, embeddings et matching réciproque ;
- `05-learning-and-bandits.md` — apprentissage continu et exploration ;
- `06-distance-culture-and-values.md` — distance, culture, langues et valeurs ;
- `07-astrology-optional.md` — couche astrologique optionnelle, séparée du score scientifique ;
- `08-safety-fairness-and-privacy.md` — sécurité, équité et confidentialité ;
- `09-evaluation-and-experiments.md` — métriques et expérimentation ;
- `10-implementation-roadmap.md` — feuille de route production.

## Expérience utilisateur

1. L'utilisateur ouvre **Love**.
2. Il voit une interface conversationnelle et écrit par exemple :
   > « Une femme entre 24 et 30 ans, ouverte d'esprit, aime voyager et cherche une relation sérieuse. »
3. Le système interprète la demande.
4. Les règles de consentement, blocage, âge et éligibilité sont appliquées côté serveur.
5. Le moteur classe les profils éligibles.
6. L'interface affiche au maximum **4 cartes actives**.
7. Chaque carte affiche :
   - score de compatibilité ;
   - âge, pays et statut en ligne ;
   - raisons principales du rapprochement ;
   - sous-scores valeurs / culture / intérêts ;
   - J'aime, Passer et Message.
8. Les matchs réciproques restent séparés de Friendship et ouvrent leur conversation Love.

## Recherche hebdomadaire

- Quota serveur : **3 recherches sur une fenêtre glissante de 7 jours**.
- Le quota est contrôlé par Redis et ne dépend pas du frontend.
- Une recherche renvoie au maximum 4 profils.
- Le frontend affiche le nombre de recherches restantes.

Le quota est volontaire : Love privilégie la qualité des rencontres plutôt que la consommation infinie de profils.

## Architecture

### API

- `POST /api/love/search`
  - body : `{ "query": "..." }`
  - retourne la requête interprétée, les critères, jusqu'à 4 résultats et le quota restant.
- `GET /api/love/search/quota`
  - retourne `limit`, `used`, `remaining`.
- `POST /api/love/swipe`
  - reste utilisé pour l'action finale `like` / `pass` sur un profil proposé.
- `GET /api/love/active`
  - retourne les connexions Love réciproques.

### Moteur

La responsabilité est séparée :

```text
texte utilisateur
  → critères structurés
  → filtres déterministes
  → consentement / sécurité
  → génération de candidats
  → compatibilité bilatérale
  → ranking
  → diversité
  → Top 4
```

Le modèle conversationnel ne choisit jamais directement les personnes. Il extrait l'intention, les critères et les signaux sémantiques. Le backend reste responsable du filtrage, du ranking et de la sécurité.

## Compatibilité réciproque

Le moteur cible un vrai **Reciprocal Recommender System** : la qualité de A→B et de B→A doit être prise en compte. Une recommandation excellente pour A mais très mauvaise pour B ne doit pas être présentée comme un excellent match.

Le score réciproque peut utiliser une moyenne géométrique :

```text
R(A,B) = sqrt(P_A(B) × P_B(A))
```

Cette approche pénalise les relations très asymétriques.

## Sources de signal

Le moteur peut progressivement combiner :

- préférences explicites ;
- valeurs ;
- objectifs relationnels ;
- intérêts ;
- langues ;
- culture ;
- distance ;
- communication ;
- conversations autorisées ;
- interactions Love ;
- graphe relationnel ;
- embeddings ;
- exploration contrôlée.

Les données issues des conversations doivent être traitées avec minimisation, confiance et durée de vie. Une préférence explicitement déclarée doit avoir plus de poids qu'une inférence incertaine.

## Score

Le score global est multi-dimensionnel et évolutif. Une première base peut combiner :

```text
reciprocity
values
goal
communication
interests
culture
distance
novelty
confidence
```

Le dossier `02-mathematical-scoring.md` contient les formules, poids de départ et méthodes de calibration.

Le score affiché est un indicateur de compatibilité et **pas une promesse de réussite sentimentale**.

## Astrologie

Une couche astrologique peut exister comme fonctionnalité culturelle/ludique opt-in, mais elle est séparée du moteur scientifique : elle ne doit jamais devenir un filtre de sécurité ou une vérité prédictive. Voir `07-astrology-optional.md`.

## Interface

La nouvelle page Love contient :

- hero conversationnel ;
- champ libre naturel ;
- raccourcis de recherche ;
- indicateur de quota ;
- rappel de sécurité/consentement ;
- section des **matchs Love actifs** ;
- grille Top 4 responsive ;
- cartes avec photo, score, raisons et actions ;
- ouverture directe de la messagerie ;
- état sans résultat ;
- état quota épuisé ;
- gestion des erreurs.

## Confidentialité

Les requêtes Love et les conversations peuvent contenir des préférences intimes. L'utilisation conversationnelle doit être contrôlable, minimisée et documentée. Si un fournisseur LLM externe est utilisé, seuls les éléments nécessaires doivent être transmis.

## KPI

Les KPI prioritaires sont :

- mutual match rate ;
- meaningful conversation rate ;
- réponse après premier message ;
- satisfaction ;
- report/block rate ;
- diversity ;
- coverage ;
- calibration ;
- latence ;
- qualité du Top 4.

Le moteur ne doit pas être optimisé uniquement pour les clics ou le temps passé.

## État actuel

La première tranche du moteur conversationnel est déjà présente dans le repository :

- parsing naturel ;
- parser IA optionnel avec fallback déterministe ;
- quota Redis ;
- filtrage sécurité/consentement ;
- ranking ;
- Top 4 ;
- score et raisons ;
- actions Love ;
- matchs Love actifs ;
- séparation Love / Friendship.

La nouvelle documentation définit maintenant l'architecture cible permettant de passer d'un moteur déterministe initial à un système réciproque, conversationnel, graph-based et apprenant.

## Important

Les validations CI, les benchmarks et les expériences A/B sont nécessaires avant de considérer les futurs modèles ML comme meilleurs que le baseline. Aucun chiffre de performance ne doit être inventé avant mesure réelle.
