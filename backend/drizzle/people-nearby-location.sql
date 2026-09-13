CREATE TABLE IF NOT EXISTS user_location_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'nearby' CHECK (visibility IN ('nobody','friends','friends_of_friends','nearby','everyone')),
  precision TEXT NOT NULL DEFAULT 'approximate' CHECK (precision IN ('approximate','area')),
  ghost_mode BOOLEAN NOT NULL DEFAULT FALSE,
  show_distance BOOLEAN NOT NULL DEFAULT TRUE,
  show_active_status BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_location_settings_visibility_idx
  ON user_location_settings(visibility);

INSERT INTO user_location_settings (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_location_settings s WHERE s.user_id = users.id
);
