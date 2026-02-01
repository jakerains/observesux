-- Migration 008: Create council meeting tables for transcript ingestion pipeline
-- Depends on: pgvector extension (already enabled from RAG setup)

-- Council meetings: one row per meeting video
CREATE TABLE IF NOT EXISTS council_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  meeting_date DATE,
  video_url TEXT,
  channel_id VARCHAR(30),
  transcript_raw TEXT,
  recap JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'no_captions')),
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Council meeting chunks: timestamped transcript chunks with embeddings
CREATE TABLE IF NOT EXISTS council_meeting_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES council_meetings(id) ON DELETE CASCADE,
  video_id VARCHAR(20) NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER NOT NULL,
  embedding vector(1536),
  source_category VARCHAR(50) NOT NULL DEFAULT 'city_council_meeting',
  meeting_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_id, chunk_index)
);

-- Indexes for council_meetings
CREATE INDEX IF NOT EXISTS idx_council_meetings_status ON council_meetings(status);
CREATE INDEX IF NOT EXISTS idx_council_meetings_meeting_date ON council_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_council_meetings_video_id ON council_meetings(video_id);

-- Indexes for council_meeting_chunks
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_video_id ON council_meeting_chunks(video_id);
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_meeting_date ON council_meeting_chunks(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_meeting_id ON council_meeting_chunks(meeting_id);

-- Vector similarity search index (ivfflat for moderate-size dataset)
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_embedding
  ON council_meeting_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
