-- Notification discrète « quelqu'un est près de toi » : opt-in explicite de la personne qui REÇOIT,
-- désactivé par défaut. Les réglages existants ne changent pas.
ALTER TABLE user_location_settings ADD COLUMN IF NOT EXISTS nearby_notify boolean NOT NULL DEFAULT false;
