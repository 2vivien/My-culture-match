-- Sanctions de tribu : bannissement (ban) et mise en sourdine (mute), éventuellement temporaires.
CREATE TABLE IF NOT EXISTS tribe_sanctions (
  tribe_id   TEXT NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('ban', 'mute')),
  reason     TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tribe_id, user_id)
);
CREATE INDEX IF NOT EXISTS tribe_sanctions_user_idx ON tribe_sanctions(user_id);
