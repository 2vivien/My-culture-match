-- ─────────────────────────────────────────────────────────────
-- 0010 : Géolocalisation (Friends Proximity, style Snap Map)
--  - latitude / longitude (double precision, WGS84)
--  - location_sharing_enabled : l'utilisateur a activé le partage
--  - location_updated_at : fraîcheur de la position
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "users" ADD COLUMN "latitude" double precision;
ALTER TABLE "users" ADD COLUMN "longitude" double precision;
ALTER TABLE "users" ADD COLUMN "location_sharing_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "location_updated_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "users_location_sharing_idx" ON "users" ("location_sharing_enabled");
