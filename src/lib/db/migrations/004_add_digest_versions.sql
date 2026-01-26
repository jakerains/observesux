-- Migration: Add version support for digests
-- Allows multiple versions of the same edition per day, with one marked as active

-- 1. Add is_active column (defaults to true for new digests)
ALTER TABLE digests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add version number column (auto-incrementing per edition/date)
ALTER TABLE digests ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3. Drop the old unique constraint that prevents multiple versions
ALTER TABLE digests DROP CONSTRAINT IF EXISTS digests_edition_date_key;

-- 4. Create a partial unique index to ensure only ONE active digest per edition/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_digests_active_edition_date
ON digests(edition, date)
WHERE is_active = true;

-- 5. Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_digests_edition_date_version
ON digests(edition, date DESC, version DESC);

-- 6. Set all existing digests as active (they were the only version)
UPDATE digests SET is_active = true WHERE is_active IS NULL;

-- Comments
COMMENT ON COLUMN digests.is_active IS 'Whether this version is the active/published one for its edition/date';
COMMENT ON COLUMN digests.version IS 'Version number within the same edition/date (1, 2, 3...)';
