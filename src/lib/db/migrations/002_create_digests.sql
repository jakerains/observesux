-- Migration: Create digests table for "What You Need to Know, Siouxland" feature
-- This is a shared community digest (not per-user)

CREATE TABLE IF NOT EXISTS digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition TEXT NOT NULL CHECK (edition IN ('morning', 'midday', 'evening')),
  date DATE NOT NULL,
  content TEXT NOT NULL,
  data_snapshot JSONB,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(edition, date)
);

-- Index for efficient queries by date and edition
CREATE INDEX IF NOT EXISTS idx_digests_date_edition ON digests(date DESC, edition);

-- Comments for documentation
COMMENT ON TABLE digests IS 'AI-generated community newsletter digests';
COMMENT ON COLUMN digests.edition IS 'Edition type: morning, midday, or evening';
COMMENT ON COLUMN digests.date IS 'Date of the digest (YYYY-MM-DD)';
COMMENT ON COLUMN digests.content IS 'Markdown-formatted digest content';
COMMENT ON COLUMN digests.data_snapshot IS 'JSON snapshot of all data sources at generation time';
COMMENT ON COLUMN digests.generation_time_ms IS 'Time taken to generate the digest in milliseconds';
