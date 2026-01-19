import type { Aircraft, AircraftData, SuxAssociation } from '@/types'
import { SUX_AIRPORT } from '@/types'

// OpenSky Network API - free, no API key required (optional auth improves rate limits)
// Bounding box covers ~40 mile radius around Sioux City
const OPENSKY_API = 'https://opensky-network.org/api/states/all'
const BOUNDING_BOX = {
  lamin: 41.8, // South latitude
  lamax: 43.1, // North latitude
  lomin: -97.3, // West longitude
  lomax: -95.6, // East longitude
}

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

// OpenSky state vector response format
// [0] icao24, [1] callsign, [2] origin_country, [3] time_position, [4] last_contact,
// [5] longitude, [6] latitude, [7] baro_altitude (m), [8] on_ground, [9] velocity (m/s),
// [10] true_track, [11] vertical_rate (m/s), [12] sensors, [13] geo_altitude (m),
// [14] squawk, [15] spi, [16] position_source
type StateVector = [
  string, // icao24
  string | null, // callsign
  string, // origin_country
  number | null, // time_position
  number, // last_contact
  number | null, // longitude
  number | null, // latitude
  number | null, // baro_altitude (meters)
  boolean, // on_ground
  number | null, // velocity (m/s)
  number | null, // true_track (degrees)
  number | null, // vertical_rate (m/s)
  number[] | null, // sensors
  number | null, // geo_altitude (meters)
  string | null, // squawk
  boolean, // spi
  number // position_source
]

interface OpenSkyResponse {
  time: number
  states: StateVector[] | null
}

// Convert meters to feet
const metersToFeet = (m: number | null): number | null => (m !== null ? m * 3.28084 : null)

// Convert m/s to knots
const mpsToKnots = (mps: number | null): number | null => (mps !== null ? mps * 1.94384 : null)

// Convert m/s to ft/min
const mpsToFpm = (mps: number | null): number | null => (mps !== null ? mps * 196.85 : null)

const OPENSKY_CACHE_TTL_MS = 60_000
const OPENSKY_BACKOFF_MS = 120_000
const OPENSKY_TIMEOUT_MS = 8_000 // 8 second timeout for fetch
const OPENSKY_ERROR_BACKOFF_MS = 300_000 // 5 minute backoff on connection errors

let cachedData: AircraftData | null = null
let lastFetchAt = 0
let cooldownUntil = 0
let consecutiveErrors = 0

function getEmptyAircraftData(): AircraftData {
  return {
    aircraft: [],
    timestamp: new Date(),
    source: 'OpenSky Network',
    suxArrivals: 0,
    suxDepartures: 0,
    nearSux: 0,
  }
}

function getAuthHeader(): string | null {
  const username = process.env.OPENSKY_USERNAME
  const password = process.env.OPENSKY_PASSWORD
  if (!username || !password) return null
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

export async function fetchAircraft(): Promise<AircraftData> {
  const now = Date.now()
  if (cachedData && now - lastFetchAt < OPENSKY_CACHE_TTL_MS) {
    return cachedData
  }
  if (cooldownUntil && now < cooldownUntil) {
    // During cooldown, return cached data or empty
    return cachedData ?? getEmptyAircraftData()
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENSKY_TIMEOUT_MS)

  try {
    const url = new URL(OPENSKY_API)
    url.searchParams.set('lamin', BOUNDING_BOX.lamin.toString())
    url.searchParams.set('lamax', BOUNDING_BOX.lamax.toString())
    url.searchParams.set('lomin', BOUNDING_BOX.lomin.toString())
    url.searchParams.set('lomax', BOUNDING_BOX.lomax.toString())

    const authHeader = getAuthHeader()
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: controller.signal,
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[OpenSky] Rate limited, backing off for 2 minutes')
        cooldownUntil = now + OPENSKY_BACKOFF_MS
        consecutiveErrors++
        return cachedData ?? getEmptyAircraftData()
      }
      throw new Error(`OpenSky API error: ${response.status}`)
    }

    // Success - reset error counter
    consecutiveErrors = 0
    const data: OpenSkyResponse = await response.json()

    if (!data.states || data.states.length === 0) {
      const empty = getEmptyAircraftData()
      cachedData = empty
      lastFetchAt = now
      return empty
    }

    let suxArrivals = 0
    let suxDepartures = 0
    let nearSux = 0

    const aircraft: Aircraft[] = data.states
      .filter((state) => state[6] !== null && state[5] !== null) // Must have position
      .map((state) => {
        const lat = state[6]!
        const lon = state[5]!
        const heading = state[10]
        const verticalRateMps = state[11]
        const verticalRate = mpsToFpm(verticalRateMps)
        const onGround = state[8]

        const suxAssociation = determineSuxAssociation(lat, lon, heading, verticalRate, onGround)

        // Count SUX associations
        if (suxAssociation === 'arriving') suxArrivals++
        else if (suxAssociation === 'departing') suxDepartures++
        else if (suxAssociation === 'nearby') nearSux++

        return {
          icao24: state[0],
          callsign: state[1]?.trim() || null,
          latitude: lat,
          longitude: lon,
          altitude: metersToFeet(state[7]),
          velocity: mpsToKnots(state[9]),
          heading: heading,
          verticalRate: verticalRate,
          onGround: onGround,
          squawk: state[14],
          positionSource: state[16],
          suxAssociation,
        }
      })

    const result = {
      aircraft,
      timestamp: new Date(),
      source: 'OpenSky Network',
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

    // Determine backoff based on error type and consecutive errors
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
      const backoffMs = OPENSKY_ERROR_BACKOFF_MS * backoffMultiplier
      cooldownUntil = now + backoffMs
      console.warn(`[OpenSky] Connection error (attempt ${consecutiveErrors}), backing off for ${backoffMs / 60000} minutes`)
    } else {
      console.error('[OpenSky] Unexpected error:', error)
    }

    return cachedData ?? getEmptyAircraftData()
  }
}
