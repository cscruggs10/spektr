-- Migration: Add auction_start_date and reviewed fields to inspections table
-- Date: 2025-10-02

-- Add auction_start_date column
ALTER TABLE "inspections" ADD COLUMN "auction_start_date" timestamp;

-- Add reviewed column with default false
ALTER TABLE "inspections" ADD COLUMN "reviewed" boolean DEFAULT false NOT NULL;

-- Backfill auction_start_date for existing records
-- Priority: scheduled_date -> completion_date -> created_at
UPDATE "inspections"
SET "auction_start_date" = COALESCE("scheduled_date", "completion_date", "created_at")
WHERE "auction_start_date" IS NULL;

-- Set all existing inspections as unreviewed
UPDATE "inspections"
SET "reviewed" = false
WHERE "reviewed" IS NULL;
