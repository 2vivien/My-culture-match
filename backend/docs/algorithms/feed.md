# Algorithmes — Feed

## Modèle : Fanout push (+ pull pour célébrités)

### Publication

```
POST /api/posts
  → INSERT posts (PG)
  → BullMQ job feed.fanout :
       followers = ZRANGE followers:{authorId} (Redis)
       si followers > 10 000 → mode PULL (pas de fanout, les followers lisent directement)
       sinon → pour chaque follower : ZADD feed:following:{followerId} timestamp postId
```

### Lecture "Following"

```
ZREVRANGE feed:following:{userId} cursor cursor+limit
  → fetch des posts en batch (cache Redis post:{id} / PG)
  → enrichissement : auteur, compteurs, likedByMe
  → { posts, nextCursor }
```

Pagination **cursor-based** (timestamp + id), jamais d'OFFSET.

### Lecture "For You" (recommandation)

1. ~500 candidats depuis Meilisearch (récents, pas vus, pas bloqués).
2. Score via Culture Engine (`scoreFeed`).
3. Tri décroissant + **minimum 30 % de diversité** (hors bulle).
4. Cache Redis `feed:foryou:{userId}` TTL 15 min.

### Lecture "Popular" / "New"

- **Popular** : `P-ENG` + `P-FR` dominants (pas de personnalisation sociale).
- **New** : chronologique inverse (`P-FR`).

## Cache & trim

- `feed:following:{userId}` : ZSET sans TTL, **trim à 1000 posts**.
- `feed:foryou:{userId}` : STRING JSON, TTL 15 min.
- `post:{id}` : HASH, TTL 30 min.

## Compteurs

- Likes/comments/views : `INCR post:{id}:{metric}` (Redis).
- Flush **batch toutes les 5 min** vers PG (worker `counters.flush`).
- PG = référence, Redis = temps réel.

## Backfill & règles métier

- Posts bloqués / users bloqués / `status != published` → exclus.
- Feed vide → backfill (posts populaires récents).
- Créateur du post → pas de notification à soi-même.

## Scalabilité

Le modèle push tient jusqu'à ~10 k followers/auteur ; au-delà → pull.
Tout le détail est dans [`../scalability/feed.md`](../scalability/feed.md) et l'ADR [`../decisions/adr-003-feed.md`](../decisions/adr-003-feed.md).
