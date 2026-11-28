-- Confidentialité par défaut : une nouvelle personne qui active sa position n'est visible que de ses compagnons.
-- Les réglages existants ne changent pas.
ALTER TABLE user_location_settings ALTER COLUMN visibility SET DEFAULT 'friends';
