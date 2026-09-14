CREATE TABLE IF NOT EXISTS relationship_memories (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('love','friendship')),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  evidence_message_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  importance DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  source TEXT NOT NULL DEFAULT 'algorithm',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS relationship_memories_conversation_idx ON relationship_memories(conversation_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS relationship_memories_type_idx ON relationship_memories(conversation_id, relationship_type, importance DESC);

CREATE TABLE IF NOT EXISTS relationship_capsules (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('love','friendship')),
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS relationship_capsules_conversation_idx ON relationship_capsules(conversation_id, event_date DESC);

CREATE TABLE IF NOT EXISTS relationship_memory_runs (
  conversation_id TEXT PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  analyzed_message_count INTEGER NOT NULL DEFAULT 0,
  algorithm_version TEXT NOT NULL DEFAULT 'v1',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
