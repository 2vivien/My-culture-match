ALTER TABLE relationship_memories ADD COLUMN IF NOT EXISTS embedding JSONB;
ALTER TABLE relationship_memories ADD COLUMN IF NOT EXISTS phase_key TEXT;
ALTER TABLE relationship_memories ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION NOT NULL DEFAULT 0.5;
ALTER TABLE relationship_memories ADD COLUMN IF NOT EXISTS algorithm_version TEXT NOT NULL DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS relationship_memories_phase_idx ON relationship_memories(conversation_id, phase_key, occurred_at DESC);

CREATE TABLE IF NOT EXISTS relationship_memory_phases (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  phase_key TEXT NOT NULL,
  label TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  activity_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  topic_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  embedding JSONB,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  algorithm_version TEXT NOT NULL DEFAULT 'v2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, phase_key)
);

CREATE INDEX IF NOT EXISTS relationship_memory_phases_conversation_idx ON relationship_memory_phases(conversation_id, started_at ASC);

CREATE TABLE IF NOT EXISTS relationship_memory_recaps (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('love','friendship')),
  period_key TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  evidence_memory_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, period_key)
);

CREATE INDEX IF NOT EXISTS relationship_memory_recaps_conversation_idx ON relationship_memory_recaps(conversation_id, period_start DESC);