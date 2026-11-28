# My Culture Match

Réseau social interculturel : traditions, tribus, connexions, matching amoureux et messagerie. Le produit repose sur un backend Hono et une application web Vite/React.

> État des lieux mis à jour le **28 novembre 2026**. Le backend et le web sont des implémentations fonctionnelles ; `mobile-app/` a été retiré du dépôt. Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) et [docs/DOCUMENTATION_AUDIT.md](docs/DOCUMENTATION_AUDIT.md).

---

## Démarrage rapide

```bash
# Infrastructure locale (Postgres, Redis, Meilisearch, MinIO, Mailpit)
docker compose up -d

# Dépendances (racine + chaque workspace)
npm install
npm install --prefix backend
npm install --prefix myculturematch-web

# API (http://localhost:3000) + web (http://localhost:5173)
npm run dev
```

La configuration d'environnement du backend est documentée dans [`backend/.env.example`](backend/.env.example). Le frontend web utilise un proxy Vite `/api` → `http://localhost:3000` (voir `myculturematch-web/vite.config.ts`).

---

## Stack

| Workspace | Stack | État |
|---|---|---|
| `backend/` | Hono 4, TypeScript strict, Drizzle + PostgreSQL 16, Redis 7 / BullMQ, Meilisearch, MinIO, socket.io + Redis adapter, Pino / Prometheus / Sentry / Better Stack | Implémenté |
| `myculturematch-web/` | Vite 6, React 19, Tailwind 4, TanStack Query 5, Zustand 5, socket.io-client, MapLibre, Playwright | Implémenté |
| Infrastructure | Docker Compose : Postgres, Redis, Meilisearch, MinIO, Mailpit ; CI GitHub Actions (lint, typecheck, build, tests unitaires et d'intégration, couverture) | Implémentée |

---

## Architecture

Le backend expose une API REST `/api/*` et un canal WebSocket. Le web consomme l'API via des services (`src/services/*.ts`) avec un jeton Bearer .

Cartographie complète, modules, flux et écarts documentaires : **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

Points d'entrée utiles :

- [`backend/src/app.ts`](backend/src/app.ts) — enregistrement des middlewares et des modules de routes.
- [`backend/docs/README.md`](backend/docs/README.md) — documentation détaillée du backend (API, schéma, sécurité, ADR).
- [`myculturematch-web/src/services/api.ts`](myculturematch-web/src/services/api.ts) — client HTTP du web.
- [`myculturematch-web/src/lib/router.ts`](myculturematch-web/src/lib/router.ts) — routeur History API du web.

---

## Documentation

### Référentiels canoniques

| Document | Rôle |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture réelle du backend, du web et de l'infrastructure |
| [docs/DOCUMENTATION_AUDIT.md](docs/DOCUMENTATION_AUDIT.md) | Audit documentaire, décisions de nettoyage et actions restantes |
| [backend/docs/README.md](backend/docs/README.md) | Index de la documentation backend |
| [docs/MIGRATIONS.md](docs/MIGRATIONS.md) | Convention des migrations Drizzle écrites à la main, contrôle de cohérence |
| [docs/PLAN_ISSUES_2026-11-27.md](docs/PLAN_ISSUES_2026-11-27.md) | Plan et avancement des chantiers Communauté / Friend-Maps / Love |
| [docs/F11_CONTENU_SUR_LA_CARTE.md](docs/F11_CONTENU_SUR_LA_CARTE.md) | Conception du contenu sur la carte (stories, lieux culturels, événements) |
| [SKILL-audit-fonctionnel-ultra-complet.md](SKILL-audit-fonctionnel-ultra-complet.md) | Contrat fonctionnel / endpoints attendus par le front |
| [stack.md](stack.md) | Référence d'infrastructure backend (à lire avec les correctifs de l'audit) |

### Spécifications produit et algorithmes

Ces documents décrivent des **cibles de conception**, pas nécessairement de l'implémenté. Leur statut est précisé dans l'audit documentaire.

