# WebSocket — Événements

> Protocole : socket.io. Auth : `handshake.auth.token` ou `Authorization: Bearer`.
> Toute l'architecture est détaillée dans [`../architecture/websocket.md`](../architecture/websocket.md).

## Connexion

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket'],
});
```

## Événements client → serveur

### `join:conversation`

```ts
socket.emit('join:conversation', conversationId);
```
Rejoint la room `conversation:{id}` pour recevoir les messages temps réel.

### `leave:conversation`

```ts
socket.emit('leave:conversation', conversationId);
```

### `typing:start` / `typing:stop`

```ts
socket.emit('typing:start', conversationId);
socket.emit('typing:stop', conversationId);
```

### `message:read`

```ts
socket.emit('message:read', conversationId, messageId);
```

## Événements serveur → client

### `message:new`

```ts
socket.on('message:new', ({ message }) => { … });
```

### `message:read`

```ts
socket.on('message:read', ({ conversationId, messageId, userId }) => { … });
```

### `typing:start` / `typing:stop`

```ts
socket.on('typing:start', ({ conversationId, userId }) => { … });
socket.on('typing:stop', ({ conversationId, userId }) => { … });
```

### `presence:online` / `presence:offline`

```ts
socket.on('presence:online', ({ userId }) => { … });
socket.on('presence:offline', ({ userId }) => { … });
```

### `notification:new`

```ts
socket.on('notification:new', ({ notification }) => { … });
```

### `love:match`

```ts
socket.on('love:match', ({ userId }) => { … });
```

## Pièges courants

- Rejoindre la room **après** le `connect` (sinon messages manqués).
- Les événements `presence:*` sont broadcastés à tous les utilisateurs : filtrer côté client.
- `message:new` n'est émis qu'aux sockets présents dans la room de la conversation ;
  sinon, la notification (`notification:new`) couvre le cas hors-ligne.
