# Relationship Memory — Master Specification

## 1. Product

Relationship Memory is the memory layer of My Culture Match. It turns long-running conversations into a chronological, explainable history.

There are two relationship modes:

- **Love** → `Love Story`: a richer romantic timeline with milestones, firsts, turning points, positive moments, difficult periods, shared rituals and annual recaps.
- **Friendship** → `Friendship Timeline`: the same analytical foundation, but without romantic assumptions or romantic labels.

The feature lives directly inside each chat through **Notre histoire**.

## 2. Memory model

```text
CHAT
  ├── text messages
  ├── images / voice / files
  ├── timestamps
  ├── sender identity
  ├── reply / edit / soft-delete state
  └── interaction rhythm
          ↓
MESSAGE NORMALIZATION
          ↓
FEATURE EXTRACTION
  ├── temporal
  ├── linguistic
  ├── conversational
  ├── media
  ├── reciprocity
  └── topic signals
          ↓
EVENT DETECTION
          ↓
EVIDENCE + CONFIDENCE
          ↓
RELATIONSHIP MEMORY
          ↓
TIMELINE / CAPSULES / RECAPS
          ↓
OPTIONAL LLM NARRATION (future)
```

## 3. Hard rule: algorithm first, LLM second

The LLM must never be the source of truth. Version 1 uses deterministic algorithms to detect candidate memories. A future LLM may rewrite several verified events into natural language, but it cannot invent dates, blame, feelings, intentions or events without evidence.

Every generated event stores:

- evidence message IDs
- occurrence date
- actor when known
- confidence
- importance
- algorithm version
- source

## 4. What is remembered

### Common memory taxonomy

- First meeting / first available conversation
- First message
- First reply
- First media shared
- First voice message
- First long conversation
- First recurring topic
- First strong positive signal
- First difficult signal
- Shared interests / recurring topics
- Conversation rhythm
- Most active day
- Longest message
- Longest conversation burst
- Balanced participation
- Important turning points
- Positive moments
- Difficult moments
- Periods of distance
- Reconnection / return to conversation
- Shared jokes and repeated expressions (future semantic layer)
- Important dates explicitly mentioned in conversation
- User-created capsules

### Love-only product layer

- Love Story milestones
- First romantic declaration when explicitly present in evidence
- First poem / love note when detected
- Relationship anniversary recap
- Monthly / 3-month / 6-month / annual story
- "Why you became close" as an evidence-backed summary
- "What changed" timeline comparison
- "Your best moments" compilation
- Romantic media memories

The backend does not currently infer "fell in love" as a fact. It can mark a candidate turning point and let a future model narrate it with uncertainty.

### Friendship-only product layer

- Friendship Timeline
- First shared interest
- First long conversation
- First shared media
- Strong activity periods
- Recurring subjects
- Shared rituals / jokes when evidence supports them
- Important moments and user-created capsules

No romantic interpretation is added to Friendship Timeline.

## 5. User-created memory capsules

A capsule is a small private/shared note attached to the relationship timeline.

Example:

> Today we studied together on campus. We took two photos and promised to remember this day.

A capsule can contain:

- title
- note
- event date
- photo/video URLs
- author

The capsule is different from normal chat: it is intentionally saved as a memory rather than another message.

## 6. Privacy

The current chat model uses soft deletion for messages. Relationship Memory must not silently resurrect a deleted message in the UI. Derived memories should expose event-level evidence, not hidden deleted content. If the product later changes retention rules, the memory retention/deletion contract must be updated explicitly.

Required future controls:

- memory enabled/disabled
- delete one memory
- delete all relationship memories
- hide evidence
- export relationship memory
- clear capsules
- per-person consent for shared relationship memory

## 7. UX

Chat header → **Notre histoire**.

Panel structure:

1. Relationship identity
2. Timeline
3. User-created capsules
4. Rebuild / refresh analysis
5. Future: recap generator

Love label: **Love Story**.
Friendship label: **Friendship Timeline**.

## 8. Milestones

The system should support these recap periods:

- 1 month
- 3 months
- 6 months
- 1 year
- yearly anniversary

A recap is generated only when sufficient evidence exists.

## 9. Product principle

My Culture Match does not say what a relationship "really was". It shows what the conversation and the users' saved memories support, with uncertainty when needed.
