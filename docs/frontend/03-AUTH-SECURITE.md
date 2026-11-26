# 03 — Authentification, autorisations et sécurité

## Flux de connexion réel

1. `AuthPage` → `POST /api/auth/send-otp`.
2. `POST /api/auth/verify-otp` → `{ token, user, isNewUser }` ou `{ twoFactorRequired, ticket }`.
3. Si 2FA : `POST /api/auth/2fa/verify` avec le ticket.
4. `setAuthToken(token)` dans `localStorage['mcm.auth.token']`.
5. `authService.restoreSession()` au démarrage de `App` → `/api/auth/session` + `/api/users/me`.
6. Chaque requête `api.ts` joint `Authorization: Bearer <token>` **et** `credentials: 'include'`.

Google OneTap/FedCM est branché via `VITE_GOOGLE_CLIENT_ID`. Apple est explicitement « pas encore disponible » dans `AuthPage`.

## Modèle de session

- JWT signé côté backend, également stocké dans Redis (d'après le contrat backend `session.service.ts`),backup PG avec hash du token.
- Côté frontend, le token brut vit dans `localStorage` : persistant, mais lisible par tout script exécuté dans la page.

## Contrôles d'accès côté frontend

| Zone | Contrôle | Écart |
|---|---|---|
| `onboarding` | `isOnboarded` du store persisté | contournable en modifiant le stockage local |
| Admin (`useUIStore.activeTab === 'Admin'`, `isAdminRole`) | `currentUser.role === 'admin'|'superadmin'` | contrôle **UI seulement** ; la sécurité doit être vérifiée par le backend |
| Routes (`/profil/:id`, `/post/:id`, `/admin`) | aucune garde de route | n'importe qui peut afficher l'URL ; l'API doit refuser les données |
| Actions sensibles (ban, modération, révocation) | boutons admin | dépendent entièrement des vérifications backend |

## Risques constatés

### P0 — Clé Gemini exposée au navigateur

`vite.config.ts` :

```ts
envPrefix: ['VITE_', 'GEMINI_'],
```

`services/aiAssistService.ts` lit `import.meta.env.GEMINI_API_KEY`. Vite inline cette valeur dans le bundle : **la clé est publique**. Il faut supprimer `GEMINI_` de `envPrefix` et déplacer l'appel Gemini derrière un endpoint backend authentifié.

### P1 — Token dans localStorage

- XSS = vol de session immédiat.
- Pas de rotation ni de rafraîchissement automatique côté client.
- Alternative : cookie `HttpOnly; Secure; SameSite` porté par le backend, le frontend ne gardant que l'état utilisateur.

### P1 — Aucune politique de sécurité navigateur

- Pas de CSP dans `index.html`.
- Pas de `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` (à confirmer côté serveur de déploiement).
- Script Google chargé en direct (`accounts.google.com/gsi/client`) sans `nonce`/`integrity`.

### P1 — Validation et sanitization mínimales

- `lib/validations.ts` existe, mais les textes affichés (posts, commentaires, bio) sont rendus via React (échappement OK) ; aucune sanitization pour d'éventuels rendus HTML futurs.
- `updateProfileDetail`, `useSettings`, formulaires : validation Zod partielle selon les écrans.
- `alert()` utilisé pour le signalement : aucun audit trail frontend.

### P2 — Surface d'URL

- Le routeur History API nécessite un rewrite SPA en production, sinon 404 sur deep-link.
- `syncFromStores()` utilise `replaceState` : la navigation par stores n'ajoute pas d'entrée d'historique. Seuls les liens passant par `navigate()` (post, retour Home) sont « Back »-compatibles.

## Bonnes pratiques déjà en place

- Erreurs API centralisées (`ApiError`) sans exposition de stack trace.
- Aucun secret autre que la clé Gemini dans le code source frontend.
- `logout()` efface le token et réinitialise le store.
- `credentials: 'include'` permet au backend de poser/lire son cookie de session.

## Priorités de remédiation

1. **P0** : sortir Gemini du bundle, proxy backend.
2. **P1** : passer le token en cookie HttpOnly ou ajouter une rotation + CSP stricte.
3. **P1** : garde de route et contrôle d'role centralisés (même si le backend reste la vraie barrière).
4. **P2** : remplacer `alert()` par une mutation auditée, ajouter un Error Boundary.
