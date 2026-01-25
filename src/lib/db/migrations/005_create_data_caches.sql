-- Migration: Create cache tables for rivers, air quality, and weather
-- These reduce API calls by caching data for short periods

-- River gauge readings cache (30 minute TTL)
CREATE TABLE IF NOT EXISTS river_cache (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL UNIQUE,
  site_name TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  gauge_height NUMERIC,
  discharge NUMERIC,
  water_temp NUMERIC,
  flood_stage TEXT,
  action_stage NUMERIC,
  flood_stage_level NUMERIC,
  moderate_flood_stage NUMERIC,
  major_flood_stage NUMERIC,
  observation_time TIMESTAMPTZ,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_river_cache_expires ON river_cache(expires_at);

-- Air quality readings cache (60 minute TTL - AQI updates hourly)
CREATE TABLE IF NOT EXISTS air_quality_cache (
  id SERIAL PRIMARY KEY,
  site_name TEXT NOT NULL,
  aqi INTEGER,
  category TEXT,
  pollutant TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  reporting_area TEXT,
  observation_time TIMESTAMPTZ,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
  UNIQUE(site_name, reporting_area)
);

CREATE INDEX IF NOT EXISTS idx_air_quality_cache_expires ON air_quality_cache(expires_at);

-- Weather observations cache (15 minute TTL)
CREATE TABLE IF NOT EXISTS weather_cache (
  id SERIAL PRIMARY KEY,
  station_id TEXT NOT NULL UNIQUE,
  station_name TEXT,
  observation_time TIMESTAMPTZ,
  temperature NUMERIC,
  humidity INTEGER,
  wind_speed NUMERIC,
  wind_direction TEXT,
  wind_gust NUMERIC,
  pressure NUMERIC,
  visibility NUMERIC,
  conditions TEXT,
  icon TEXT,
  dewpoint NUMERIC,
  heat_index NUMERIC,
  wind_chill NUMERIC,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);

-- Weather forecast cache (30 minute TTL)
CREATE TABLE IF NOT EXISTS forecast_cache (
  id SERIAL PRIMARY KEY,
  grid_id TEXT NOT NULL,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  periods JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  UNIQUE(grid_id, grid_x, grid_y)
);

CREATE INDEX IF NOT EXISTS idx_forecast_cache_expires ON forecast_cache(expires_at);

-- Comments
COMMENT ON TABLE river_cache IS 'Cached USGS river gauge readings (30 min TTL)';
COMMENT ON TABLE air_quality_cache IS 'Cached AirNow air quality data (60 min TTL)';
COMMENT ON TABLE weather_cache IS 'Cached NWS weather observations (15 min TTL)';
COMMENT ON TABLE forecast_cache IS 'Cached NWS forecast periods (30 min TTL)';
