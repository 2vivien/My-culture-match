# Scalabilité — Feed (push/pull, problème célébrité)

## Pourquoi push (fanout)

Lecture d'un feed "Following" = **O(1)** sur Redis :

```
ZREVRANGE feed:following:{userId} 0..19   (ZSET Redis)
→ hydrate 20 posts (cache)              → réponse en < 20 ms
```

Sans fanout, une page de feed demanderait une requête PG par profil suivi (N+1).

## Le problème célébrité

Un auteur à **500 k followers** génère 500 k ZADD à chaque post → coût mémoire/CPU massif.

## Règle de bascule

```
followers(author) ≤ 10 000  → PUSH  (fanout à la publication)
followers(author) > 10 000  → PULL  (aucun fanout)
```

### Mode PULL (célébrité)

- Les followers n'ont pas l'ID dans leur ZSET.
- À la lecture : fetch des posts de l'auteur directement (cache `author:{id}:posts`),
  fusion avec le ZSET local, tri par timestamp.
- Le seuil est configurable (`CELEBRITY_FOLLOWER_THRESHOLD`).

## Backfill & trim

- ZSET trimé à **1000 posts** par utilisateur (les anciens restent accessibles via pagination PG).
- Feed vide → backfill (posts populaires récents) pour ne jamais afficher une page blanche.

## Mix push + pull (recommandé à terme)

Lecture = fusion des deux sources :
```
ZREVRANGE (timeline push) + ZREVRANGE (timelines pull des célébrités suivies)
→ merge + tri chronologique → page
```

## Monitoring

- Gauge `feed_fanout_ops` (ZADD/s) et latence des jobs `feed.fanout`.
- Taille moyenne des ZSET (mémoire Redis par utilisateur actif).
- Si la mémoire Redis dépasse 80 % → activer le pull plus tôt ou ajouter un nœud.

Voir aussi l'ADR [`../decisions/adr-003-feed.md`](../decisions/adr-003-feed.md).
