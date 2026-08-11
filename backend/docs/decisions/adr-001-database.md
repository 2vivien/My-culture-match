# ADR-001 — Base de données : Neon + Drizzle ORM

## Contexte
Besoin d'un PostgreSQL scalable (serverless), avec migrations sûres, sans runtime lourd,
et compatible avec le déploiement edge/serverless futur.

## Options étudiées
1. **Neon + Drizzle ORM** (retenu)
2. Prisma (runtime engine binaire, bundle lourd)
3. SQL brut + un wrapper maison (perte de sécurité de typage)
4. MongoDB (pas adapté : relations, transactions ACID du social)

## Décision
**Neon (PostgreSQL serverless) + Drizzle ORM** avec migrations `drizzle-kit`.

## Pourquoi
- Neon : branches par environnement, autoscale, pooler intégré, read replicas.
- Drizzle : TypeScript-first, zéro engine binaire, edge-compatible, SQL proche du métal.
- SQL pur + migrations versionnées = contrôle total et pas de magic runtime.

## Conséquences
- Le schéma vit dans `src/infrastructure/database/schema.ts`.
- Les migrations sont versionnées dans `drizzle/` ; jamais de SQL manuel en prod.
- Le pool de connexions est borné (`DATABASE_POOL_SIZE`), crucial côté Neon.

## Évolution future
Partitionnement mensuel + read replicas dès la saturation (voir `scalability/sharding.md`).
