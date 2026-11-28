-- Flairs de tribu : étiquettes colorées définies par les modérateurs et posées sur les posts.
CREATE TABLE IF NOT EXISTS tribe_flairs (
  id         TEXT PRIMARY KEY,
  tribe_id   TEXT NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#E27D60',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tribe_flairs_name_unique_idx ON tribe_flairs(tribe_id, lower(name));

ALTER TABLE posts ADD COLUMN IF NOT EXISTS flair_id TEXT REFERENCES tribe_flairs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS posts_flair_idx ON posts(flair_id) WHERE flair_id IS NOT NULL;
