-- Migration: Add bounce and unsubscribe tracking to newsletter campaigns
-- Adds missing columns for tracking bounces and unsubscribes

ALTER TABLE "newsletter_campaigns" 
ADD COLUMN IF NOT EXISTS "bounce_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "unsubscribe_count" integer DEFAULT 0;
