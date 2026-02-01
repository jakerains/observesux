-- Migration 009: Add versioning to council meeting recaps
-- When a meeting is reprocessed, the old recap is snapshotted as a version.
-- The council_meetings row always holds the latest version.

-- Add version column to council_meetings
ALTER TABLE council_meetings ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create versions table for historical snapshots
CREATE TABLE IF NOT EXISTS council_meeting_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES council_meetings(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  recap JSONB,
  transcript_raw TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, version)
);

-- Index for fast version history lookups (newest first)
CREATE INDEX IF NOT EXISTS idx_council_meeting_versions_meeting_version
  ON council_meeting_versions (meeting_id, version DESC);

-- Seed v1 rows for all existing completed meetings
INSERT INTO council_meeting_versions (meeting_id, version, recap, transcript_raw, chunk_count, created_at)
SELECT id, 1, recap, transcript_raw, chunk_count, updated_at
FROM council_meetings
WHERE status = 'completed' AND recap IS NOT NULL
ON CONFLICT (meeting_id, version) DO NOTHING;
