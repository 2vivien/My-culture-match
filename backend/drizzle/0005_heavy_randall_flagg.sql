CREATE UNIQUE INDEX "tribes_name_unique_idx" ON "tribes" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tribes_tag_unique_idx" ON "tribes" USING btree ("tag");