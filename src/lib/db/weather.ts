/**
 * Database operations for weather caching
 * Weather observations cached for 15 minutes
 * Forecasts cached for 30 minutes
 */

import { sql, isDatabaseConfigured } from '@/lib/db'
import type { WeatherObservation, ForecastPeriod } from '@/types'

// ============================================
// Weather Observations Cache (15 min TTL)
// ============================================

/**
 * Get cached weather observation for a station
 */
export async function getCachedWeather(stationId: string): Promise<WeatherObservation | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    const readings = await sql`
      SELECT
        station_id as "stationId",
        station_name as "stationName",
        observation_time as "timestamp",
        temperature,
        humidity,
        wind_speed as "windSpeed",
        wind_direction as "windDirection",
        wind_gust as "windGust",
        pressure,
        visibility,
        conditions,
        icon,
        dewpoint,
        heat_index as "heatIndex",
        wind_chill as "windChill"
      FROM weather_cache
      WHERE station_id = ${stationId}
        AND expires_at > NOW()
      LIMIT 1
    `

    if (readings.length === 0) {
      return null
    }

    console.log(`[Weather DB] Found cached weather for ${stationId}`)

    // PostgreSQL NUMERIC comes back as strings - convert to numbers
    const r = readings[0]
    return {
      stationId: r.stationId,
      stationName: r.stationName,
      timestamp: r.timestamp,
      temperature: r.temperature != null ? parseFloat(r.temperature) : null,
      temperatureUnit: 'F' as const,
      humidity: r.humidity != null ? parseFloat(r.humidity) : null,
      windSpeed: r.windSpeed != null ? parseFloat(r.windSpeed) : null,
      windDirection: r.windDirection,
      windGust: r.windGust != null ? parseFloat(r.windGust) : null,
      pressure: r.pressure != null ? parseFloat(r.pressure) : null,
      visibility: r.visibility != null ? parseFloat(r.visibility) : null,
      conditions: r.conditions,
      icon: r.icon || undefined,
      dewpoint: r.dewpoint != null ? parseFloat(r.dewpoint) : null,
      heatIndex: r.heatIndex != null ? parseFloat(r.heatIndex) : null,
      windChill: r.windChill != null ? parseFloat(r.windChill) : null,
    }
  } catch (error) {
    console.error('[Weather DB] Error fetching cached weather:', error)
    return null
  }
}

/**
 * Save weather observation to cache
 */
export async function cacheWeather(observation: WeatherObservation): Promise<void> {
  if (!isDatabaseConfigured() || !observation.stationId) {
    return
  }

  try {
    await sql`
      INSERT INTO weather_cache (
        station_id, station_name, observation_time,
        temperature, humidity, wind_speed, wind_direction, wind_gust,
        pressure, visibility, conditions, icon, dewpoint, heat_index, wind_chill
      ) VALUES (
        ${observation.stationId},
        ${observation.stationName},
        ${observation.timestamp},
        ${observation.temperature},
        ${observation.humidity},
        ${observation.windSpeed},
        ${observation.windDirection},
        ${observation.windGust},
        ${observation.pressure},
        ${observation.visibility},
        ${observation.conditions},
        ${observation.icon || null},
        ${observation.dewpoint},
        ${observation.heatIndex || null},
        ${observation.windChill || null}
      )
      ON CONFLICT (station_id) DO UPDATE SET
        station_name = EXCLUDED.station_name,
        observation_time = EXCLUDED.observation_time,
        temperature = EXCLUDED.temperature,
        humidity = EXCLUDED.humidity,
        wind_speed = EXCLUDED.wind_speed,
        wind_direction = EXCLUDED.wind_direction,
        wind_gust = EXCLUDED.wind_gust,
        pressure = EXCLUDED.pressure,
        visibility = EXCLUDED.visibility,
        conditions = EXCLUDED.conditions,
        icon = EXCLUDED.icon,
        dewpoint = EXCLUDED.dewpoint,
        heat_index = EXCLUDED.heat_index,
        wind_chill = EXCLUDED.wind_chill,
        cached_at = NOW(),
        expires_at = NOW() + INTERVAL '5 minutes'
    `

    console.log(`[Weather DB] Cached weather for ${observation.stationId}`)
  } catch (error) {
    console.error('[Weather DB] Error caching weather:', error)
  }
}

// ============================================
// Forecast Cache (30 min TTL)
// ============================================

interface ForecastCacheKey {
  gridId: string
  gridX: number
  gridY: number
}

/**
 * Get cached forecast for a grid location
 */
export async function getCachedForecast(key: ForecastCacheKey): Promise<ForecastPeriod[] | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    const results = await sql`
      SELECT periods
      FROM forecast_cache
      WHERE grid_id = ${key.gridId}
        AND grid_x = ${key.gridX}
        AND grid_y = ${key.gridY}
        AND expires_at > NOW()
      LIMIT 1
    ` as { periods: ForecastPeriod[] }[]

    if (results.length === 0) {
      return null
    }

    console.log(`[Weather DB] Found cached forecast for ${key.gridId}/${key.gridX},${key.gridY}`)
    return results[0].periods
  } catch (error) {
    console.error('[Weather DB] Error fetching cached forecast:', error)
    return null
  }
}

/**
 * Save forecast to cache
 */
export async function cacheForecast(key: ForecastCacheKey, periods: ForecastPeriod[]): Promise<void> {
  if (!isDatabaseConfigured()) {
    return
  }

  try {
    await sql`
      INSERT INTO forecast_cache (grid_id, grid_x, grid_y, periods)
      VALUES (${key.gridId}, ${key.gridX}, ${key.gridY}, ${JSON.stringify(periods)})
      ON CONFLICT (grid_id, grid_x, grid_y) DO UPDATE SET
        periods = EXCLUDED.periods,
        cached_at = NOW(),
        expires_at = NOW() + INTERVAL '30 minutes'
    `

    console.log(`[Weather DB] Cached forecast for ${key.gridId}/${key.gridX},${key.gridY}`)
  } catch (error) {
    console.error('[Weather DB] Error caching forecast:', error)
  }
}

// ============================================
// Cache Maintenance
// ============================================

/**
 * Prune all expired weather-related cache entries
 */
export async function pruneExpiredWeatherCaches(): Promise<{ weather: number; forecast: number }> {
  if (!isDatabaseConfigured()) {
    return { weather: 0, forecast: 0 }
  }

  try {
    const weatherResult = await sql`
      DELETE FROM weather_cache
      WHERE expires_at < NOW()
      RETURNING id
    ` as { id: number }[]

    const forecastResult = await sql`
      DELETE FROM forecast_cache
      WHERE expires_at < NOW()
      RETURNING id
    ` as { id: number }[]

    return {
      weather: weatherResult.length,
      forecast: forecastResult.length,
    }
  } catch (error) {
    console.error('[Weather DB] Error pruning expired caches:', error)
    return { weather: 0, forecast: 0 }
  }
}
