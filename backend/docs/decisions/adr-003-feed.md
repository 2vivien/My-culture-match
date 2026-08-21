# ADR-003 — Feed : fanout push (avec bascule pull)

## Contexte
La lecture d'un feed "Following" ne doit pas faire N requêtes par page. Il faut un modèle de diffusion
qui scale jusqu'à des millions d'utilisateurs sans refonte.

## Options étudiées
1. **Fanout push** (retenu) — ZADD dans la timeline de chaque follower à la publication.
2. Pull pur — lecture des posts des followed à la volée (N+1, lent).
3. Hybride push + pull (retenu à terme) — push sous le seuil, pull pour les célébrités.

## Décision
**Push (fanout) via BullMQ + Redis ZSET** `feed:following:{userId}`,
avec **bascule pull** au-delà de 10 000 followers (auteur).

## Pourquoi
- Lecture O(1) sur Redis : `ZREVRANGE` + hydrate en batch → latence < 20 ms.
- Le fanout est **asynchrone** (BullMQ), jamais dans la requête HTTP de publication.
- Le seuil célébrité évite l'explosion mémoire Redis (500 k ZADD par post = intenable).
- Cursor-based (timestamp + id) → pagination stable.

## Conséquences
- Worker `feed.fanout` à surveiller (latence, débit) — métrique `queue_depth`.
- Le mode pull célébrité nécessite une fusion à la lecture (voir `scalability/feed.md`).
- ZSET trimé à 1000 posts par utilisateur ; le reste reste paginable via PG.

## Évolution future
Mix push + pull généralisé, puis (volume extrême) pré-calcul par buckets d'utilisateurs.
