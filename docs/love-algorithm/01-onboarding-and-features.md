# 01 — Onboarding, questions et Feature Store

## Objectif

Obtenir assez d'information pour produire une première recommandation sérieuse sans transformer l'inscription en formulaire interminable.

La règle produit est **6 questions maximum**, avec possibilité de modifier chaque réponse ensuite.

## Les 6 questions

### Q1 — Qu'est-ce que tu recherches maintenant ?

Choix multiples :

- relation sérieuse
- relation progressive / apprendre à se connaître
- relation ouverte à définir
- rencontre interculturelle avant tout

Cette réponse définit le contexte de ranking. Elle ne doit pas être utilisée pour déduire une préférence que la personne n'a pas explicitement déclarée.

### Q2 — Quel type de relation souhaites-tu construire ?

Choix principal :

- sérieux / long terme
- relation sans engagement
- je veux prendre mon temps
- je ne sais pas encore

Le moteur distingue **intention** et **identité**. L'objectif relationnel est une préférence, pas un attribut permanent de la personne.

### Q3 — Quelles sont tes 3 valeurs non négociables ?

Choisir 3 à 5 valeurs dans un vocabulaire contrôlé :

- respect
- honnêteté
- fidélité
- liberté
- famille
- ambition
- curiosité
- spiritualité
- humour
- stabilité
- aventure
- empathie
- communication
- indépendance
- créativité

Le système conserve :

```text
values_hard = valeurs explicitement marquées non négociables
values_soft = valeurs importantes mais négociables
```

### Q4 — Quel style de vie te ressemble ?

Choisir 5 à 8 tags :

- voyage
- musique
- sport
- cuisine
- lecture
- art
- entrepreneuriat
- technologie
- nature
- sorties
- jeux
- cinéma
- apprentissage
- famille
- culture
- langues

Cette dimension sert à mesurer les intérêts communs, les complémentarités et les thèmes de conversation.

### Q5 — Quelle distance est confortable pour toi ?

Choix :

- même ville
- 25 km
- 50 km
- 100 km
- même pays
- international

Le GPS exact n'est pas nécessaire pour répondre. Les coordonnées précises ne doivent jamais devenir une donnée affichée publiquement.

### Q6 — Question libre

> **Qu'est-ce qui te fait te sentir réellement compris(e) par quelqu'un ?**

C'est volontairement une question ouverte. Elle peut révéler :

- style de communication ;
- besoin d'écoute ;
- autonomie ;
- affection ;
- humour ;
- profondeur ;
- stabilité ;
- curiosité ;
- rapport à la culture ;
- attentes implicites.

Le texte est transformé en représentation sémantique, mais aucune inférence sensible non déclarée ne doit devenir une contrainte de matching.

## Profil structuré

```ts
type LoveProfile = {
  relationshipGoal: 'serious' | 'casual' | 'slow' | 'open';
  valuesHard: string[];
  valuesSoft: string[];
  interests: string[];
  distancePreference: {
    mode: 'city' | 'radius' | 'country' | 'international';
    km?: number;
  };
  communicationNeeds: string[];
  freeTextEmbedding?: number[];
};
```

## Feature Store

Chaque feature doit porter sa **source**, son **âge** et sa **confiance**.

```text
feature = {
  value,
  source: explicit | conversation | behavior | graph | model,
  confidence,
  observedAt,
  expiresAt
}
```

Exemple :

```text
travel_interest
value = 0.86
source = explicit
confidence = 0.99
```

Une préférence issue d'une conversation vieille de 18 mois ne doit pas peser comme une préférence déclarée hier.

## Temporal decay

Pour un signal comportemental observé à l'instant `t_i`, utiliser :

```text
w_time = exp(-λ Δt)
```

avec :

- `Δt` = âge du signal ;
- `λ` = vitesse d'oubli.

Pour une préférence stable explicitement déclarée, `λ` doit être beaucoup plus faible que pour un clic ou un like.

## Confidence des signaux

Proposition :

```text
C_explicit      = 1.00
C_repeated      = 0.90
C_conversation  = 0.75–0.90
C_behavioral    = 0.55–0.85
C_inferred      = 0.20–0.60
C_astro         = 0.05–0.10
```

Ces valeurs sont des **priors de départ**, pas des vérités scientifiques. Elles doivent être recalibrées sur les données réelles.

## Questions adaptatives après les premières recherches

Les 6 questions initiales restent fixes. Ensuite, l'IA peut poser **une seule question ciblée** lorsqu'elle détecte une incertitude importante :

> « Tu as indiqué que la communication est importante. Quand il y a un désaccord, tu préfères quelqu'un qui parle tout de suite ou qui prend du temps avant d'en discuter ? »

Le système ne doit pas bombarder l'utilisateur de questionnaires. L'information doit venir naturellement des conversations Love.

## Règle importante

Ne jamais demander des informations sensibles uniquement pour améliorer le score. Si une donnée n'est pas nécessaire à la sécurité, au consentement ou à la recommandation, elle n'est pas obligatoire.

## Références

Le modèle s'inscrit dans la littérature des systèmes de recommandation et des recommenders réciproques, où les deux utilisateurs doivent être considérés dans la décision. [1][2]

1. Palomares et al. 2021. https://doi.org/10.1016/j.inffus.2020.12.001
2. Pizzato et al. 2013. https://doi.org/10.1007/S11257-012-9125-0
