import { sql, isDatabaseConfigured } from '../db'

// Types for historical data
export interface WeatherDataPoint {
  time: string
  temperature: number
  humidity: number
  windSpeed: number
}

export interface RiverDataPoint {
  time: string
  gaugeHeight: number
  siteId: string
}

export interface AirQualityDataPoint {
  time: string
  aqi: number
}

// Store weather observation
export async function storeWeatherObservation(data: {
  temperature: number | null
  feelsLike: number | null
  humidity: number | null
  windSpeed: number | null
  windDirection: string | null
  windGust?: number | null
  conditions: string
  visibility?: number | null
  pressure?: number | null
  observedAt: Date
}) {
  if (!isDatabaseConfigured()) return

  // Skip storing if we don't have core weather data
  if (data.temperature === null) return

  try {
    await sql`
      INSERT INTO weather_observations (
        temperature_f, feels_like_f, humidity, wind_speed_mph,
        wind_direction, wind_gust_mph, conditions, visibility_miles,
        pressure_mb, observed_at
      ) VALUES (
        ${data.temperature}, ${data.feelsLike}, ${data.humidity},
        ${data.windSpeed}, ${data.windDirection}, ${data.windGust ?? null},
        ${data.conditions}, ${data.visibility ?? null}, ${data.pressure ?? null},
        ${data.observedAt.toISOString()}
      )
      ON CONFLICT DO NOTHING
    `
  } catch (error) {
    console.error('Failed to store weather observation:', error)
  }
}

// Store river reading
export async function storeRiverReading(data: {
  siteId: string
  siteName: string
  gaugeHeight: number | null
  discharge?: number | null
  waterTemp?: number | null
  floodStage: string
  observedAt: Date
}) {
  if (!isDatabaseConfigured()) return

  // Validate values before storing - filter out USGS sentinel values
  const isValidValue = (val: number | null | undefined, min: number, max: number): boolean => {
    return val !== null && val !== undefined && val >= min && val <= max
  }

  const gaugeHeight = isValidValue(data.gaugeHeight, 0, 100) ? data.gaugeHeight : null
  const discharge = isValidValue(data.discharge, 0, 1000000) ? data.discharge : null
  const waterTemp = isValidValue(data.waterTemp, -40, 120) ? data.waterTemp : null

  // Skip storing if we have no valid gauge height
  if (gaugeHeight === null) return

  try {
    await sql`
      INSERT INTO river_readings (
        site_id, site_name, gauge_height_ft, discharge_cfs,
        water_temp_f, flood_stage, observed_at
      ) VALUES (
        ${data.siteId}, ${data.siteName}, ${gaugeHeight},
        ${discharge}, ${waterTemp},
        ${data.floodStage}, ${data.observedAt.toISOString()}
      )
    `
  } catch (error) {
    console.error('Failed to store river reading:', error)
  }
}

// Store air quality reading
export async function storeAirQualityReading(data: {
  aqi: number
  category: string
  primaryPollutant: string
  pm25?: number
  source: string
  observedAt: Date
}) {
  if (!isDatabaseConfigured()) return

  try {
    await sql`
      INSERT INTO air_quality_readings (
        aqi, category, primary_pollutant, pm25, source, observed_at
      ) VALUES (
        ${data.aqi}, ${data.category}, ${data.primaryPollutant},
        ${data.pm25 || null}, ${data.source}, ${data.observedAt.toISOString()}
      )
    `
  } catch (error) {
    console.error('Failed to store air quality reading:', error)
  }
}

// Store weather alert
export async function storeWeatherAlert(data: {
  alertId: string
  eventType: string
  severity: string
  certainty: string
  urgency: string
  headline: string
  description: string
  instruction?: string
  areaDesc: string
  effectiveAt: Date
  expiresAt: Date
}) {
  if (!isDatabaseConfigured()) return

  try {
    await sql`
      INSERT INTO weather_alerts (
        alert_id, event_type, severity, certainty, urgency,
        headline, description, instruction, area_desc,
        effective_at, expires_at
      ) VALUES (
        ${data.alertId}, ${data.eventType}, ${data.severity},
        ${data.certainty}, ${data.urgency}, ${data.headline},
        ${data.description}, ${data.instruction || null}, ${data.areaDesc},
        ${data.effectiveAt.toISOString()}, ${data.expiresAt.toISOString()}
      )
      ON CONFLICT (alert_id) DO NOTHING
    `
  } catch (error) {
    console.error('Failed to store weather alert:', error)
  }
}

// Get weather history for charts (last 24 hours)
export async function getWeatherHistory(hours: number = 24): Promise<WeatherDataPoint[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        observed_at as time,
        temperature_f as temperature,
        humidity,
        wind_speed_mph as "windSpeed"
      FROM weather_observations
      WHERE observed_at > NOW() - MAKE_INTERVAL(hours => ${hours})
      ORDER BY observed_at ASC
    `
    return result as WeatherDataPoint[]
  } catch (error) {
    console.error('Failed to get weather history:', error)
    return []
  }
}

// Get river level history (last 24 hours)
export async function getRiverHistory(siteId: string, hours: number = 24): Promise<RiverDataPoint[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        observed_at as time,
        gauge_height_ft as "gaugeHeight",
        site_id as "siteId"
      FROM river_readings
      WHERE site_id = ${siteId}
        AND observed_at > NOW() - MAKE_INTERVAL(hours => ${hours})
      ORDER BY observed_at ASC
    `
    return result as RiverDataPoint[]
  } catch (error) {
    console.error('Failed to get river history:', error)
    return []
  }
}

// Get air quality history (last 24 hours)
export async function getAirQualityHistory(hours: number = 24): Promise<AirQualityDataPoint[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        observed_at as time,
        aqi
      FROM air_quality_readings
      WHERE observed_at > NOW() - MAKE_INTERVAL(hours => ${hours})
      ORDER BY observed_at ASC
    `
    return result as AirQualityDataPoint[]
  } catch (error) {
    console.error('Failed to get air quality history:', error)
    return []
  }
}

// Get recent alerts (last 7 days)
export async function getRecentAlerts(days: number = 7) {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        alert_id as "alertId",
        event_type as "eventType",
        severity,
        headline,
        area_desc as "areaDesc",
        effective_at as "effectiveAt",
        expires_at as "expiresAt"
      FROM weather_alerts
      WHERE created_at > NOW() - MAKE_INTERVAL(days => ${days})
      ORDER BY effective_at DESC
      LIMIT 20
    `
    return result
  } catch (error) {
    console.error('Failed to get recent alerts:', error)
    return []
  }
}

// Log system health
export async function logSystemHealth(service: string, status: 'success' | 'error' | 'timeout', responseTimeMs?: number, errorMessage?: string) {
  if (!isDatabaseConfigured()) return

  try {
    await sql`
      INSERT INTO system_logs (service_name, status, response_time_ms, error_message)
      VALUES (${service}, ${status}, ${responseTimeMs || null}, ${errorMessage || null})
    `
  } catch (error) {
    // Don't log errors about logging - could cause infinite loop
  }
}
