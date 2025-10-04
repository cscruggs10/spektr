-- Migration: Add package fields to runlists table
-- Date: 2025-10-04
-- Description: Add fields to support package-based inspection workflow

-- Add package_name column (friendly name for the inspection package)
ALTER TABLE "runlists" ADD COLUMN "package_name" text;

-- Add assigned_inspector_id column (which inspector should do this package)
ALTER TABLE "runlists" ADD COLUMN "assigned_inspector_id" integer REFERENCES "inspectors"("id");

-- Add package_status column (pending, in_progress, completed)
ALTER TABLE "runlists" ADD COLUMN "package_status" text DEFAULT 'pending';

-- Add is_package column (whether this runlist represents an inspection package)
ALTER TABLE "runlists" ADD COLUMN "is_package" boolean DEFAULT false;

-- Backfill existing runlists as non-packages
UPDATE "runlists"
SET "is_package" = false
WHERE "is_package" IS NULL;