- Relation et mémoire : [`docs/RELATIONSHIP_MEMORY_MASTER.md`](docs/RELATIONSHIP_MEMORY_MASTER.md), [`docs/RELATIONSHIP_MEMORY_V2.md`](docs/RELATIONSHIP_MEMORY_V2.md), [`docs/RELATIONSHIP_MEMORY_API.md`](docs/RELATIONSHIP_MEMORY_API.md), [`docs/RELATIONSHIP_MEMORY_ALGORITHMS.md`](docs/RELATIONSHIP_MEMORY_ALGORITHMS.md), [`docs/RELATIONSHIP_MEMORY_ISSUES.md`](docs/RELATIONSHIP_MEMORY_ISSUES.md), [`docs/RELATIONSHIP_FUTURE_FEATURES.md`](docs/RELATIONSHIP_FUTURE_FEATURES.md)
- Recommandation : [`docs/RECOMMENDATION_MASTER.md`](docs/RECOMMENDATION_MASTER.md) et ses cinq documents de spécification
- Love : [`docs/LOVE_CONVERSATIONAL_MATCHMAKING.md`](docs/LOVE_CONVERSATIONAL_MATCHMAKING.md) et la série [`docs/love-algorithm/`](docs/love-algorithm/)
- Autres algorithmes : [`docs/FRIENDSHIP_ALGORITHM.md`](docs/FRIENDSHIP_ALGORITHM.md), [`docs/FEED_RANKING_ALGORITHM.md`](docs/FEED_RANKING_ALGORITHM.md), [`docs/EXPLORE_CULTURE_COMMUNITY_ALGORITHM.md`](docs/EXPLORE_CULTURE_COMMUNITY_ALGORITHM.md), [`ALGO-culture-engine.md`](ALGO-culture-engine.md)
- Sécurité / chat : [`docs/CONSENT_TRUST_SAFETY.md`](docs/CONSENT_TRUST_SAFETY.md), [`docs/CHAT_V2.md`](docs/CHAT_V2.md), [`docs/TEMPORAL_MESSAGES.md`](docs/TEMPORAL_MESSAGES.md)
- Audits produit : [`docs/MY_CULTURE_MATCH_AUDIT_ROADMAP.md`](docs/MY_CULTURE_MATCH_AUDIT_ROADMAP.md), [`docs/AUDIT_360_PRE_PRODUCTION_2026-11-27.md`](docs/AUDIT_360_PRE_PRODUCTION_2026-11-27.md)

### Règles de développement

[`SKILL_web.md`](SKILL_web.md), [`SKILL_react_native.md`](SKILL_react_native.md), [`skill-refractory.md`](skill-refractory.md) et [`loop/`](loop/) décrivent des conventions de travail. `SKILL_react_native.md` décrit une cible mobile : le dossier `mobile-app/` a été retiré du dépôt, ce document est conservé comme référence de conception.

---

## Limites connues avant production

- La couverture d'instructions du backend est de **76,9 %** (seuil de la CI : 80 %) ; le job de couverture est donc rouge tant que le seuil n'est pas atteint ou révisé.
- Les écrans récents (carte People Nearby avec stories, lieux et événements, tribus privées, Love) sont vérifiés par `tsc` et par des tests Playwright sur API simulée, **pas par un essai manuel complet**.
- Les migrations 0020 à 0033 n'ont pas été appliquées sur une base de production réelle : les essayer sur une base jetable avant tout déploiement.
- Le déploiement de **production est manuel** (`workflow_dispatch`) ; seul le staging est automatique. L'image MinIO référencée par `backend/docker-compose.prod.yml` n'est plus publiée : choisir un stockage objet de remplacement avant de reconstruire une pile de production.
- Plusieurs spécifications algorithmiques ne sont pas implémentées et ne doivent pas être lues comme telles.

Détails et priorisation dans [docs/DOCUMENTATION_AUDIT.md](docs/DOCUMENTATION_AUDIT.md) et [docs/AUDIT_360_PRE_PRODUCTION_2026-11-27.md](docs/AUDIT_360_PRE_PRODUCTION_2026-11-27.md).
