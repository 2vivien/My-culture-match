# 07 — Plan de correctifs frontend (sans backend)

Objectif : corriger **uniquement** `myculturematch-web/` : espacements incohérents et sécurité. Aucune modification de `backend/`, `database/`, `packages/`.

## Phase 1 — Sécurité (P0/P1)

1. **Token de session** : supprimer la persistance `localStorage['mcm.auth.token']`. Le backend pose déjà un cookie `HttpOnly; Secure(prod); SameSite=Strict`. Le token reste en mémoire dans `auth.token.ts`, récupéré depuis `/api/auth/session` au rechargement (le cookie authentifie la requête). `api.ts` continue d'envoyer le Bearer ; Socket.io garde le token mémoire dans `handshake.auth`.
2. **Gemini** : retirer `GEMINI_` de `envPrefix` (`vite.config.ts`) et supprimer l'appel `@google/genai` du navigateur. `aiAssistService` retombe sur ses accroches locales (déjà présentes et testées). Aucune clé ne doit apparaître dans le bundle.
3. **CSP** : ajouter une politique restrictive dans `index.html` (`self`, Google OneTap, images MinIO/data/blob, HMR localhost) avec `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
4. **Error Boundary** : envelopper `App` dans un boundary React pour éviter l'écran blanc sur erreur de rendu.

## Phase 2 — Espacements (cohérence)

5. Profil : resserrer le groupe Posts / Followers / Following (trop d'écart signalé).
6. Feed : harmoniser les marges du filter toggle et de la carte unique.
7. Explore : réduire l'espace entre le header, les catégories et les cartes.
8. Love : resserrer le header, le welcome et les paddings verticaux.
9. Sidebar : resserrer la liste de liens du footer.

## Phase 3 — Vérification

10. `tsc --noEmit` (comparé à `baseline/post-profil`), `vite build`.
11. Scénarios Playwright : login, feed, profil, Love, URL propres.
12. Contrôle du bundle : aucune chaîne `AIza` (clé Gemini) dans `dist/assets/*.js`.

## Hors périmètre (volontaire)

- Rotation/refresh côté backend, CORS, rate limiting : backend uniquement.
- Migration du cookie en `SameSite=None` pour un domaine cross-site : backend/déploiement.
- Proxy Gemini authentifié : nécessite un endpoint backend (documenté dans `05-ETAT-ET-GAPS.md`).
