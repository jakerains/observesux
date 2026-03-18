-- Add meeting_type to council_meetings for community meeting support
-- (budget sessions, school board, planning & zoning, special sessions, etc.)
-- Defaults to 'city_council' so all existing records are unaffected.

ALTER TABLE council_meetings
  ADD COLUMN IF NOT EXISTS meeting_type VARCHAR(30) NOT NULL DEFAULT 'city_council';

CREATE INDEX IF NOT EXISTS idx_council_meetings_meeting_type
  ON council_meetings(meeting_type);
