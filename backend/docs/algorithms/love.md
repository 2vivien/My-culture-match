# Algorithmes — Love (Matching)

## Score de compatibilité (§6.1)

`compatLove(A, B)` → **0..100**, calculé dans `scoring.ts` :

```
compat = 0.30·valueAlignment   (Schwartz)
       + 0.20·psychologyCompat (Big Five approx. par valeurs)
       + 0.15·emotionalMatch   (émotions Plutchik)
       + 0.10·culturalRoots    (ethnie, pays, langues)
       + 0.10·proximity        (pays/région)
       + 0.10·interestOverlap  (intérêts communs)
       + 0.05·chemistry        (constant 0.5 en V1)
```

## Filtres des candidats

- Âge ≥ 18, profil complet (≥ 80 %).
- Non bloqué (table `blocks`), non déjà swipé (Redis `love:swiped:{userId}`).
- Candidats générés et cachés : `love:candidates:{userId}` TTL 1 h.

## Swipe

```
POST /api/love/swipe { userId, action: 'like'|'pass' }
  like → INSERT love_matches → si l'autre a déjà like → MATCH MUTUEL
  pass → enregistré, pas de resuggestion pendant 30 jours
```

### Match mutuel (transactions)

1. `INSERT love_matches` (`isMutual`, `conversationId`)
2. `INSERT conversations` + `conversation_participants`
3. `INSERT connections` (compagnons)
4. `INSERT notifications` (A et B)
5. WS `love:match` (`emitToUser`)
6. Métrique `matches_created_total`

Les contraintes UNIQUE + transactions garantissent l'unicité même en cas de swipe simultané.

## Candidats

`GET /api/love/matches` → liste triée par `matchScore` décroissant.
`GET /api/love/matches/:id` → détail public du candidat.
