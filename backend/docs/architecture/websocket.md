# WebSocket — Architecture

## Protocole

- **Bibliothèque** : `socket.io` (v4) + `@socket.io/redis-adapter` (multi-instance).
- **Transport** : HTTP upgrade sur le même port que l'API REST (`env.PORT`).
- **CORS** : `env.FRONTEND_URL`, credentials autorisées.

## Authentification

Chaque socket est authentifié à la connexion via l'**auth handshake** :
`token` dans `handshake.auth` **ou** header `Authorization: Bearer <token>`.
La session est validée par `getSession()` (Redis). En cas d'échec → `UNAUTHORIZED`.

```ts
socket.handshake.auth.token            // recommandé (client socket.io)
socket.handshake.headers.authorization // "Bearer <token>"
```

## Rooms

| Room | Usage |
|---|---|
| `user:{userId}` | Événements ciblés (notifications, matchs, messages entrants) |
| `conversation:{conversationId}` | Messagerie : join au chargement du chat |

## Événements Client → Serveur

| Événement | Payload | Description |
|---|---|---|
| `join:conversation` | `conversationId` | Rejoindre la room de conversation |
| `leave:conversation` | `conversationId` | Quitter la room |
| `typing:start` / `typing:stop` | `conversationId` | Indicateur de frappe |
| `message:read` | `conversationId, messageId` | Accusé de lecture |

> L'envoi de message passe aussi par REST (`POST /api/conversations/:id/messages`) ;
> le serveur émet ensuite `message:new` aux participants.

## Événements Serveur → Client

| Événement | Payload | Description |
|---|---|---|
| `message:new` | `{ message }` | Nouveau message dans la conversation |
| `message:read` | `{ conversationId, messageId, userId }` | Message lu par un participant |
| `typing:start` / `typing:stop` | `{ conversationId, userId }` | Frappe |
| `presence:online` / `presence:offline` | `{ userId }` | Changement de présence (broadcast) |
| `notification:new` | `{ notification }` | Notification in-app |
| `love:match` | `{ userId }` | Match Love mutuel |

## Présence

- Clé Redis `presence:{userId}` = `online`, TTL 120 s.
- Heartbeat client → serveur toutes les 30 s (rafraîchit la TTL).
- Au disconnect : suppression de la clé + broadcast `presence:offline`.
- Helper `isOnline(userId)` utilisé par les notifications (message si offline).

## Scalabilité

L'adaptateur Redis permet de scaler la gateway sur plusieurs nœuds :
un message émis sur un nœud est relayé à tous les sockets via Redis PubSub.
Pas de broadcast massif attendu en V1 ; migrer vers NATS/Kafka si besoin d'un live à 100k+ spectateurs.

## Implémentation

`src/infrastructure/websocket/index.ts` — `initSocketServer(httpServer, redisClient)`.
La liste des événements est documentée dans [`api/websocket-events.md`](../api/websocket-events.md).
