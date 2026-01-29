-- Migration: Add description column to community_events table
-- Allows storing event descriptions extracted from source pages

ALTER TABLE community_events ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN community_events.description IS 'Event description extracted from source page (e.g., image alt text, subtitles)';
