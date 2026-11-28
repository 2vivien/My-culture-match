-- La table user_location_settings n'était créée que par drizzle/people-nearby-location.sql, un fichier SQL hors
-- journal : une base montée avec « npm run migrate » ne l'avait pas (toutes les fonctions de position y échouaient).
-- Création idempotente : sans effet sur une base qui l'a déjà.
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
CREATE INDEX IF NOT EXISTS user_location_settings_visibility_idx ON user_location_settings(visibility);

-- Audience de partage de position : « par défaut » (visibilité), « sélection » (liste choisie) ou « tous sauf… ».
ALTER TABLE user_location_settings ADD COLUMN IF NOT EXISTS audience_mode TEXT NOT NULL DEFAULT 'default';

CREATE TABLE IF NOT EXISTS location_audience (
  owner_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, member_id)
);
CREATE INDEX IF NOT EXISTS location_audience_member_idx ON location_audience(member_id);
