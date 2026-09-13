CREATE TABLE IF NOT EXISTS "consent_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE,
  "discovery_visibility" text NOT NULL DEFAULT 'everyone',
  "request_visibility" text NOT NULL DEFAULT 'everyone',
  "love_like_visibility" text NOT NULL DEFAULT 'everyone',
  "contact_visibility" text NOT NULL DEFAULT 'companions',
  "profile_visibility" text NOT NULL DEFAULT 'everyone',
  "photos_visibility" text NOT NULL DEFAULT 'everyone',
  "country_visibility" text NOT NULL DEFAULT 'everyone',
  "friendship_enabled" boolean NOT NULL DEFAULT true,
  "love_enabled" boolean NOT NULL DEFAULT false,
  "love_proposal_enabled" boolean NOT NULL DEFAULT true,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_settings_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_discovery_visibility_check" CHECK ("discovery_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_request_visibility_check" CHECK ("request_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_love_like_visibility_check" CHECK ("love_like_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_contact_visibility_check" CHECK ("contact_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_profile_visibility_check" CHECK ("profile_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_photos_visibility_check" CHECK ("photos_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_country_visibility_check" CHECK ("country_visibility" IN ('nobody','friends','friends_of_friends','nearby','everyone'));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consent_settings_user_idx" ON "consent_settings" USING btree ("user_id");
