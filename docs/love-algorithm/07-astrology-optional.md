# 07 — Astrologie : signal expérimental et optionnel

## Position scientifique

L'astrologie ne dispose pas d'une validation scientifique comparable aux méthodes psychométriques ou aux modèles statistiques de recommandation. Elle ne doit donc **jamais** être présentée comme une méthode scientifique de prédiction de compatibilité amoureuse.

Elle peut néanmoins exister comme une fonctionnalité culturelle/loisir explicitement activée par l'utilisateur.

## Règle absolue

```text
astrology_score = optional_signal
```

et jamais :

```text
astrology_score = hard_filter
```

L'astrologie ne doit jamais :

- exclure une personne ;
- contourner le consentement ;
- influencer la sécurité ;
- déterminer l'âge ou l'identité ;
- être utilisée pour inférer un attribut sensible ;
- représenter une vérité scientifique.

## Données possibles

Si l'utilisateur choisit volontairement cette fonctionnalité :

```text
sun_sign
optional_birth_date
optional_birth_time
optional_birth_place
```

Le lieu de naissance ne doit pas être utilisé comme localisation actuelle.

## Signal simple

Pour deux signes `a` et `b`, on peut avoir une table de compatibilité éditoriale :

```text
A_astrology(a,b) ∈ [0,1]
```

Mais cette table est une convention culturelle, pas une mesure empirique de la réussite relationnelle.

## Poids maximal recommandé

Dans le moteur global :

```text
w_astrology <= 0.03
```

Et uniquement si :

```text
user_enabled_astrology == true
```

Exemple :

```text
S_raw = 0.97 × S_scientific + 0.03 × S_astrology
```

Le 97% de la formule représente ici le poids de l'ensemble des signaux validables, pas un niveau de certitude.

## Variante « divertissement »

Une meilleure UX consiste à séparer :

### Compatibilité Love

Fondée sur :

- préférences ;
- valeurs ;
- communication ;
- intérêts ;
- culture ;
- distance ;
- réciprocité ;
- comportement.

### Affinité astrologique

Présentée séparément :

> « Affinité astrologique : forte »

Ainsi l'utilisateur comprend qu'il s'agit d'une couche ludique.

## Astrologie avancée

Si l'on implémente un jour des thèmes complets :

- positions planétaires ;
- maisons ;
- aspects ;
- synastrie ;

le résultat doit rester une **affinité culturelle/ludique**.

Aucune formule astrologique ne doit être appelée « modèle scientifique ».

## Pourquoi la séparer

Cette séparation permet de satisfaire les utilisateurs intéressés par l'astrologie sans contaminer le modèle principal ni créer une fausse promesse.

## Conclusion

L'astrologie peut être un produit différenciant, mais le cœur du moteur doit rester :

```text
consentement
+ sécurité
+ valeurs
+ objectifs
+ communication
+ culture
+ intérêts
+ distance
+ réciprocité
+ apprentissage
```

## Référence générale

Les dimensions psychologiques et les résultats relationnels doivent privilégier les travaux empiriques. Par exemple, une méta-analyse sur le modèle des Big Five a trouvé des associations entre certaines dimensions de personnalité et la satisfaction relationnelle ; cela ne signifie toutefois pas que la personnalité puisse prédire parfaitement une relation individuelle. https://doi.org/10.1016/j.jrp.2009.09.004
