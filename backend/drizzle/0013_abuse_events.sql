CREATE TABLE IF NOT EXISTS "abuse_events" (
  "id" text PRIMARY KEY NOT NULL,
  "actor_id" text NOT NULL,
  "conversation_id" text,
  "event_type" text NOT NULL,
  "risk" text NOT NULL,
  "reasons" text NOT NULL,
  "content_fingerprint" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "abuse_events_actor_idx" ON "abuse_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "abuse_events_created_idx" ON "abuse_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "abuse_events_risk_idx" ON "abuse_events" USING btree ("risk");--> statement-breakpoint
ALTER TABLE "abuse_events" ADD CONSTRAINT "abuse_events_actor_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE;
