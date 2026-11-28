-- Tribus privées : visibilité + demandes d'adhésion à approuver par un modérateur.
ALTER TABLE tribes ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

CREATE TABLE IF NOT EXISTS tribe_join_requests (
  tribe_id   TEXT NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tribe_id, user_id)
);
CREATE INDEX IF NOT EXISTS tribe_join_requests_tribe_idx ON tribe_join_requests(tribe_id, created_at);
