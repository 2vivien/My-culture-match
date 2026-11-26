# Documentation frontend — MyCultureMatch

Périmètre : `myculturematch-web/` uniquement (React 19, TypeScript, Vite 6, Tailwind 4).
Le backend (`backend/`) n'est pas modifié ici ; les endpoints consommés sont documentés dans `04-API-INTEGRATION.md`.

## Méthode d'audit

- Inventaire systématique des `services/` (26 fichiers), `hooks/` (21), `stores/` (3), `pages/` (6) et des 20 dossiers de `components/`.
- Lecture ciblée des fichiers critiques : routeur, client API, auth, stores, query client, config Vite, pages et hooks métier.
- Relevé de tous les appels `/api/...` par analyse des services.
- Vérification réelle : `tsc --noEmit`, `vite build`, seeds SQL + migration, `npm run seed:feed`, appels API authentifiés, scenarios Playwright (login, feed, création de post, navigation, Love, profil, notifications).
- Comparaison des erreurs TypeScript avec le tag `baseline/post-profil` : **0 nouvelle erreur** (2 erreurs préexistantes dans `ChatMessageBubble.tsx`).

Légende : ✅ implémenté et vérifié · ⚠️ partiel / contourné · ❌ absent ou cassé.

## État global

| Domaine | État |
|---|---|
| Build production Vite | ✅ |
| TypeScript | ⚠️ 2 erreurs préexistantes, aucune nouvelle |
| Routage sans `#` (History API) | ✅ `/love`, `/post/:id`, `/profil/:id`… |
| Seeds (users + 8 posts + feed Redis) | ✅ feed API = 8 posts |
| E2E Playwright | ⚠️ une partie verte, un test préexistant obsolète sur Love (`Love Matchmaker`) |
| Sécurité production | ❌ voir `03-AUTH-SECURITE.md` (P0 : clé Gemini exposée) |

## Sommaire

1. `01-ARCHITECTURE.md` — stack, arborescence, flux de données, routeur, stores, configuration.
2. `02-FONCTIONNALITES-ETAT.md` — matrice fonctionnelle ligne par ligne : ce qui est géré, ce qui ne l'est pas.
3. `03-AUTH-SECURITE.md` — connexion, session, autorisations, risques et recommandations.
4. `04-API-INTEGRATION.md` — inventaire des endpoints, cache, erreurs, incohérences.
5. `05-ETAT-ET-GAPS.md` — production readiness, dettes, roadmap priorisée.
6. `06-TESTS-ET-VERIFICATION.md` — commandes, scénarios vérifiés, comment reproduire.

> Ce jeu de documents décrit l'état du code au commit courant de la branche `refactor/post-profil`.
