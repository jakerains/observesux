import type { Aircraft, AircraftData, SuxAssociation } from '@/types'
import { SUX_AIRPORT } from '@/types'

// Airplanes.live API - free, no API key required, unfiltered data
// https://airplanes.live/api-guide/
const AIRPLANES_LIVE_API = 'https://api.airplanes.live/v2'

// Search radius in nautical miles (max 250)
const SEARCH_RADIUS_NM = 50

// Distance in nautical miles within which aircraft are considered "near" SUX
const SUX_PROXIMITY_NM = 15

// Vertical rate thresholds for detecting arrivals/departures (ft/min)
const CLIMBING_THRESHOLD = 100
const DESCENDING_THRESHOLD = -100

// Convert degrees to radians
const toRad = (deg: number) => deg * (Math.PI / 180)

// Calculate distance between two coordinates in nautical miles
function distanceNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065 // Earth's radius in nautical miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate bearing from one point to another (degrees)
function bearingTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
  let brng = Math.atan2(y, x) * (180 / Math.PI)
  return (brng + 360) % 360
}

// Check if aircraft heading is toward a point (within 45 degrees)
function isHeadingToward(
  aircraftLat: number,
  aircraftLon: number,
  targetLat: number,
  targetLon: number,
  heading: number
): boolean {
  const bearingToTarget = bearingTo(aircraftLat, aircraftLon, targetLat, targetLon)
  let diff = Math.abs(heading - bearingToTarget)
  if (diff > 180) diff = 360 - diff
  return diff < 45
}

// Determine aircraft's relationship to SUX airport
function determineSuxAssociation(
  lat: number,
  lon: number,
  heading: number | null,
  verticalRate: number | null,
  onGround: boolean
): SuxAssociation {
  const distance = distanceNM(lat, lon, SUX_AIRPORT.latitude, SUX_AIRPORT.longitude)

  // Not near SUX
  if (distance > SUX_PROXIMITY_NM) {
    return null
  }

  // On ground at SUX
  if (onGround) {
    return 'nearby'
  }

  // Check if heading and vertical rate indicate arrival or departure
  if (heading !== null && verticalRate !== null) {
    const headingToSux = isHeadingToward(lat, lon, SUX_AIRPORT.latitude, SUX_AIRPORT.longitude, heading)
    const headingAway = isHeadingToward(SUX_AIRPORT.latitude, SUX_AIRPORT.longitude, lat, lon, heading)

    // Descending toward SUX = arriving
    if (headingToSux && verticalRate < DESCENDING_THRESHOLD) {
      return 'arriving'
    }

    // Climbing away from SUX = departing
    if (headingAway && verticalRate > CLIMBING_THRESHOLD) {
      return 'departing'
    }
  }

  // Near SUX but not clearly arriving/departing
  return 'nearby'
}

// Airplanes.live aircraft response format
interface AirplanesLiveAircraft {
  hex: string              // ICAO 24-bit address
  flight?: string          // Callsign
  r?: string               // Registration
  t?: string               // Aircraft type
  lat?: number             // Latitude
  lon?: number             // Longitude
  alt_baro?: number | 'ground'  // Barometric altitude in feet, or "ground"
  alt_geom?: number        // Geometric altitude in feet
  gs?: number              // Ground speed in knots
  track?: number           // Track angle (true heading)
  mag_heading?: number     // Magnetic heading
  true_heading?: number    // True heading
  baro_rate?: number       // Vertical rate ft/min (barometric)
  geom_rate?: number       // Vertical rate ft/min (geometric)
  squawk?: string          // Squawk code
  category?: string        // Emitter category
  nav_altitude_mcp?: number
  nav_heading?: number
  seen?: number            // Seconds since last message
  seen_pos?: number        // Seconds since last position
  rssi?: number            // Signal strength
  dst?: number             // Distance from search point in nm
  dir?: number             // Direction from search point
  dbFlags?: number         // Database flags (military, etc)
}

