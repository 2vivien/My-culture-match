# ADR-005 — Temps réel : socket.io + Redis adapter

## Contexte
Le produit a besoin de messagerie temps réel, notifications in-app et présence.
Il faut un protocole WebSocket simple, multi-instance (horizontal scaling) et bien documenté.

## Options étudiées
1. **socket.io + `@socket.io/redis-adapter`** (retenu)
2. WebSocket natif (Hono WS / uWebSockets)
3. SSE (Server-Sent Events)
4. NATS / Kafka dès V1

## Décision
**socket.io (v4)** avec adaptateur Redis pour la multi-instance.

## Pourquoi
- Gère le transport fallback (long-polling) et les salles/rooms nativement.
- Adaptateur Redis → broadcast sur tous les nœuds (scale-out) avec un seul mécanisme.
- Réutilisé pour : messages, notifications, présence, matchs.
- SSE aurait été plus simple en lecture seule mais ne couvre pas l'émission bidirectionnelle (typing, read).
- NATS/Kafka : surdimensionnés pour le volume V1 (1:1 + notifications ciblées).

## Conséquences
- Un nœud Redis PubSub supplémentaire (duplicate des clients pub/sub).
- Le coût de broadcast massif reste une limite → ne PAS l'utiliser pour un live à 100 k+ spectateurs.

## Évolution future
Migrer vers NATS/Kafka uniquement si besoin de broadcast massif (live events).
