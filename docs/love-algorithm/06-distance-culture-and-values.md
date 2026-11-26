# 06 — Distance, culture, langues et valeurs

## 1. Distance

La distance est un contexte, pas une mesure de valeur humaine.

Utiliser Haversine :

```text
a = sin²(Δφ/2) + cos(φ1)cos(φ2)sin²(Δλ/2)
d = 2R atan2(√a, √(1-a))
```

Pour une préférence de rayon `r` :

```text
S_distance = exp(-d/r)
```

Pour `international`, le poids distance peut tendre vers zéro.

## 2. Culture

La culture ne doit pas être réduite au pays de naissance.

Représenter plusieurs axes :

```text
languages
cultural_interests
food
music
posts
travel_experience
media
festivals
values
```

Deux personnes de pays différents peuvent avoir une forte compatibilité culturelle ; deux personnes du même pays peuvent avoir des styles de vie très différents.

## 3. Culture embedding

Construire un vecteur :

```text
C_u = normalize([
  language_vector,
  cultural_interest_vector,
  lifestyle_vector,
  value_vector
])
```

Puis :

```text
S_culture = cosine(C_A, C_B)
```

## 4. Langues

Créer une matrice de compatibilité :

```text
L(A,B) = max_{la ∈ A, lb ∈ B} compatibility(la,lb)
```

Exemple : une langue commune parlée à haut niveau peut produire un score plus fort qu'une longue liste de langues faiblement maîtrisées.

## 5. Valeurs

Les valeurs sont une dimension plus importante que les goûts superficiels.

Exemple de catégories :

```text
respect
communication
family
freedom
stability
ambition
curiosity
adventure
empathy
loyalty
```

Pour une valeur `k` :

```text
compat_k = 1 - |v_A,k - v_B,k|
```

Puis pondérer par importance :

```text
S_values = Σ importance_k × compat_k / Σ importance_k
```

## 6. Similarité et complémentarité

Le système doit apprendre qu'il existe plusieurs formes de compatibilité :

### Similarité

```text
S_sim = 1 - |x-y|
```

### Complémentarité

```text
S_comp = exp(-(x-y)² / 2σ²)
```

La seconde formule récompense une distance modérée plutôt qu'une identité parfaite.

Exemple :

- même goût musical : intéressant ;
- même goût musical + styles complètement différents dans d'autres domaines : potentiellement intéressant ;
- aucune passion commune : moins de points d'entrée conversationnels.

## 7. Distance psychologique

On peut construire une distance de Mahalanobis :

```text
d_M(x,y) = √((x-y)^T Σ^-1 (x-y))
```

Elle est utile lorsque les dimensions sont corrélées.

Exemple : valeurs « stabilité » et « planification » peuvent être corrélées. Une simple distance euclidienne compterait deux fois une même information.

## 8. Information gain

Les questions adaptatives peuvent être sélectionnées par gain d'information.

```text
IG(X;Y) = H(Y) - H(Y|X)
```

Le moteur choisit une question qui réduit le plus l'incertitude sur le ranking.

C'est une façon scientifique de décider quelle question poser ensuite au lieu de poser des questions arbitraires.

## 9. Exemple

Supposons :

```text
A : sérieux, communication, voyage, 50 km
B : sérieux, communication, voyage, 80 km
```

La distance ne doit pas annuler :

```text
values ≈ 0.94
communication ≈ 0.91
interests ≈ 0.88
goal ≈ 1.00
```

Le résultat pourrait rester très élevé si A autorise 100 km.

## 10. Règle culturelle

Ne jamais faire :

```text
country_A == country_B → compatible
```

Faire :

```text
culture + language + values + interests + experience
```

## Références

- Haversine / géodésie : formule standard de distance sur une sphère.
- Recommender Systems Handbook, Springer. https://link.springer.com/book/10.1007/978-1-0716-2197-4
- Reciprocal Recommender Systems. https://doi.org/10.1016/j.inffus.2020.12.001
