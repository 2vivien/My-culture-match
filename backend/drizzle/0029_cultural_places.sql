-- Lieux culturels proposés par la communauté, publiés après modération.
CREATE TABLE IF NOT EXISTS cultural_places (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT,
  country          TEXT,
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  rejection_reason TEXT,
  created_by_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cultural_places_geo_idx ON cultural_places(latitude, longitude) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS cultural_places_status_idx ON cultural_places(status, created_at);
CREATE INDEX IF NOT EXISTS cultural_places_creator_idx ON cultural_places(created_by_id, created_at);
