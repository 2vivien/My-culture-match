-- Stories géolocalisées : lieu CHOISI par l'auteur, ramené au centre d'une cellule de grille avant stockage.
-- Aucune coordonnée GPS brute n'est conservée.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS place_lat DOUBLE PRECISION;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS place_lon DOUBLE PRECISION;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS place_label TEXT;
CREATE INDEX IF NOT EXISTS stories_place_idx ON stories(place_lat, place_lon) WHERE place_lat IS NOT NULL;
