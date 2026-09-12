-- ─────────────────────────────────────────────────────────────
-- Seed positions géographiques (démo Friends Proximity, style Snap Map)
-- Run: docker exec -i mcm_postgres psql -U mcm -d mcm < backend/scripts/seed-geolocation.sql
-- Active le partage de position des users mock autour de Cotonou pour que
-- la carte /api/connections/nearby montre des amis.
-- ─────────────────────────────────────────────────────────────

-- Aïcha (Dakar) — partage activé
UPDATE users SET
  latitude = 14.7167, longitude = -17.4677,
  location_sharing_enabled = true,
  location_updated_at = now() - interval '12 minutes'
WHERE name = 'Aïcha';

-- Awa (Douala) — partage activé
UPDATE users SET
  latitude = 4.0511, longitude = 9.7679,
  location_sharing_enabled = true,
  location_updated_at = now() - interval '35 minutes'
WHERE name = 'Awa';

-- Yamato (Osaka) — partage activé
UPDATE users SET
  latitude = 34.6937, longitude = 135.5023,
  location_sharing_enabled = true,
  location_updated_at = now() - interval '2 hours'
WHERE name = 'Yamato';

-- Autre (Abidjan) — partage activé
UPDATE users SET
  latitude = 5.3599, longitude = -4.0083,
  location_sharing_enabled = true,
  location_updated_at = now() - interval '18 minutes'
WHERE name = 'Autre';

-- vivien (Cotonou) — partage activé (c'est la position "me" de la carte)
UPDATE users SET
  latitude = 6.3703, longitude = 2.3912,
  location_sharing_enabled = true,
  location_updated_at = now()
WHERE username = 'agueoundev3443';
