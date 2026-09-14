# Relationship Memory — Data Model

## relationship_memories

One algorithmically detected event.

| Field | Meaning |
|---|---|
| id | event identifier |
| conversation_id | source chat |
| relationship_type | love / friendship |
| kind | first / milestone / positive / tension / rhythm / shared_interest / media / turning_point |
| title | short UI title |
| summary | evidence-backed description |
| occurred_at | event date |
| actor_user_id | responsible sender when objectively known |
| evidence_message_ids | supporting message IDs |
| metadata | numerical and categorical features |
| confidence | evidence confidence 0–1 |
| importance | ranking weight 0–1 |
| source | algorithm / user / future_ai |

## relationship_capsules

Human-created memory entries.

A capsule intentionally differs from a normal chat message. It is a saved memory object that can contain a note and media.

## relationship_memory_runs

Stores the latest analysis state and algorithm version. This enables incremental processing and reproducibility later.

## Relationship classification

The backend derives `love` when the conversation has a mutual Love match. Otherwise it is currently treated as `friendship`.

This keeps the client from being able to label an ordinary conversation as romantic.

## Future vector store

The relational tables remain the source of truth. Semantic vectors can later live in a dedicated vector store or PostgreSQL vector extension, with references back to event IDs.
