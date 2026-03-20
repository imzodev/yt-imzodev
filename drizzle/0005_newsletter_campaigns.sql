-- Migration: Newsletter Campaigns and Analytics
-- Creates tables for managing email campaigns and tracking analytics

CREATE TABLE IF NOT EXISTS "newsletter_campaigns" (
  "id" serial PRIMARY KEY,
  "subject" text NOT NULL,
  "content" text NOT NULL,
  "template" text DEFAULT 'default',
  "status" text DEFAULT 'draft',
  "scheduled_at" timestamp,
  "sent_at" timestamp,
  "recipient_count" integer DEFAULT 0,
  "open_count" integer DEFAULT 0,
  "click_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "newsletter_campaigns_status_idx" ON "newsletter_campaigns" ("status");
CREATE INDEX IF NOT EXISTS "newsletter_campaigns_scheduled_at_idx" ON "newsletter_campaigns" ("scheduled_at");

CREATE TABLE IF NOT EXISTS "newsletter_analytics" (
  "id" serial PRIMARY KEY,
  "campaign_id" integer NOT NULL REFERENCES "newsletter_campaigns"("id"),
  "subscriber_id" integer NOT NULL REFERENCES "newsletter_subscriptions"("id"),
  "event_type" text NOT NULL,
  "metadata" json,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "newsletter_analytics_campaign_id_idx" ON "newsletter_analytics" ("campaign_id");
CREATE INDEX IF NOT EXISTS "newsletter_analytics_subscriber_id_idx" ON "newsletter_analytics" ("subscriber_id");
CREATE INDEX IF NOT EXISTS "newsletter_analytics_event_type_idx" ON "newsletter_analytics" ("event_type");
