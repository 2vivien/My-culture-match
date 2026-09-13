CREATE TABLE IF NOT EXISTS "user_mutes" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "muted_user_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_mutes_pair_unique" UNIQUE ("user_id", "muted_user_id")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_mutes_user_idx" ON "user_mutes" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_target_fk" FOREIGN KEY ("muted_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "moderation_actions" (
  "id" text PRIMARY KEY NOT NULL,
  "target_user_id" text NOT NULL,
  "moderator_id" text,
  "action" text NOT NULL,
  "reason" text NOT NULL,
  "metadata" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_actions_target_idx" ON "moderation_actions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_actions_created_idx" ON "moderation_actions" USING btree ("created_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "moderation_appeals" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "moderation_action_id" text NOT NULL,
  "reason" text NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "reviewer_id" text,
  "resolution" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_appeals_user_idx" ON "moderation_appeals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_appeals_status_idx" ON "moderation_appeals" USING btree ("status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "media_moderation" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "media_url" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "provider" text,
  "score" text,
  "reason" text,
  "reviewed_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "reviewed_at" timestamptz
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_moderation_owner_idx" ON "media_moderation" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_moderation_status_idx" ON "media_moderation" USING btree ("status");
