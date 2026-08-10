CREATE TABLE "health_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"metric" text NOT NULL,
	"value" double precision NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"day" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "moderator_id" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "resolution" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
CREATE UNIQUE INDEX "health_metrics_metric_day_idx" ON "health_metrics" USING btree ("metric","day");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;