CREATE TABLE IF NOT EXISTS temporal_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type message_type NOT NULL DEFAULT 'text',
  text TEXT,
  media_url TEXT,
  audio_dur INTEGER,
  file JSONB,
  reveal_at TIMESTAMPTZ NOT NULL,
  revealed_at TIMESTAMPTZ,
  revealed_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT temporal_messages_participants_check CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS temporal_messages_due_idx
  ON temporal_messages(reveal_at)
  WHERE revealed_at IS NULL AND cancelled_at IS NULL;

CREATE INDEX IF NOT EXISTS temporal_messages_sender_idx
  ON temporal_messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS temporal_messages_recipient_idx
  ON temporal_messages(recipient_id, reveal_at DESC);

CREATE INDEX IF NOT EXISTS temporal_messages_conversation_idx
  ON temporal_messages(conversation_id, reveal_at DESC);
