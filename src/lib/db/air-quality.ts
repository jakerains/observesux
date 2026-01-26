/**
 * Database operations for air quality caching
 * AQI data is cached for 60 minutes (AirNow updates hourly)
 */

import { sql, isDatabaseConfigured } from '@/lib/db'
import type { AirQualityReading, AQICategory } from '@/types'

/**
 * Get cached air quality reading that hasn't expired
 */
export async function getCachedAirQuality(): Promise<AirQualityReading[] | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    const readings = await sql`
      SELECT
        latitude,
        longitude,
        aqi,
        category,
        pollutant as "primaryPollutant",
        reporting_area as "reportingArea",
        observation_time as "timestamp"
      FROM air_quality_cache
      WHERE expires_at > NOW()
      ORDER BY aqi DESC
      LIMIT 1
    `

    if (readings.length === 0) {
      return null
    }

    console.log(`[AirQuality DB] Found cached air quality reading`)

    // PostgreSQL NUMERIC comes back as strings - convert to numbers
    return readings.map(r => ({
      latitude: r.latitude != null ? parseFloat(r.latitude) : 0,
      longitude: r.longitude != null ? parseFloat(r.longitude) : 0,
      timestamp: r.timestamp,
      aqi: r.aqi != null ? parseInt(r.aqi, 10) : 0,
      category: r.category as AQICategory,
      primaryPollutant: r.primaryPollutant,
      source: 'airnow' as const,
    }))
  } catch (error) {
    console.error('[AirQuality DB] Error fetching cached air quality:', error)
    return null
  }
}

/**
 * Save air quality reading to cache
 */
export async function cacheAirQuality(readings: AirQualityReading[]): Promise<void> {
  if (!isDatabaseConfigured()) {
    return
  }

  if (readings.length === 0) {
    console.log('[AirQuality DB] No readings to cache')
    return
  }

  try {
    // Clear existing cache and insert fresh data
    await sql`DELETE FROM air_quality_cache`

    for (const reading of readings) {
      await sql`
        INSERT INTO air_quality_cache (
          site_name, aqi, category, pollutant,
          latitude, longitude, reporting_area, observation_time
        ) VALUES (
          ${reading.source || 'airnow'},
          ${reading.aqi || null},
          ${reading.category || null},
          ${reading.primaryPollutant || null},
          ${reading.latitude || null},
          ${reading.longitude || null},
          ${'Sioux City'},
          ${reading.timestamp || null}
        )
      `
    }

    console.log(`[AirQuality DB] Cached ${readings.length} air quality reading(s)`)
  } catch (error) {
    console.error('[AirQuality DB] Error caching air quality:', error)
  }
}

/**
 * Prune expired air quality cache entries
 */
export async function pruneExpiredAirQuality(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0
  }

  try {
    const result = await sql`
      DELETE FROM air_quality_cache
      WHERE expires_at < NOW()
      RETURNING id
    ` as { id: number }[]

    return result.length
  } catch (error) {
    console.error('[AirQuality DB] Error pruning expired air quality:', error)
    return 0
  }
}
