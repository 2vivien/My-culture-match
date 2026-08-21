# Scalabilité — Sharding & Partitionnement

## Quand sharder ?

- Quand les **écritures du primaire** (PostgreSQL/Neon) saturent (CPU/IO/connections).
- Quand une table unique atteint plusieurs dizaines de Go et que les index chauds
  ne tiennent plus en mémoire.
- Signes : p95 écritures > 50 ms, queue BullMQ de flush qui gonfle, autoscale Neon à 100 %.

## Stratégie recommandée

### 1. Partitionnement PostgreSQL (d'abord)

Sans changer l'application, partitionner par **mois** (parties héritées) :

| Table | Clé de partition | Raison |
|---|---|---|
| `messages` | `createdAt` (mensuel) | historique + écritures séquentielles |
| `notifications` | `createdAt` (mensuel) | purge facile des vieux mois |
| `posts` | `createdAt` (mensuel) | hot data récente |
| `comments` | `createdAt` (mensuel) | — |
| `stories` | `createdAt` (mensuel) | purge cohérente avec le TTL 24 h |

**Avantages** : simple, transparent pour l'ORM (via la table parente), purge = DETACH + DROP.

### 2. Read replicas (d'abord aussi)

Toutes les lectures chaudes (feed, profils, stats) vers un **réplica de lecture**.
Ensuite seulement, si nécessaire :

### 3. Sharding applicatif (en dernier recours)

- Clé de shard = **userId hash** (pour messages, notifications, connections) → cohérence locale.
- Idempotence des jobs BullMQ (retry-safe) → indispensable avant de sharder.
- Répartition : `shard = fnv1a(userId) % N`.

**Conséquences** :
- Les requêtes cross-shard (recherche globale) restent sur Meilisearch (pas de JOIN cross-shard).
- Les migrations doivent être appliquées sur chaque shard (outil de fanout).
- La cardinalité des IDs UUIDv7 reste globale et unique (pas d'auto-increment).

## Ce qu'on NE sharde PAS

- `users` : volume faible, fortement référencé → rester sur le primaire (caché Redis `user:{id}`).
- Recherche : Meilisearch, jamais PG.
- Files BullMQ : Redis (shardé au besoin, pas l'application).

## Check-list avant de sharder

1. Partitionnement mensuel en place depuis les débuts (migration initiale).
2. Toutes les écritures passent par des jobs idempotents.
3. Aucun JOIN cross-shard dans le code (vérifié par lint/review).
4. Plan de migration des données existantes (downtime limité ou rolling).

Voir aussi [`roadmap.md`](roadmap.md) pour le timing par phase.
