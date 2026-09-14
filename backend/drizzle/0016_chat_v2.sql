-- Chat V2: replies, edits, reactions and pinning.
-- IF NOT EXISTS keeps this migration safe against earlier schema variants.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS messages_edited_idx ON messages(conversation_id, edited_at);

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, reaction)
);
CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_user_idx ON message_reactions(user_id, created_at);

CREATE TABLE IF NOT EXISTS conversation_pins (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, message_id)
);
CREATE INDEX IF NOT EXISTS conversation_pins_conversation_idx ON conversation_pins(conversation_id, created_at DESC);
