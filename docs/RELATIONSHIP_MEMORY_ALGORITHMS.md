# Relationship Memory — Algorithms

## 1. Objective

Build a reliable analytical layer before adding an LLM.

The system should answer measurable questions:

- Who wrote first?
- Who replied first?
- Who initiates most conversations?
- How reciprocal is the conversation?
- What subjects recur?
- When are conversations most intense?
- What are the longest exchanges?
- What media types appear first?
- Are positive or tension lexical signals concentrated in a period?
- What changed in conversation rhythm over time?

## 2. Temporal features

For each conversation:

- message count
- active days
- messages/day
- messages/week
- median response delay
- p90 response delay
- conversation burst count
- burst duration
- longest continuous burst
- inactivity periods
- reactivation after inactivity

Response delay:

`delay_i = createdAt(message_i) - createdAt(previous_message)`

Burst detection can use a configurable threshold such as 2 hours.

## 3. Reciprocity

For two participants A and B:

`P_A = messages_A / messages_total`

`P_B = messages_B / messages_total`

Participation balance:

`balance = min(P_A, P_B) / max(P_A, P_B)`

The value is 0–1. It is not a relationship-quality score; it only describes conversational participation.

## 4. Initiation

A conversation session is started after a configurable inactivity threshold.

The initiator is the sender of the first message in that session.

Features:

- initiation share A/B
- streaks
- recent initiation trend
- first-message identity

## 5. Topic extraction

V1 uses lexical TF-IDF-like salience.

For term `t`:

`tf(t) = occurrences(t)`

`idf(t) = log(1 + N / df(t))`

`score(t) = tf(t) * idf(t)`

This is deliberately simple and deterministic. Future versions can add multilingual sentence embeddings and clustering.

## 6. Message-type analysis

Track first occurrence and distribution of:

- text
- image
- voice
- file

Examples:

- first photo
- first voice note
- first shared file
- media-heavy day

## 7. Lexical positive / tension signals

V1 uses small transparent lexicons.

This is a weak signal only. It must never be presented as psychological diagnosis or proof of emotion.

Positive score:

`positive = count(tokens in positive_lexicon)`

Tension score:

`tension = count(tokens in tension_lexicon)`

Future versions should use calibrated multilingual sentiment models and contextual negation handling.

## 8. Importance score

A memory candidate can combine:

`I = 0.25 temporal + 0.20 rarity + 0.20 conversational_intensity + 0.15 reciprocity + 0.10 media_significance + 0.10 user_confirmation`

V1 stores a manually assigned importance based on event type. This formula is the target for V2.

## 9. Confidence

Confidence should describe evidence quality, not emotional certainty.

Examples:

- first message: 0.99
- first media: 0.98
- dominant topic: 0.76
- lexical positive event: ~0.70
- tension signal: ~0.62

Future confidence should be calibrated on labeled event datasets.

## 10. Future mathematical models

### Embeddings

Use multilingual sentence embeddings for semantic similarity between messages and topics.

### Topic clustering

`cosine_similarity(v_i, v_j)` for message embeddings.

Cluster with HDBSCAN / spherical k-means depending scale.

### Change-point detection

Detect structural changes in message frequency or topic distribution using Bayesian online change-point detection or CUSUM-like methods.

### Graph model

Represent relationship interaction as a temporal directed graph:

`G_t = (V, E_t)`

where an edge weight aggregates interaction intensity and recency.

### Hawkes process (future research)

Model self-exciting conversation activity:

`lambda_i(t) = mu_i + sum_j alpha_ij exp(-beta(t - t_j))`

This can estimate conversational momentum, but must not be interpreted as emotional causality.

### Sequential models

Future options:

- Temporal Transformer
- TCN
- HMM for conversation phases
- state-space models

These should consume extracted features, not replace evidence storage.

## 11. LLM layer — future

The LLM receives a structured evidence packet:

```json
{
  "relationshipType": "love",
  "events": [],
  "capsules": [],
  "stats": {},
  "evidence": []
}
```

It returns narrative copy only.

It must not:

- invent dates
- assign blame
- diagnose emotions
- reveal deleted message content
- infer consent
- claim certainty where confidence is low

## 12. Evaluation

Create a human-labeled benchmark of relationship events:

- first
- milestone
- positive
- difficult
- topic
- media
- turning point

Metrics:

- precision
- recall
- F1
- calibration error
- evidence validity
- hallucination rate
- deletion-respect rate

The most important guardrail is evidence validity: every surfaced event must map to valid retained evidence or an explicit user-created capsule.
