# API — Erreurs

## Format

Toutes les erreurs retournent un objet JSON stable :

```json
{
  "error": {
    "code": "USERNAME_TAKEN",
    "message": "Ce nom d'utilisateur est déjà pris",
    "details": {
      "suggestions": ["awa_1995", "awa_the_one", "awa_of_abomey"]
    }
  }
}
```

- `code` : code métier stable, utilisable côté client (pas de string matching sur le message).
- `message` : lisible, prêt à afficher (i18n côté client).
- `details` : optionnel, données contextuelles (suggestions, erreurs de validation).

## Statuts HTTP

| Statut | Signification |
|---|---|
| 200 / 201 | Succès |
| 400 | Validation Zod / requête invalide (`ZOD_VALIDATION`, `BAD_REQUEST`) |
| 401 | Non authentifié / session invalide (`UNAUTHORIZED`) |
| 403 | Accès refusé (rôles, propriété, blocage) (`FORBIDDEN`) |
| 404 | Ressource introuvable (`NOT_FOUND`) |
| 409 | Conflit (doublon, état invalide) (`CONFLICT`) |
| 429 | Rate limit dépassé (`RATE_LIMITED`) |
| 500 | Erreur interne (`INTERNAL_ERROR`) — capturée par Sentry |

## Codes métier courants

| Code | Cas typique |
|---|---|
| `USERNAME_TAKEN` | Username dupliqué (avec `details.suggestions`) |
| `EMAIL_ALREADY_ONBOARDED` | Compte déjà créé |
| `UNDERAGE` | Âge < 18 |
| `INVALID_OTP` / `OTP_EXPIRED` / `OTP_TOO_MANY_ATTEMPTS` | Vérification OTP |
| `EMAIL_ALREADY_SENT` | Cooldown OTP (3/h) |
| `RATE_LIMITED` | Trop de requêtes |
| `SESSION_EXPIRED` | Session révoquée |
| `ALREADY_LIKED` / `ALREADY_REQUESTED` | Action déjà effectuée |
| `NOT_MEMBER` | Non-membre d'une tribu |
| `TOXIC_CONTENT` | Contenu rejeté par modération |
| `INVALID_FILE_TYPE` / `FILE_TOO_LARGE` | Upload refusé |
| `TWO_FACTOR_REQUIRED` | 2FA à vérifier |

> La liste exhaustive vit dans les schémas/services ; `AppError` (`src/shared/utils/AppError.ts`)
> centralise les constructeurs (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `tooMany`).

## Comportement du `error-handler`

1. `ZodError` → 400 avec le détail des champs en échec.
2. `HTTPException` (Hono) → statut natif.
3. `AppError` → statut + code métier.
4. Autre → 500 `INTERNAL_ERROR` + log structuré + capture Sentry (`captureError`).
