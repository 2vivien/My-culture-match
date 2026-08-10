CREATE TABLE "post_profile_vectors" (
	"post_id" text PRIMARY KEY NOT NULL,
	"vector" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_profile_vectors" ADD CONSTRAINT "post_profile_vectors_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;