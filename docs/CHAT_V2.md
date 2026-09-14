# Chat V2

The My Culture Match chat is now a real conversation surface rather than a send-only UI.

## Core flow

`REST message -> PostgreSQL -> unread Redis -> WebSocket event -> client refresh`

The existing message service remains the source of truth for sending, consent, block checks, abuse inspection, unread counters and relationship-memory refresh. Chat V2 adds interaction primitives on top of it.

## Features

- paginated conversation history
- optimistic sending with rollback on failure
- unread counters and read state
- reply to a specific message
- edit own message during a 15-minute window
- soft delete of own messages
- reactions with toggle semantics
- message pinning per conversation
- typing start/stop events
- enhanced message payloads containing reactions and reply previews
- five quick reactions in the UI
- contextual message actions
- relationship timeline directly from the chat header
- relationship-memory analysis triggered by the existing memory layer
- 5-second active-conversation refresh as a REST fallback for clients without a WebSocket subscription

## New API

- `GET /api/conversations/:id/messages/enhanced`
- `POST /api/conversations/:id/messages/reply`
- `POST /api/conversations/:id/messages/:messageId/reactions`
- `PATCH /api/conversations/:id/messages/:messageId`
- `DELETE /api/conversations/:id/messages/:messageId`
- `POST /api/conversations/:id/typing`
- `POST /api/conversations/:id/messages/:messageId/pin`
- `GET /api/conversations/:id/pins`

The existing message and read endpoints remain backward compatible.

## WebSocket events

- `message:new`
- `message:updated`
- `message:deleted`
- `message:reaction`
- `message:pin`
- `message:read`
- `typing:start`
- `typing:stop`

The frontend currently uses REST polling for active conversations so the chat still works when a WebSocket client is not mounted. A native WebSocket subscription can consume the documented events later without changing the persistence contract.

## Privacy and safety

All V2 mutations require conversation participation. Editing/deleting is restricted to the message author. Existing block, consent and outgoing-abuse checks remain in the primary send path. Deleted messages are represented as deleted rather than re-exposed as original content to relationship-memory narration.
