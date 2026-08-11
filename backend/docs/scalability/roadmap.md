# Scalabilité — Roadmap

## Cibles

- **Phase 1 — Lancement** : dizaines de milliers d'utilisateurs, un seul primaire Neon + Redis.
- **Phase 2 — Croissance** : centaines de milliers, read replicas + partitionnement.
- **Phase 3 — Millions** : multi-régions, sharding, CDN massif, migration messages vers Kafka si live massif.

## Roadmap par phase

### Phase 1 (actuel)

- Docker Compose local + Neon (branches dev/staging/prod).
- Redis pour cache, sessions, compteurs, présence.
- Meilisearch pour la recherche.
- Fanout push + bascule pull à 10 k followers.
- Monitoring : Sentry, Prometheus, Better Stack, Grafana.

### Phase 2

- **Read replicas** Neon : lectures feed/profils/stats → réplica.
- **Partitionnement** des tables chaudes (voir sharding.md).
- **Pooler** Neon à fond + connexions Redis par POD.
- Autoscaling horizontal de l'API (stateless, sessions en Redis).

### Phase 3

- Sharding de `messages`, `notifications`, `posts` (par userId/hash).
- Multi-régions (média via CDN Cloudflare, données par région).
- NATS/Kafka si broadcast massif (live > 100 k spectateurs).

## Garde-fous à garder dès maintenant

- IDs **UUID v7** (triables, shardables).
- Toutes les écritures de masse passent par BullMQ (jamais dans la requête HTTP).
- Compteurs en Redis → flush PG (pas de `UPDATE` par action).
- Cursor pagination partout (pas d'OFFSET).
- Stateless API : la session est dans Redis, pas en mémoire.

## Critères de passage à l'étape suivante

| Métrique | Phase 1 → 2 | Phase 2 → 3 |
|---|---|---|
| DAU | > 100 k | > 1 M |
| p95 latence | > 300 ms | > 300 ms |
| Primaires DB | saturation CPU/IO | écritures > capacité primaire |
| Messages/jour | > 1 M | > 10 M |
