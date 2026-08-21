# Sécurité — Modèle de menace

## Principales menaces et mitigations

| Menace | Vecteur | Mitigation |
|---|---|---|
| **Énumération d'emails** | `send-otp` | Réponse identique email existant/absent |
| **Brute force OTP** | `verify-otp` | 3 tentatives max + lock 30 min + rate limit |
| **Sessions volées** | cookies/JWT | httpOnly + Secure + SameSite=Strict, TTL 7j, révocation au logout |
| **idToken OAuth falsifié** | `/google`, `/apple` | Vérification de signature obligatoire |
| **Injection SQL** | requêtes | ORM Drizzle paramétré (jamais de concaténation SQL) |
| **XSS** | contenu utilisateur | Sortie échappée côté front ; contenu stocké brut |
| **Upload malveillant** | `/uploads` | Whitelist MIME + taille max + sanitization nom + scan (optionnel) |
| **URL malveillante** | `POST /api/posts` type Link | Validation URL (pas de `file://`, pas de localhost) |
| **Contenu toxique/illégal** | posts/comments/stories | Auto-modération (`moderation.scan`) + signalements + ban |
| **Usurpation de messages** | WS/REST messages | Vérification de participation à la conversation (403) |
| **DDoS / bruit** | réseau | Rate limit + Arcjet + WAF Cloudflare en prod |
| **Secret leak** | logs | Pino `redact` ; `.env` jamais commité ; secrets manager en prod |
| **Abus de comptes** | onboarding | Age ≥ 18 serveur, username unique, max 5 tribus créées |

## Filtrage global (blocage)

- Table `blocks` : si A bloque B, B disparaît de **tous** les canaux (feed, recherche, suggestions, love, messages).
- Vérifié dans les services avant toute réponse contenant un profil.

## Données sensibles

- Emails : non exposés dans les profils publics (`GET /api/users/:id` filtre).
- Tokens/sessions : jamais dans les logs, jamais dans les réponses (sauf token de session à l'auth).
- 2FA : secret TOTP stocké chiffré côté serveur, jamais renvoyé après génération (sauf QR initial).

## Modération humaine

- `reports` → file de modération → actions `warn|suspend|ban|dismiss` (RBAC admin).
- Toute action admin est **auditée** (`audit_logs` : qui, quoi, quand, pourquoi).

## Conformité

- App 18+ : `acceptedTermsAt` + vérification d'âge serveur.
- Données personnelles : suppression de compte à prévoir (soft delete → purge), RGPD.
