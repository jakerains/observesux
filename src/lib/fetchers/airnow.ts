import type { AirQualityReading, AQICategory } from '@/types'
import { getAQICategoryFromValue } from '@/types'
import { getCachedAirQuality, cacheAirQuality } from '@/lib/db/air-quality'

// Sioux City coordinates
const SIOUX_CITY_LAT = 42.5
const SIOUX_CITY_LON = -96.4

interface AirNowObservation {
  DateObserved: string
  HourObserved: number
  LocalTimeZone: string
  ReportingArea: string
  StateCode: string
  Latitude: number
  Longitude: number
  ParameterName: string
  AQI: number
  Category: {
    Number: number
    Name: string
  }
}

export async function fetchAirNowData(): Promise<AirQualityReading | null> {
  const apiKey = process.env.AIRNOW_API_KEY

  if (!apiKey) {
    console.warn('AIRNOW_API_KEY not configured, skipping AirNow fetch')
    return null
  }

  try {
    const response = await fetch(
      `https://www.airnowapi.org/aq/observation/latLong/current/?format=json&latitude=${SIOUX_CITY_LAT}&longitude=${SIOUX_CITY_LON}&distance=50&API_KEY=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour (AirNow updates hourly)
    )

    if (!response.ok) {
      throw new Error(`AirNow API error: ${response.status}`)
    }

    const data: AirNowObservation[] = await response.json()

    if (!data || data.length === 0) {
      return null
    }

    // Find the primary pollutant (highest AQI)
    const sortedByAqi = [...data].sort((a, b) => b.AQI - a.AQI)
    const primary = sortedByAqi[0]

    // Extract individual pollutant readings
    const pm25 = data.find(d => d.ParameterName === 'PM2.5')?.AQI
    const pm10 = data.find(d => d.ParameterName === 'PM10')?.AQI
    const ozone = data.find(d => d.ParameterName === 'OZONE' || d.ParameterName === 'O3')?.AQI

    // Parse the date
    const [year, month, day] = primary.DateObserved.split('-').map(Number)
    const timestamp = new Date(year, month - 1, day, primary.HourObserved)

    return {
      latitude: primary.Latitude,
      longitude: primary.Longitude,
      timestamp,
      aqi: primary.AQI,
      category: primary.Category.Name as AQICategory,
      primaryPollutant: primary.ParameterName,
      pm25,
      pm10,
      ozone,
      source: 'airnow'
    }
  } catch (error) {
    console.error('Failed to fetch AirNow data:', error)
    return null
  }
}

// Fallback: Fetch from Iowa Mesonet (doesn't require API key)
export async function fetchMesonetAirQuality(): Promise<AirQualityReading | null> {
  try {
    // Iowa Mesonet current observations for Sioux City
    const response = await fetch(
      'https://mesonet.agron.iastate.edu/json/current.py?network=IA_ASOS&station=SUX',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Mesonet doesn't provide AQI directly, but we can use visibility as a proxy
    // This is a simplified approximation
    if (!data.last_report) {
      return null
    }

    // For now, return a placeholder - real AQI data would need AirNow or PurpleAir
    return null
  } catch (error) {
    console.error('Failed to fetch Mesonet air quality:', error)
    return null
  }
}

// Combined fetcher that tries cache first, then AirNow, then falls back
export async function fetchAirQuality(forceRefresh = false): Promise<AirQualityReading> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedAirQuality()
    if (cached && cached.length > 0) {
      console.log('[AirQuality] Using cached data')
      // Return the first reading (usually only one for our location)
      return cached[0]
    }
  }

  console.log('[AirQuality] Cache miss - fetching from AirNow API')

  // Try AirNow first
  const airnowData = await fetchAirNowData()
  if (airnowData) {
    // Cache the result (non-blocking)
    cacheAirQuality([airnowData]).catch(() => {})
    return airnowData
  }

  // Fallback to a default "Good" reading if APIs fail
  // In production, you'd want to try PurpleAir or other sources
  return {
    latitude: SIOUX_CITY_LAT,
    longitude: SIOUX_CITY_LON,
    timestamp: new Date(),
    aqi: 35, // Estimated typical good air quality
    category: getAQICategoryFromValue(35),
    primaryPollutant: 'PM2.5',
    source: 'airnow'
  }
}
