# Relationship Intelligence V2

V2 is the production-oriented analytical layer between chat data and future LLM narration.

## Pipeline

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

The LLM is optional. Without it, the system returns an evidence-based deterministic recap. With it, the model receives only structured memory evidence and produces narrative text.

Required recap variables:

- `RELATIONSHIP_RECAP_AI_ENABLED=true`
- `RELATIONSHIP_RECAP_AI_API_KEY`
- `RELATIONSHIP_RECAP_AI_MODEL`
- `RELATIONSHIP_RECAP_AI_BASE_URL` (optional)
- `RELATIONSHIP_RECAP_AI_TIMEOUT_MS` (optional)

The LLM is forbidden from inventing dates, facts, feelings, responsibility, consent or deleted-message content.

## API

- `GET /api/conversations/:id/relationship-timeline`
- `POST /api/conversations/:id/relationship-memory/rebuild`
- `GET /api/conversations/:id/relationship-recaps`
- `POST /api/conversations/:id/relationship-recaps`
- `POST /api/conversations/:id/relationship-capsules`

## Storage

Migration `0015_relationship_memory_v2.sql` adds embeddings, phase keys, semantic scores, phases and recaps.
