# Love — Conversational Matchmaking

## Vision

Love n'est plus un catalogue de profils à swiper. L'utilisateur décrit naturellement la personne qu'il souhaite rencontrer et My Culture Match lui propose une sélection courte de **4 profils maximum**.

> **Nous ne cherchons pas beaucoup de personnes. Nous cherchons les bonnes.**

## Expérience utilisateur

1. L'utilisateur ouvre **Love**.
2. Il voit une interface conversationnelle et écrit par exemple :
   > « Une femme entre 24 et 30 ans, ouverte d'esprit, aime voyager et cherche une relation sérieuse. »
3. Le système interprète la demande.
4. Les règles de consentement, blocage, âge et éligibilité sont appliquées côté serveur.
5. Le moteur classe les profils éligibles.
6. L'interface affiche au maximum **4 cartes actives**.
7. Chaque carte affiche :
   - score de compatibilité (ex. `97%` maximum dans cette première version) ;
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

### Moteur de matching

Le modèle conversationnel ne choisit jamais directement les personnes. La séparation de responsabilité est volontaire :

`texte utilisateur → critères structurés → filtres déterministes → consentement/sécurité → scoring → Top 4`

Le moteur applique d'abord les contraintes dures :

- propre utilisateur exclu ;
- âge minimum 18 ans ;
- Love activé ;
- consentement Love autorisant l'interaction ;
- blocages exclus ;
- profils complétés ;
- profils déjà traités/matchés exclus lorsque pertinent.

Puis il classe les candidats sur plusieurs dimensions :

- valeurs ;
- objectif relationnel ;
- langues ;
- culture / pays ;
- intérêts ;
- score de compatibilité culturelle existant.

Chaque résultat contient aussi des raisons lisibles afin que le score soit explicable.

## Score

Le score est un indicateur de compatibilité et **pas une promesse de réussite sentimentale**.

Le score global est plafonné à 97% dans la première UX afin d'éviter de présenter artificiellement un match comme une certitude absolue.

Exemple :

- `97%` compatibilité globale ;
- `92%` culture ;
- `88%` valeurs ;
- `80%` intérêts.

Les sous-scores doivent rester explicables et cohérents avec les données réellement disponibles.

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

## Sécurité et confidentialité

La recherche doit continuer à respecter les contrôles Trust & Safety déjà mis en place. Une personne qui ne permet pas une interaction Love ne doit jamais apparaître dans les résultats.

Le moteur ne doit pas exposer de données privées qui ne sont pas visibles selon les réglages de consentement du candidat.

Les requêtes Love contiennent potentiellement des préférences relationnelles personnelles. Une prochaine étape devra donc ajouter une politique de rétention/suppression de l'historique de recherche et, lors de l'ajout d'un LLM externe, minimiser les données envoyées au fournisseur.

## Prochaine évolution IA

La version actuelle possède un interpréteur déterministe pour les requêtes courantes. La prochaine couche peut utiliser un LLM uniquement pour transformer le texte libre en JSON strict :

```json
{
  "ageMin": 24,
  "ageMax": 30,
  "genders": ["female"],
  "relationshipGoal": "serious",
  "keywords": ["voyage", "ouverture"]
}
```

Le LLM ne doit pas décider du Top 4. Le backend reste responsable du filtrage, du consentement, du ranking et de la sécurité.

## KPI produit

- recherches Love / semaine ;
- taux de recherches donnant au moins un résultat ;
- taux de clic profil ;
- taux de like par profil proposé ;
- taux de match réciproque ;
- taux d'ouverture de conversation ;
- taux de retour après une recherche ;
- quota atteint ;
- signalements issus des interactions Love.

## État de l'implémentation

La première tranche est maintenant en place dans le repository :

- backend : parsing, quota Redis, filtrage, ranking et Top 4 ;
- API : recherche conversationnelle + quota ;
- frontend : nouvelle expérience chat-like ;
- cartes de profils avec score, raisons et actions ;
- cartes des matchs Love actifs ;
- séparation Love / Friendship conservée ;
- consentement Love réutilisé côté serveur.

Les validations CI restent nécessaires avant de considérer cette tranche comme prête pour production.
