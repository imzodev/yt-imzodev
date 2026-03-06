CREATE TABLE "forum_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"post_id" integer,
	"reply_id" integer,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open',
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_id" integer NOT NULL,
	"actor_id" integer,
	"post_id" integer,
	"reply_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "forum_follows" ADD CONSTRAINT "forum_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_follows" ADD CONSTRAINT "forum_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reply_id_forum_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."forum_replies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_notifications" ADD CONSTRAINT "forum_notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_notifications" ADD CONSTRAINT "forum_notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_notifications" ADD CONSTRAINT "forum_notifications_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "forum_notifications" ADD CONSTRAINT "forum_notifications_reply_id_forum_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."forum_replies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "forum_follows_pair_idx" ON "forum_follows" USING btree ("follower_id","following_id");
--> statement-breakpoint
CREATE INDEX "forum_follows_follower_idx" ON "forum_follows" USING btree ("follower_id");
--> statement-breakpoint
CREATE INDEX "forum_follows_following_idx" ON "forum_follows" USING btree ("following_id");
--> statement-breakpoint
CREATE INDEX "forum_reports_reporter_idx" ON "forum_reports" USING btree ("reporter_id");
--> statement-breakpoint
CREATE INDEX "forum_reports_post_idx" ON "forum_reports" USING btree ("post_id");
--> statement-breakpoint
CREATE INDEX "forum_reports_reply_idx" ON "forum_reports" USING btree ("reply_id");
--> statement-breakpoint
CREATE INDEX "forum_reports_status_idx" ON "forum_reports" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "forum_notifications_recipient_idx" ON "forum_notifications" USING btree ("recipient_id");
--> statement-breakpoint
CREATE INDEX "forum_notifications_actor_idx" ON "forum_notifications" USING btree ("actor_id");
--> statement-breakpoint
CREATE INDEX "forum_notifications_post_idx" ON "forum_notifications" USING btree ("post_id");
--> statement-breakpoint
CREATE INDEX "forum_notifications_reply_idx" ON "forum_notifications" USING btree ("reply_id");
--> statement-breakpoint
CREATE INDEX "forum_notifications_is_read_idx" ON "forum_notifications" USING btree ("is_read");
