# Sécurité — Authentification

## Flux OTP (email)

1. `POST /api/auth/send-otp { email }` → email normalisé (lowercase + trim).
   - Code 6 chiffres stocké dans Redis `otp:{email}` (TTL 5 min).
   - Rate limit : **3/h/email**, **10/h/IP**.
   - Réponse **identique** que l'email existe ou non (anti-énumération).
2. `POST /api/auth/verify-otp { email, code }` → max **3 tentatives**, puis blocage 30 min.
   - Réussite → JWT signé (jose) + session Redis `session:{token}` TTL **7 jours**.

## Sessions

- JWT signé avec `BETTER_AUTH_SECRET` (min 32 caractères).
- Cookie `httpOnly`, `Secure`, `SameSite=Strict` (ou Bearer token selon le client).
- Session persistée dans Redis **et** sauvegardée en PG (`sessions`).
- Logout → **blacklist/revocation immédiate** (suppression Redis).
- `GET /api/auth/session` → renvoie l'utilisateur de session ou 401.

## OAuth Google / Apple

- `POST /api/auth/google|apple { idToken }` → **vérification de la signature** de l'idToken.
- Création du compte si l'email n'existe pas (`user_oauth_accounts`).
- Reconnaissance via l'email normalisé.

## Protection du compte

- **Lock** : `failedLoginAttempts` + `lockedUntil` (lock 30 min après 5 échecs).
- **2FA TOTP** : activation via `POST /api/settings/2fa/start` (secret + QR data URL),
  vérification du premier code avant activation (`/verify`), désactivation exige un TOTP valide (`/disable`).
- **Changement d'email** : confirmation envoyée à l'ancienne ET la nouvelle adresse, token 24h.

## Logging

- Aucune donnée sensible dans les logs : Pino `redact` sur `authorization`, `cookie`, `password`, `token`.
- Email supprimé des métriques ; Sentry ne reçoit que `userId` (et email optionnel).
