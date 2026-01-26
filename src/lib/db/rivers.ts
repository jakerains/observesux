/**
 * Database operations for river gauge caching
 * River data is cached for 30 minutes to reduce USGS API calls
 */

import { sql, isDatabaseConfigured } from '@/lib/db'
import type { RiverGaugeReading, FloodStage } from '@/types'

/**
 * Get cached river readings that haven't expired
 */
export async function getCachedRivers(): Promise<RiverGaugeReading[] | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    const rows = await sql`
      SELECT
        site_id as "siteId",
        site_name as "siteName",
        latitude,
        longitude,
        gauge_height as "gaugeHeight",
        discharge,
        water_temp as "waterTemp",
        flood_stage as "floodStage",
        action_stage as "actionStage",
        flood_stage_level as "floodStageLevel",
        moderate_flood_stage as "moderateFloodStage",
        major_flood_stage as "majorFloodStage",
        observation_time as "timestamp"
      FROM river_cache
      WHERE expires_at > NOW()
      ORDER BY site_name ASC
    `

    if (rows.length === 0) {
      return null
    }

    // PostgreSQL NUMERIC comes back as strings - convert to numbers
    const readings: RiverGaugeReading[] = rows.map(row => ({
      siteId: row.siteId,
      siteName: row.siteName,
      latitude: row.latitude ? parseFloat(row.latitude) : 0,
      longitude: row.longitude ? parseFloat(row.longitude) : 0,
      gaugeHeight: row.gaugeHeight ? parseFloat(row.gaugeHeight) : null,
      discharge: row.discharge ? parseFloat(row.discharge) : null,
      waterTemp: row.waterTemp ? parseFloat(row.waterTemp) : null,
      floodStage: row.floodStage as RiverGaugeReading['floodStage'],
      actionStage: row.actionStage ? parseFloat(row.actionStage) : null,
      floodStageLevel: row.floodStageLevel ? parseFloat(row.floodStageLevel) : null,
      moderateFloodStage: row.moderateFloodStage ? parseFloat(row.moderateFloodStage) : null,
      majorFloodStage: row.majorFloodStage ? parseFloat(row.majorFloodStage) : null,
      timestamp: row.timestamp,
    }))

    console.log(`[Rivers DB] Found ${readings.length} cached river readings`)
    return readings
  } catch (error) {
    console.error('[Rivers DB] Error fetching cached rivers:', error)
    return null
  }
}

/**
 * Save river readings to cache
 */
export async function cacheRivers(readings: RiverGaugeReading[]): Promise<void> {
  if (!isDatabaseConfigured()) {
    return
  }

  if (readings.length === 0) {
    console.log('[Rivers DB] No readings to cache')
    return
  }

  try {
    // Clear existing cache and insert fresh data
    await sql`DELETE FROM river_cache`

    for (const reading of readings) {
      await sql`
        INSERT INTO river_cache (
          site_id, site_name, latitude, longitude,
          gauge_height, discharge, water_temp, flood_stage,
          action_stage, flood_stage_level, moderate_flood_stage, major_flood_stage,
          observation_time
        ) VALUES (
          ${reading.siteId},
          ${reading.siteName},
          ${reading.latitude},
          ${reading.longitude},
          ${reading.gaugeHeight},
          ${reading.discharge},
          ${reading.waterTemp},
          ${reading.floodStage},
          ${reading.actionStage},
          ${reading.floodStageLevel},
          ${reading.moderateFloodStage},
          ${reading.majorFloodStage},
          ${reading.timestamp}
        )
        ON CONFLICT (site_id) DO UPDATE SET
          site_name = EXCLUDED.site_name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          gauge_height = EXCLUDED.gauge_height,
          discharge = EXCLUDED.discharge,
          water_temp = EXCLUDED.water_temp,
          flood_stage = EXCLUDED.flood_stage,
          action_stage = EXCLUDED.action_stage,
          flood_stage_level = EXCLUDED.flood_stage_level,
          moderate_flood_stage = EXCLUDED.moderate_flood_stage,
          major_flood_stage = EXCLUDED.major_flood_stage,
          observation_time = EXCLUDED.observation_time,
          cached_at = NOW(),
          expires_at = NOW() + INTERVAL '30 minutes'
      `
    }

    console.log(`[Rivers DB] Cached ${readings.length} river readings`)
  } catch (error) {
    console.error('[Rivers DB] Error caching rivers:', error)
  }
}

/**
 * Prune expired river cache entries
 */
export async function pruneExpiredRivers(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0
  }

  try {
    const result = await sql`
      DELETE FROM river_cache
      WHERE expires_at < NOW()
      RETURNING id
    ` as { id: number }[]

    return result.length
  } catch (error) {
    console.error('[Rivers DB] Error pruning expired rivers:', error)
    return 0
  }
}
