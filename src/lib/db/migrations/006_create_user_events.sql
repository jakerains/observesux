-- Migration: Create user_events table for community-submitted events
-- Separate from scraped community_events (which uses TTL cache pattern)

CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  description TEXT,
  url TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_by TEXT NOT NULL,
  submitted_by_email TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_events_status ON user_events(status);
CREATE INDEX IF NOT EXISTS idx_user_events_submitted_by ON user_events(submitted_by);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(date);
CREATE INDEX IF NOT EXISTS idx_user_events_category ON user_events(category);
