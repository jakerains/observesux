-- Migration: Add summary column to digests table
-- This column was missing from the original schema but is required by saveDigest()

ALTER TABLE digests ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN digests.summary IS 'Short 2-3 sentence summary for widget display';