interface AirplanesLiveResponse {
  ac?: AirplanesLiveAircraft[]
  msg?: string
  now?: number
  total?: number
  ctime?: number
  ptime?: number
}

const CACHE_TTL_MS = 60_000
const ERROR_BACKOFF_MS = 300_000 // 5 minute backoff on errors
const FETCH_TIMEOUT_MS = 10_000

let cachedData: AircraftData | null = null
let lastFetchAt = 0
let cooldownUntil = 0
let consecutiveErrors = 0

function getEmptyAircraftData(): AircraftData {
  return {
    aircraft: [],
    timestamp: new Date(),
    source: 'Airplanes.live',
    suxArrivals: 0,
    suxDepartures: 0,
    nearSux: 0,
  }
}

export async function fetchAircraft(): Promise<AircraftData> {
  const now = Date.now()

  // Return cached data if fresh
  if (cachedData && now - lastFetchAt < CACHE_TTL_MS) {
    return cachedData
  }

  // Return cached/empty during cooldown
  if (cooldownUntil && now < cooldownUntil) {
    return cachedData ?? getEmptyAircraftData()
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    // Use point search: /point/lat/lon/radius
    const url = `${AIRPLANES_LIVE_API}/point/${SUX_AIRPORT.latitude}/${SUX_AIRPORT.longitude}/${SEARCH_RADIUS_NM}`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 60 },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Airplanes.live API error: ${response.status}`)
    }

    // Success - reset error counter
    consecutiveErrors = 0
    const data: AirplanesLiveResponse = await response.json()

    if (!data.ac || data.ac.length === 0) {
      const empty = getEmptyAircraftData()
      cachedData = empty
      lastFetchAt = now
      return empty
    }

    let suxArrivals = 0
    let suxDepartures = 0
    let nearSux = 0

    const aircraft: Aircraft[] = data.ac
      .filter((ac) => ac.lat !== undefined && ac.lon !== undefined)
      .map((ac) => {
        const lat = ac.lat!
        const lon = ac.lon!
        const heading = ac.track ?? ac.true_heading ?? ac.mag_heading ?? null
        const verticalRate = ac.baro_rate ?? ac.geom_rate ?? null
        const onGround = ac.alt_baro === 'ground'
        const altitude = typeof ac.alt_baro === 'number' ? ac.alt_baro : (ac.alt_geom ?? null)

        const suxAssociation = determineSuxAssociation(lat, lon, heading, verticalRate, onGround)

        // Count SUX associations
        if (suxAssociation === 'arriving') suxArrivals++
        else if (suxAssociation === 'departing') suxDepartures++
        else if (suxAssociation === 'nearby') nearSux++

        return {
          icao24: ac.hex,
          callsign: ac.flight?.trim() || null,
          registration: ac.r || null,
          aircraftType: ac.t || null,
          latitude: lat,
          longitude: lon,
          altitude,
          velocity: ac.gs ?? null,
          heading,
          verticalRate,
          onGround,
          squawk: ac.squawk || null,
          suxAssociation,
        }
      })

    const result: AircraftData = {
      aircraft,
      timestamp: new Date(),
      source: 'Airplanes.live',
      suxArrivals,
      suxDepartures,
      nearSux,
    }

    cachedData = result
    lastFetchAt = now
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    consecutiveErrors++

    // Determine backoff based on error type
    const isTimeout = error instanceof Error && (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('Timeout')
    )
    const isConnectionError = error instanceof Error && (
      error.message.includes('fetch failed') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    )

    if (isTimeout || isConnectionError) {
      // Exponential backoff: 5 min, 10 min, 20 min, max 30 min
      const backoffMultiplier = Math.min(consecutiveErrors, 4)
      const backoffMs = ERROR_BACKOFF_MS * backoffMultiplier
      cooldownUntil = now + backoffMs
      console.warn(`[Airplanes.live] Connection error (attempt ${consecutiveErrors}), backing off for ${backoffMs / 60000} minutes`)
    } else {
      console.error('[Airplanes.live] Error:', error)
    }

    return cachedData ?? getEmptyAircraftData()
  }
}
