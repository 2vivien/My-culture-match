# Algorithmes — Culture Engine (V1)

> Implémentation : `src/modules/culture-engine/scoring.ts` (+ `embedding.ts`, `profile-vector.ts`, `health.ts`).
> Référence produit : `ALGO-culture-engine.md` (§5 Feed, §6 Love, §7 Amitié).

## Principes (fonctions pures)

Chaque fonction est **pure et déterministe** : pas d'accès DB/Redis, uniquement ses entrées.
Faciles à tester unitairement (`tests/unit/culture-engine/`).

| Sigle | Fonction | Rôle |
|---|---|---|
| P-ENG | `engagementPred` | Probabilité d'engagement normalisée (likes, comments×2, views) |
| P-SOC | `socialAffinity` | Affinité sociale (tribus communes, follow) |
| P-INT | `interestMatch` | Overlap tags du post / intérêts du profil |
| P-CUL | `cultureResonance` | Cosinus des vecteurs culturels (Hofstede/Schwartz) |
| P-FR | `freshness` | Décroissance temporelle `1/(1+α·age)` |
| P-DIV | `diversityBoost` | Bonus anti-bulle (contenus hors profil habituel) |
| P-QUAL | `qualityEthics` | Qualité/authenticité (longueur du texte) |
| P-ADD | `addictionPenalty` | Pénalité clickbait/outrage (éthique L07) |
| P-SAFE | `safetyFilter` | Score 0 si `status=flagged` (tolérance zéro L03-L04) |

## Score Feed (§5.1)

```
scoreFeed = 0.25·P-ENG + 0.20·P-SOC + 0.15·P-INT + 0.15·P-CUL
          + 0.10·P-FR + 0.05·P-DIV + 0.05·P-QUAL − 0.05·P-ADD
```
`P-SAFE` non-passant → score **0** (jamais proposé).

## Vecteurs

- **user_profile_vector** : 768 dims (Hofstede 6, Schwartz 10, BigFive 5, racines 4, langues N, valeurs 12), normalisé L2.
- **post_vector** : 768 dims (émotions Plutchik 24, vertus stoïques 4, champs lexicaux 20, tags).

Calculés de façon asynchrone (`post.embedding` queue, `culture-engine.batch` nightly).

## Santé (L01-L12)

`src/modules/culture-engine/health.ts` + table `health_metrics` :
- L01 Diversité du feed, L02 Qualité, L03-L04 Toxicité, L05 Voix marginalisées,
  L06 Authenticité, L07 Addictivité, L08 Transparence, L09-L12 autres garde-fous.
- Calcul nightly (queue `culture-engine.batch`, cron `0 2 * * *`).
- Si un seuil est dépassé → alerte (Sentry/Slack à brancher).

## Apprentissage V1 (simplifié)

Pas de ML en V1 : pondération fixe + `chemistry` constant (0.5) en love.
Le feedback (swipes, conversations > 10 messages) ajustera les poids dans une V2.
