# Sécurité — Rate Limiting

## Mécanisme

Rate limiting **par fenêtre fixe** sur Redis (`src/shared/utils/rate-limit.ts`) :

```ts
rateLimitHit(bucket, limit, windowSeconds)
// → { allowed, retryAfterSeconds } ; clé Redis `rl:{bucket}` (INCR + TTL)
```

## Limites par endpoint

| Endpoint | Clé | Limite | Fenêtre |
|---|---|---|---|
| `POST /api/auth/send-otp` | par email | 3 | 1 h |
| `POST /api/auth/send-otp` | par IP | 10 | 1 h |
| `POST /api/auth/verify-otp` | par IP | 5 | 15 min |
| `POST /api/auth/google` / `apple` | par IP | 10 | 1 h |
| `PUT /api/settings` | par user | 5 | 1 h |
| `POST /api/uploads/request` | par user | variable | 1 h |
| Messages | par user | 60 | 1 min |

> Certaines limites sont implémentées dans les services concernés (settings, uploads, messages).
> Les routes critiques de lecture (feed, search) peuvent être protégées par IP selon l'usage.

## Réponse

En cas de dépassement → **429** `{ error: { code: "RATE_LIMITED" } }` avec `Retry-After` si applicable.

## Compléments

- **Arcjet** (si `ARCJET_KEY` configuré) : anti-bot, détection d'emails jetables, brute force.
- **Lock de compte** : 5 échecs OTP/mot de passe → `lockedUntil` 30 min (Redis + champ user).
- En prod, mettre un **WAF/CDN** (Cloudflare) en amont pour absorber les pics et le L7 DDoS.
