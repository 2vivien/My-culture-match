-- Audience de partage de position : « par défaut » (visibilité), « sélection » (liste choisie) ou « tous sauf… ».
ALTER TABLE user_location_settings ADD COLUMN IF NOT EXISTS audience_mode TEXT NOT NULL DEFAULT 'default';

CREATE TABLE IF NOT EXISTS location_audience (
  owner_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, member_id)
);
CREATE INDEX IF NOT EXISTS location_audience_member_idx ON location_audience(member_id);
