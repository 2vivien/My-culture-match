# Relationship Memory — API Contract

All endpoints require authenticated conversation participation.

## GET `/api/conversations/:id/relationship-timeline`

Returns:

```json
{
  "relationshipType": "love | friendship",
  "memories": [],
  "capsules": []
}
```

## POST `/api/conversations/:id/relationship-memory/rebuild`

Re-runs the deterministic memory extractor.

Returns:

```json
{
  "relationshipType": "love",
  "memories": [],
  "messageCount": 123
}
```

This operation is safe to repeat. Current V1 replaces generated memories for the conversation.

## POST `/api/conversations/:id/relationship-capsules`

Body:

```json
{
  "title": "Notre journée au campus",
  "body": "Aujourd'hui nous avons...",
  "mediaUrls": ["https://..."],
  "eventDate": "2026-09-14T10:00:00.000Z"
}
```

At least a body or one media URL is required.

## Security rules

- authenticated user only
- user must be a conversation participant
- relationship type is derived server-side from the conversation
- no client-provided relationship type is trusted
- no deleted message content is returned by the memory engine
- evidence IDs remain internal to the UI contract unless a future consented evidence viewer is added
