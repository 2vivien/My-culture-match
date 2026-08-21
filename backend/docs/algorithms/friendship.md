# Algorithmes — Amitié (Connexions)

## Score de synergie (§7.2)

`synergy(f)` → **0..100** (`scoring.ts`) :

```
synergy = reciprocity        (interactions réciproques)
        + density             (fréquence de messages)
        + tribesShared        (tribus communes)
        + valuesAligned       (valeurs alignées)
        + growthPotential     (potentiel, constant 0.5 en V1)
        − toxicity            (signalements)
```
Normalisé sur 5 composantes × [0,1].

## Cycle de vie des connexions

```
Suggestion (algo) →
  A montre intérêt → status='interested'
    → B accepte → 'companion' + notification (+ éventuelle conversation)
    → B refuse → 'declined' (pas de resuggestion 30j)
  OU B envoie une demande → status='request'
    → A accepte → 'companion'
```

États : `suggestion | interested | request | companion | blocked` (enum `connection_status`).

## Règles métier

- Anti-doublon : contrainte `UNIQUE(fromId, toId)` + gestion de direction.
- Blocage global : si A bloque B → B invisible partout (feed, search, suggestions, love, chat).
- Suppression d'un compagnon → retour possible à `suggestion` après 7 j.
- Suggestions : max 20/jour/utilisateur (worker `user.suggestions` nightly).

## Implémentation

- `src/modules/connections/connections.service.ts` — cycle de vie + blocage.
- Cache : `connections:{userId}` (SET), `blocked:{userId}` (SET).
- Score `matchScore`/`synergyScore` stocké sur la ligne `connections`.
