# Base de données — Indexation

## Stratégie globale

Objectif : **la moindre charge possible sur le primaire PostgreSQL** (Neon).
Les lectures chaudes passent par **Redis** ou **Meilisearch** ; PG est la source de vérité et la couche d'écriture.

## Index PostgreSQL (contraintes & recherche courante)

| Table | Index / contrainte | Raison |
|---|---|---|
| users | `username` UNIQUE, `email` UNIQUE | identification |
| users | `(country)`, `(gender)` | filtres profil / candidats |
| posts | `(authorId, createdAt DESC)` | feed d'un auteur |
| posts | `(status, createdAt DESC)` | feed publiés |
| posts | `tribeId` | posts d'une tribu |
| comments | `(postId, createdAt)` | commentaires paginés |
| notifications | `(userId, createdAt DESC)` | panneau notifications |
| messages | `(conversationId, createdAt)` | historique paginé |
| connections | UNIQUE `(fromId, toId)` | anti-doublon |
| post_likes / saves / shares | UNIQUE `(postId, userId)` | intégrité |
| stories | `expiresAt` | cleanup cron |
| reports | `(status, createdAt)` | file de modération |

Les index sont créés dans les migrations Drizzle (`drizzle/`). Ajoute un index dès qu'une requête
utilise une clause `WHERE`/`ORDER BY` non couverte.

## Cache Redis (lectures chaudes)

| Clé | Type | TTL | Usage |
|---|---|---|---|
| `post:{id}` | HASH | 30 min | hydratation feed |
| `user:{id}` | STRING JSON | 1 h | profils |
| `tribe:{id}` | HASH | 30 min | tribus |
| `feed:following:{userId}` | ZSET | — (trim 1000) | timeline fanout |
| `feed:foryou:{userId}` | STRING JSON | 15 min | feed recom |
| `unread:{userId}` | STRING | — | compteur non-lus |
| `presence:{userId}` | STRING | 120 s | présence |

## Compteurs temps réel

Les compteurs (likes, vues, plays, visiteurs) sont incrémentés dans Redis et **flushés en lot**
vers PG toutes les 5 minutes (worker `counters.flush`, `src/modules/feed/counters.queue.ts`).
La valeur PG est la référence ; Redis fournit la valeur temps réel.

## Recherche full-text (Meilisearch)

- Entités indexées : **users**, **posts**, **tribus**.
- Synchronisation asynchrone via la queue `search.index` (à chaque create/update/delete).
- Reindexation complète possible via un script CLI (à créer si besoin).
- Champs searchable/filterable documentés dans `src/modules/search/search.service.ts`.

## Partitionnement (futur)

Prévu dès le schéma pour les tables chaudes (`notifications`, `messages`, `posts`) :
partitionnement par mois ou par utilisateur + read replicas. Voir [`../scalability/sharding.md`](../scalability/sharding.md).
