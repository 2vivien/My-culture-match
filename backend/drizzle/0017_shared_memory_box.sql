ALTER TABLE relationship_capsules ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'note';
ALTER TABLE relationship_capsules ADD COLUMN IF NOT EXISTS message_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE relationship_capsules ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE relationship_capsules ADD COLUMN IF NOT EXISTS updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE relationship_capsules DROP CONSTRAINT IF EXISTS relationship_capsules_kind_check;
ALTER TABLE relationship_capsules ADD CONSTRAINT relationship_capsules_kind_check
  CHECK (kind IN ('note','photo','video','audio','event','place','milestone','conversation','memory','custom'));

CREATE INDEX IF NOT EXISTS relationship_capsules_kind_idx ON relationship_capsules(conversation_id, kind, event_date DESC);
