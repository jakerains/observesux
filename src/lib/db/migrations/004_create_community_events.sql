-- Migration: Create community_events table for caching scraped events
-- Events are cached for up to 7 days to reduce API calls

CREATE TABLE IF NOT EXISTS community_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  url TEXT,
  source TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for efficient querying by source and expiration
CREATE INDEX IF NOT EXISTS idx_community_events_source ON community_events(source);
CREATE INDEX IF NOT EXISTS idx_community_events_expires ON community_events(expires_at);

-- Add comments for documentation
COMMENT ON TABLE community_events IS 'Cached community events from external sources (Firecrawl scraping)';
COMMENT ON COLUMN community_events.source IS 'Source name (e.g., Explore Siouxland, Hard Rock Casino)';
COMMENT ON COLUMN community_events.scraped_at IS 'When the event was scraped from the source';
COMMENT ON COLUMN community_events.expires_at IS 'When the cache expires and needs refresh (default 7 days)';
