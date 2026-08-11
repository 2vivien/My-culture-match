# ADR-002 — Identifiants : UUID v7

## Contexte
Un réseau social génère des millions d'identifiants. Il faut des IDs globalement uniques,
sans séquence centrale, et qui permettent un tri chronologique (cursors, listes).

## Options étudiées
1. **UUID v7** (retenu) — triable chronologiquement, globalement unique, aléatoire.
2. UUID v4 — aléatoire pur, mais **pas triable** (cursors complexes).
3. Auto-increment (BIGSERIAL) — séquence centrale, non shardable, enumeration possible.
4. Snowflake (Twitter) — excellent mais nécessite un générateur + configuration.

## Décision
**UUID v7** pour toutes les tables (`src/shared/utils/ids.ts`).

## Pourquoi
- Tri chronologique natif → pagination cursor simple (id comme curseur).
- Aucune séquence centrale → écritures parallèles et sharding futur sans collision.
- Standard IETF (RFC 9562), supporté par les libs JS, pas de fork à maintenir.
- Pas d'énumération des ressources (un UUID est imprévisible).

## Conséquences
- Les clés primaires sont des `uuid` (pas de BIGSERIAL).
- Les indexes clusterisés par temps sur les tables chaudes sont naturels (insertion ordonnée).

## Évolution future
Si un jour le volume exige un ID plus court (URLs publiques), on peut ajouter un
`slug` court dérivé du UUID — l'ID interne reste UUID v7.
