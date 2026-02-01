-- Sioux City Observatory - Database Schema
-- Run this in your Neon database to set up tables

-- Weather observations history (for trend charts)
CREATE TABLE IF NOT EXISTS weather_observations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(10) NOT NULL DEFAULT 'KSUX',
  temperature_f DECIMAL(5,2),
  feels_like_f DECIMAL(5,2),
  humidity INTEGER,
  wind_speed_mph DECIMAL(5,2),
  wind_direction VARCHAR(10),
  wind_gust_mph DECIMAL(5,2),
  conditions TEXT,
  visibility_miles DECIMAL(5,2),
  pressure_mb DECIMAL(7,2),
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- River gauge readings history
CREATE TABLE IF NOT EXISTS river_readings (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(20) NOT NULL,
  site_name VARCHAR(100),
  gauge_height_ft DECIMAL(6,2),
  discharge_cfs DECIMAL(12,2),
  water_temp_f DECIMAL(5,2),
  flood_stage VARCHAR(20),
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Air quality readings history
CREATE TABLE IF NOT EXISTS air_quality_readings (
  id SERIAL PRIMARY KEY,
  latitude DECIMAL(9,6) DEFAULT 42.5,
  longitude DECIMAL(9,6) DEFAULT -96.4,
  aqi INTEGER,
  category VARCHAR(50),
  primary_pollutant VARCHAR(20),
  pm25 DECIMAL(6,2),
  pm10 DECIMAL(6,2),
  ozone DECIMAL(6,4),
  source VARCHAR(50),
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather alerts history
CREATE TABLE IF NOT EXISTS weather_alerts (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20),
  certainty VARCHAR(20),
  urgency VARCHAR(20),
  headline TEXT,
  description TEXT,
  instruction TEXT,
  area_desc TEXT,
  effective_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic incidents history
CREATE TABLE IF NOT EXISTS traffic_incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(100),
  event_type VARCHAR(50),
  severity VARCHAR(20),
  road_name VARCHAR(200),
  description TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health/API status logs
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'timeout'
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weather_obs_time ON weather_observations(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_river_site_time ON river_readings(site_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_air_quality_time ON air_quality_readings(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_expires ON weather_alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_traffic_time ON traffic_incidents(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service_name, created_at DESC);

-- Gas stations (updated daily via Firecrawl from GasBuddy)
CREATE TABLE IF NOT EXISTS gas_stations (
  id SERIAL PRIMARY KEY,
  brand_name VARCHAR(100) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_name, street_address)
);

-- Gas prices (multiple fuel types per station)
CREATE TABLE IF NOT EXISTS gas_prices (
  id SERIAL PRIMARY KEY,
  station_id INTEGER REFERENCES gas_stations(id) ON DELETE CASCADE,
  fuel_type VARCHAR(20) NOT NULL,
  price DECIMAL(5,3) NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for gas prices queries
CREATE INDEX IF NOT EXISTS idx_gas_prices_scraped ON gas_prices(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_gas_prices_station ON gas_prices(station_id);
CREATE INDEX IF NOT EXISTS idx_gas_stations_coords ON gas_stations(latitude, longitude);

-- =====================================================
-- User Profiles (extends Neon Auth user table)
-- =====================================================

-- User profile data for personalization
-- Links to neon_auth.user via user_id
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,  -- References neon_auth.user.id
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated ON user_profiles(updated_at DESC);

-- =====================================================
-- Chat Conversation Tracking
-- =====================================================

-- Chat sessions (one per browser session/conversation)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  tool_calls_count INTEGER DEFAULT 0,
  user_agent TEXT,
  ip_hash VARCHAR(64), -- SHA-256 hash of IP for privacy
  metadata JSONB DEFAULT '{}'
);

-- Individual chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tool_calls JSONB, -- Array of tool names called in this message
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started ON chat_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- =====================================================

-- =====================================================
-- User Suggestions/Feedback
-- =====================================================

CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for suggestions queries
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);

-- =====================================================

-- =====================================================
-- RAG (Retrieval-Augmented Generation) Knowledge Base
-- =====================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG entries with embeddings for semantic search
CREATE TABLE IF NOT EXISTS rag_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimensions
  category VARCHAR(100),
  tags TEXT[],
  source VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for RAG queries
CREATE INDEX IF NOT EXISTS idx_rag_entries_active ON rag_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_rag_entries_category ON rag_entries(category);
CREATE INDEX IF NOT EXISTS idx_rag_entries_created ON rag_entries(created_at DESC);

-- =====================================================

-- Clean up old data (run periodically via cron or pg_cron)
-- DELETE FROM weather_observations WHERE created_at < NOW() - INTERVAL '30 days';
-- DELETE FROM river_readings WHERE created_at < NOW() - INTERVAL '30 days';
-- DELETE FROM air_quality_readings WHERE created_at < NOW() - INTERVAL '30 days';
-- DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '7 days';
-- DELETE FROM gas_prices WHERE scraped_at < NOW() - INTERVAL '7 days';
-- DELETE FROM chat_sessions WHERE started_at < NOW() - INTERVAL '90 days';

-- =====================================================
-- Council Meeting Transcript Ingestion
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_council_meetings_status ON council_meetings(status);
CREATE INDEX IF NOT EXISTS idx_council_meetings_meeting_date ON council_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_council_meetings_video_id ON council_meetings(video_id);
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_video_id ON council_meeting_chunks(video_id);
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_meeting_date ON council_meeting_chunks(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_meeting_id ON council_meeting_chunks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_council_meeting_chunks_embedding
  ON council_meeting_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
