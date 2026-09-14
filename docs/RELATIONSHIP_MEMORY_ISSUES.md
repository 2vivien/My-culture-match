# Relationship Memory — Issues / Hardening Backlog

## P0 — before production

- [ ] Add automated tests for participant authorization.
- [ ] Add tests for Love vs Friendship classification.
- [ ] Add tests proving deleted messages are never surfaced as evidence.
- [ ] Add database migration to the project's Drizzle journal if the migration runner requires explicit journal registration.
- [ ] Verify the migration against a real PostgreSQL instance.
- [ ] Run backend typecheck/build and frontend typecheck/build.

## P1 — memory quality

- [ ] Replace lexical sentiment with calibrated multilingual contextual models.
- [ ] Add response-delay and session segmentation features.
- [ ] Add semantic topic embeddings.
- [ ] Add recurring phrase / inside-joke detection with privacy controls.
- [ ] Add change-point detection for relationship phases.
- [ ] Add user confirmation of important memories.
- [ ] Add memory deduplication and event clustering.
- [ ] Add event-level decay and re-ranking.

## P1 — media

- [ ] Integrate the existing upload service instead of accepting arbitrary media URLs.
- [ ] Generate thumbnails for photo memories.
- [ ] Generate safe video previews.
- [ ] Add media moderation before memory inclusion.

## P1 — product

- [ ] 1-month recap.
- [ ] 3-month recap.
- [ ] 6-month recap.
- [ ] Annual Love Story.
- [ ] Friendship yearly recap.
- [ ] Best moments compilation.
- [ ] "What changed" comparison between periods.
- [ ] Export relationship story.

## P2 — AI narration

- [ ] Build evidence packet.
- [ ] Add structured-output LLM prompt.
- [ ] Require every narrative claim to reference an event ID.
- [ ] Add uncertainty language.
- [ ] Add hallucination evaluation.
- [ ] Never use the LLM to decide responsibility or consent.

## P2 — privacy controls

- [ ] Relationship memory opt-in / opt-out.
- [ ] Delete one memory.
- [ ] Delete all memories.
- [ ] Clear capsules.
- [ ] Per-person shared-memory consent.
- [ ] Export and portability.
- [ ] Retention policy.

## P2 — scalability

- [ ] Move full rebuilds to BullMQ workers.
- [ ] Incremental feature updates per message.
- [ ] Redis cache for timeline summaries.
- [ ] Partition / archive very large conversations.
- [ ] Precompute anniversary recaps.
- [ ] Add Prometheus metrics: memory_run_duration, events_detected, evidence_validity, rebuild_failures.

## Product safety rule

Never convert a statistical pattern into a moral judgment. For example, "A sent 70% of the messages" is valid; "A cared more" is not an algorithmic fact.
