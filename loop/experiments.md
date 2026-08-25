# experiments.md — Mémoire de la boucle

> Ajout seul. Jamais de modification ni suppression d'une entrée passée.
> Format : `[vérificateur] [date] hypothèse : ... | changement : ... | résultat : ... | verdict : gardé/annulé | leçon : ...`

## Étape 0 — Baseline (2026-08-25)

Stack identifiée :
- Backend : Node 20+, Hono 4, Drizzle ORM 0.38 + PostgreSQL (postgres.js), Redis (ioredis) + BullMQ, Socket.IO (+ adapter Redis), MinIO, Meilisearch, Zod, jose (JWT), pino, Sentry. Tests vitest (unit + integration), ESLint 9 flat, TS 5.7 strict.
- Web : React 19, Vite 6, Tailwind 4, TanStack Query 5, Zustand 5, react-hook-form + zod, framer-motion. « lint » = tsc --noEmit (pas d'ESLint côté web).
- Mobile : Expo SDK 54 / RN 0.81, twrnc — non audité dans cette session sauf mention contraire.

Baseline CHIFFRÉE (avant tout correctif) :
- backend typecheck (`tsc --noEmit`) : 0 erreur
- backend lint (`eslint src`) : 0 erreur, 0 warning
- backend tests (`vitest run`, unit+integration) : 219/220 verts — 1 ÉCHEC `tests/integration/social.test.ts > MP9 — Love / Matching > candidats : profil incomplet exclu`
- web typecheck/lint (`tsc --noEmit`) : 0 erreur
- web build (`vite build`) : OK — warning chunk principal 857 kB > 500 kB
- `npm audit --omit=dev` backend : 1 HIGH — drizzle-orm <0.45.2, GHSA-gpj5-g38j-94v9 / CVE-2026-39356 (injection SQL via échappement d'identifiants ; exploitables seulement si entrée utilisateur atteint sql.identifier()/.as())
- `.env` backend et web : présents en local, NON versionnés git. Historique : seuls les `.env.example` ont été commités ; scan regex de secrets sur tout l'historique = 0 hit.

Skills/bonnes pratiques retenues par techno (recherche web du jour) :
- Hono : ordre des middlewares = error → logger → secureHeaders → CORS → bodyLimit → auth ; auth globale par défaut avec allowlist publique exacte (fail-closed) ; rate-limit AVANT auth ; secureHeaders + csrf natifs ; rester ≥ v4.12.16 (correctifs JSX injection + bypass body-limit).
- Drizzle ORM : CVE-2026-39356 corrigé en 0.45.2 (échappement escapeName) — ne jamais passer d'entrée utilisateur à sql.identifier()/.as() ; upgrade 0.38→0.45 à faire avec tests.
- Sécurité API générale : réponses 404 (pas 403) sur mismatch de propriété pour ne pas leak l'existence ; messages d'erreur sans trace technique ; validation serveur systématique via Zod.

Outils choisis :
- Contrôle navigateur pour vérificateur 03 : Playwright piloté par scripts Node locaux (`playwright` npm + chromium), faute de pouvoir attacher un serveur MCP à la session courante ; même surface de test (navigation, clic, saisie, capture) qu'@playwright/mcp. À documenter par flux.
- Client HTTP pour volet API du vérificateur 03 : curl (déjà présent).

## Entrées de cycle

