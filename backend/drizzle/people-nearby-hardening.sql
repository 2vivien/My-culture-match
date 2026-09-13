-- People Nearby hardening: spatial indexes + deterministic privacy constraints.
-- Run after people-nearby-location.sql.
CREATE INDEX IF NOT EXISTS users_latitude_longitude_idx
  ON users(latitude, longitude)
  WHERE location_sharing_enabled = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_location_updated_idx
  ON users(location_updated_at DESC)
  WHERE location_sharing_enabled = TRUE;

CREATE INDEX IF NOT EXISTS blocks_blocked_lookup_idx
  ON blocks(blocked_id, blocker_id);

CREATE INDEX IF NOT EXISTS connections_companion_from_idx
  ON connections(from_user_id, to_user_id)
  WHERE status = 'companion';

CREATE INDEX IF NOT EXISTS connections_companion_to_idx
  ON connections(to_user_id, from_user_id)
  WHERE status = 'companion';
