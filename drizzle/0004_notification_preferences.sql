-- Notification Preferences table - User preferences for notification types
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "reply_notifications" boolean DEFAULT true,
  "follow_notifications" boolean DEFAULT true,
  "best_answer_notifications" boolean DEFAULT true,
  "report_notifications" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add unique constraint on user_id
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_unique" UNIQUE ("user_id");

-- Add foreign key to users
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE no action;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS "notification_preferences_user_idx" ON "notification_preferences" ("user_id");

-- Insert default preferences for existing users
INSERT INTO "notification_preferences" (user_id, reply_notifications, follow_notifications, best_answer_notifications, report_notifications)
SELECT id, true, true, true, true FROM "users"
WHERE NOT EXISTS (SELECT 1 FROM "notification_preferences" WHERE "notification_preferences".user_id = "users".id);
