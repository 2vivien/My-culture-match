-- Événements : publics (lieu culturel modéré), de tribu (membres) ou entre amis (compagnons), avec réponses.
CREATE TABLE IF NOT EXISTS events (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ,
  visibility     TEXT NOT NULL CHECK (visibility IN ('public', 'tribe', 'friends')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  organizer_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tribe_id       TEXT REFERENCES tribes(id) ON DELETE CASCADE,
  place_id       TEXT REFERENCES cultural_places(id) ON DELETE SET NULL,
  location_label TEXT,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_geo_idx ON events(latitude, longitude) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS events_start_idx ON events(starts_at);
CREATE INDEX IF NOT EXISTS events_organizer_idx ON events(organizer_id, created_at);
CREATE INDEX IF NOT EXISTS events_tribe_idx ON events(tribe_id) WHERE tribe_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('going', 'interested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_rsvps_user_idx ON event_rsvps(user_id);
