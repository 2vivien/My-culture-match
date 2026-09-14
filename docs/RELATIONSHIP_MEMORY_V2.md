# Relationship Intelligence V2 + Boîte à souvenirs

Relationship Memory is the shared memory layer of every two-person Love or Friendship conversation. It has two complementary sources:

1. **Automatic memories** extracted from retained chat data by deterministic algorithms.
2. **Boîte à souvenirs**, a shared two-person notebook where either participant can save anything they want to keep.

## Product model

```text
CHAT À DEUX
   │
   ├── messages / media
   │       ↓
   │   algorithmic memories
   │
   └── Boîte à souvenirs
           ├── note
           ├── photo
           ├── vidéo
           ├── audio
           ├── événement
           ├── lieu
           ├── étape importante
           ├── conversation
           ├── moment libre
           └── autre
                 ↓
          RELATIONSHIP TIMELINE
                 ↓
       1m / 3m / 6m / 1y recaps
                 ↓
          optional LLM narration
```

The box is **not a private personal notebook**. It belongs to the conversation and is visible to its participants. Both people can add and maintain entries. The author is retained for attribution, while the memory remains part of the shared relationship history.

## Boîte à souvenirs

A memory entry can contain any combination of:

- title
- free-form note
- one or many media URLs
- selected message IDs
- date/time of the moment
- memory type
- structured metadata

It deliberately does not require the system to decide whether a moment is important. A user can preserve something simply because it matters to them.

CRUD API:

- `GET /api/conversations/:id/memory-box`
- `POST /api/conversations/:id/memory-box`
- `PATCH /api/conversations/:id/memory-box/:memoryId`
- `DELETE /api/conversations/:id/memory-box/:memoryId`

Authorization is conversation-participant based. A participant cannot access another conversation's memory box.

## Relationship Intelligence V2

V2 is the analytical layer between chat data and future narration.

```text
messages
  -> clean retained messages
  -> temporal segmentation
  -> phases
  -> multilingual embeddings
  -> semantic similarity
  -> event candidates
  -> mathematical importance score
  -> evidence + confidence
  -> timeline
  -> period recap
  -> optional LLM narration
```

Manual memories are deliberately separate from algorithmic memories at storage/API level, but they belong to the same relationship history. They can later be incorporated into recap evidence and ranking without pretending that a manually saved memory was algorithmically detected.

## Embeddings

The backend uses an OpenAI-compatible embeddings endpoint when configured:

- `RELATIONSHIP_EMBEDDING_API_KEY`
- `RELATIONSHIP_EMBEDDING_MODEL`
- `RELATIONSHIP_EMBEDDING_BASE_URL` (optional)

Without credentials, V2 uses a deterministic 96-dimensional lexical vector fallback. This keeps development and tests functional but is **not** equivalent to a multilingual neural embedding model.

## Phase segmentation

Conversation phases are detected from temporal gaps. The gap threshold adapts to the median response gap and is bounded between 48 hours and 14 days.

Each phase stores:

- start/end
- message count
- activity score
- topic terms
- embedding
- confidence
- algorithm version

## Moment scoring

The V2 importance score combines:

- activity/intensity
- semantic relevance
- reciprocity
- positive-vs-tension signal
- conversation density

The score is a ranking signal, not a statement about how much a person cared.

## Recaps

Supported periods:

- 1 month
- 3 months
- 6 months
- 1 year

The LLM is optional. Without it, the system returns an evidence-based deterministic recap. With it, the model receives structured memory evidence and produces narrative text.

The LLM is forbidden from inventing dates, facts, feelings, responsibility, consent or deleted-message content.

## Storage

- `0014_relationship_memory.sql`: relationship memories and original capsules.
- `0015_relationship_memory_v2.sql`: embeddings, phases, semantic scores and recaps.
- `0017_shared_memory_box.sql`: shared notebook fields for memory type, selected messages, metadata and shared editing attribution.

## UI

The relationship panel is now explicitly presented as **Boîte à souvenirs**. It contains:

- **Boîte à souvenirs**: the shared notebook with all user-created entries.
- **Notre histoire**: algorithmic timeline and period recaps.
- Add entry flow with type, date, title, note and multiple media URLs.
- Delete entry from the shared notebook.

The box and the timeline intentionally remain connected: the box is the human-authored layer, while the timeline is the analytical layer.
