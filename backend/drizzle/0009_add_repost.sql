ALTER TYPE "post_type" ADD VALUE 'Repost';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "original_post_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "original_author_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_original_post_id_posts_id_fk" FOREIGN KEY ("original_post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_original_author_id_users_id_fk" FOREIGN KEY ("original_author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
