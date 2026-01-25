import { NextResponse } from 'next/server'
import type { BusPosition, TransitRoute, TransitStop, OccupancyStatus, ScheduleAdherence, GtfsStop, GtfsStopTime } from '@/types'
import { getOccupancyFromRaw } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

// Sioux City Transit uses Passio GO
const PASSIO_API = 'https://passio3.com/siouxcity/passioTransit/gtfs/'

// Comprehensive GTFS cache
interface GtfsCache {
  tripToRoute: Map<string, string>
  stops: Map<string, GtfsStop>
  routes: Map<string, TransitRoute>
  stopTimes: Map<string, GtfsStopTime[]>
  lastFetched: number
}

let gtfsCache: GtfsCache | null = null
const CACHE_TTL = 1000 * 60 * 60 // 1 hour cache

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

async function getGtfsCache(): Promise<GtfsCache> {
  const now = Date.now()

  // Return cached data if still valid
  if (gtfsCache && (now - gtfsCache.lastFetched) < CACHE_TTL) {
    return gtfsCache
  }

  try {
    console.log('[Transit] Loading GTFS data...')
    const response = await fetch(`${PASSIO_API}google_transit.zip`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      console.error('[Transit] Failed to fetch GTFS zip')
      return gtfsCache || {
        tripToRoute: new Map(),
        stops: new Map(),
        routes: new Map(),
        stopTimes: new Map(),
        lastFetched: 0
      }
    }

    const arrayBuffer = await response.arrayBuffer()
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Parse trips.txt
    const tripsFile = zip.file('trips.txt')
    const tripToRoute = new Map<string, string>()
    if (tripsFile) {
      const content = await tripsFile.async('string')
      const lines = content.split('\n')
      const headers = parseCSVLine(lines[0])
      const routeIdIdx = headers.indexOf('route_id')
      const tripIdIdx = headers.indexOf('trip_id')

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        if (cols[tripIdIdx] && cols[routeIdIdx]) {
          tripToRoute.set(cols[tripIdIdx], cols[routeIdIdx])
        }
      }
    }
    console.log(`[Transit] Loaded ${tripToRoute.size} trip mappings`)

    // Parse stops.txt
    const stopsFile = zip.file('stops.txt')
    const stops = new Map<string, GtfsStop>()
    if (stopsFile) {
      const content = await stopsFile.async('string')
      const lines = content.split('\n')
      const headers = parseCSVLine(lines[0])
      const stopIdIdx = headers.indexOf('stop_id')
      const stopNameIdx = headers.indexOf('stop_name')
      const latIdx = headers.indexOf('stop_lat')
      const lonIdx = headers.indexOf('stop_lon')
      const wheelchairIdx = headers.indexOf('wheelchair_boarding')

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        if (cols[stopIdIdx]) {
          stops.set(cols[stopIdIdx], {
            stopId: cols[stopIdIdx],
            stopName: cols[stopNameIdx] || cols[stopIdIdx],
            latitude: parseFloat(cols[latIdx]) || 0,
            longitude: parseFloat(cols[lonIdx]) || 0,
            wheelchairBoarding: cols[wheelchairIdx] === '1'
          })
        }
      }
    }
    console.log(`[Transit] Loaded ${stops.size} stops`)

    // Parse routes.txt
    const routesFile = zip.file('routes.txt')
    const routes = new Map<string, TransitRoute>()
    if (routesFile) {
      const content = await routesFile.async('string')
      const lines = content.split('\n')
      const headers = parseCSVLine(lines[0])
      const routeIdIdx = headers.indexOf('route_id')
      const shortNameIdx = headers.indexOf('route_short_name')
      const longNameIdx = headers.indexOf('route_long_name')
      const colorIdx = headers.indexOf('route_color')
      const textColorIdx = headers.indexOf('route_text_color')

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        if (cols[routeIdIdx]) {
          routes.set(cols[routeIdIdx], {
            id: cols[routeIdIdx],
            shortName: cols[shortNameIdx] || '',
            longName: cols[longNameIdx] || '',
            color: cols[colorIdx] ? `#${cols[colorIdx]}` : '#3b82f6',
            textColor: cols[textColorIdx] ? `#${cols[textColorIdx]}` : '#ffffff'
          })
        }
      }
    }
    console.log(`[Transit] Loaded ${routes.size} routes`)

    // Parse stop_times.txt
    const stopTimesFile = zip.file('stop_times.txt')
    const stopTimes = new Map<string, GtfsStopTime[]>()
    if (stopTimesFile) {
      const content = await stopTimesFile.async('string')
      const lines = content.split('\n')
      const headers = parseCSVLine(lines[0])
      const tripIdIdx = headers.indexOf('trip_id')
      const stopIdIdx = headers.indexOf('stop_id')
      const arrivalIdx = headers.indexOf('arrival_time')
      const departureIdx = headers.indexOf('departure_time')
      const sequenceIdx = headers.indexOf('stop_sequence')

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        const tripId = cols[tripIdIdx]
        if (tripId) {
          if (!stopTimes.has(tripId)) {
            stopTimes.set(tripId, [])
          }
          stopTimes.get(tripId)!.push({
            tripId,
            stopId: cols[stopIdIdx] || '',
            arrivalTime: cols[arrivalIdx] || '',
            departureTime: cols[departureIdx] || '',
            stopSequence: parseInt(cols[sequenceIdx], 10) || 0
          })
        }
      }

      // Sort each trip's stops by sequence
      stopTimes.forEach(times => {
        times.sort((a, b) => a.stopSequence - b.stopSequence)
      })
    }
    console.log(`[Transit] Loaded stop times for ${stopTimes.size} trips`)

    gtfsCache = {
      tripToRoute,
      stops,
      routes,
      stopTimes,
      lastFetched: now
    }

    return gtfsCache
  } catch (error) {
    console.error('[Transit] Error loading GTFS:', error)
    return gtfsCache || {
      tripToRoute: new Map(),
      stops: new Map(),
      routes: new Map(),
      stopTimes: new Map(),
      lastFetched: 0
    }
  }
}

// Calculate schedule adherence
function calculateScheduleAdherence(
  tripId: string,
  currentStopSequence: number,
  vehicleTimestamp: Date,
  stopTimes: Map<string, GtfsStopTime[]>
): { adherence: ScheduleAdherence; minutesOff: number; scheduledTime?: string } {
  const times = stopTimes.get(tripId)
  if (!times || times.length === 0) {
    return { adherence: 'unknown', minutesOff: 0 }
  }

  // Find the current stop in the schedule
  const currentStop = times.find(t => t.stopSequence === currentStopSequence)
  if (!currentStop || !currentStop.arrivalTime) {
    return { adherence: 'unknown', minutesOff: 0 }
  }

  // Parse scheduled time (HH:MM:SS format, can be >24h for overnight)
  const [hours, minutes] = currentStop.arrivalTime.split(':').map(Number)
  const scheduledDate = new Date(vehicleTimestamp)
  scheduledDate.setHours(hours % 24, minutes, 0, 0)

  // Handle overnight times (e.g., 25:30:00 means 1:30 AM next day)
  if (hours >= 24) {
    scheduledDate.setDate(scheduledDate.getDate() + 1)
  }

  const diffMs = vehicleTimestamp.getTime() - scheduledDate.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  let adherence: ScheduleAdherence
  if (diffMinutes < -2) {
    adherence = 'early'
  } else if (diffMinutes > 2) {
    adherence = 'late'
  } else {
    adherence = 'on-time'
  }

  return {
    adherence,
    minutesOff: diffMinutes,
    scheduledTime: currentStop.arrivalTime
  }
}

// Get upcoming stops for a trip
function getUpcomingStops(
  tripId: string,
  currentStopSequence: number,
  stopTimes: Map<string, GtfsStopTime[]>,
  stops: Map<string, GtfsStop>,
  limit: number = 3
): TransitStop[] {
  const times = stopTimes.get(tripId)
  if (!times) return []

  return times
    .filter(t => t.stopSequence > currentStopSequence)
    .slice(0, limit)
    .map(t => {
      const stop = stops.get(t.stopId)
      return {
        id: t.stopId,
        name: stop?.stopName || t.stopId,
        sequence: t.stopSequence,
        scheduledArrival: t.arrivalTime,
        scheduledDeparture: t.departureTime,
        latitude: stop?.latitude || 0,
        longitude: stop?.longitude || 0,
        wheelchairBoarding: stop?.wheelchairBoarding
      }
    })
}

// Matches actual Passio API response structure
interface PassioVehicle {
  id: string
  vehicle: {
    vehicle: {
      id: string
      label: string
    }
    trip: {
      trip_id: string
      route_id?: string // Sometimes missing, need to lookup from trip_id
    }
    position: {
      latitude: number
      longitude: number
      bearing?: number
      speed?: number
    }
    occupancy_status?: number
    current_stop_sequence?: number
    stop_id?: string
    timestamp: number
  }
}

interface PassioFeed {
  header: {
    gtfs_realtime_version: string
    incrementality: number
    timestamp: number
  }
  entity?: PassioVehicle[]
}

export interface TransitApiResponse {
  buses: BusPosition[]
  routes: TransitRoute[]
  activeBusCount: number
  activeRoutes: string[]
  timestamp: Date
  source: string
  error?: string
}

export async function GET() {
  try {
    // Fetch GTFS cache and vehicle positions in parallel
    const [cache, response] = await Promise.all([
      getGtfsCache(),
      fetch(`${PASSIO_API}realtime/vehiclePositions.json`, {
        next: { revalidate: 30 },
        headers: {
          'Accept': 'application/json',
        }
      })
    ])

    const allRoutes = Array.from(cache.routes.values())

    if (!response.ok) {
      return NextResponse.json({
        buses: [],
        routes: allRoutes,
        activeBusCount: 0,
        activeRoutes: [],
        timestamp: new Date(),
        source: 'passio',
        error: 'Transit data temporarily unavailable'
      })
    }

    const data: PassioFeed = await response.json()

    const positions: BusPosition[] = (data.entity || []).map(entity => {
      const tripId = entity.vehicle.trip.trip_id
      const currentStopSequence = entity.vehicle.current_stop_sequence || 0
      const currentStopId = entity.vehicle.stop_id || ''
      const vehicleTimestamp = new Date(entity.vehicle.timestamp * 1000)

      // Look up route_id from trip_id using the mapping
      const routeId = entity.vehicle.trip.route_id || cache.tripToRoute.get(tripId) || 'unknown'
      const routeInfo = cache.routes.get(routeId)

      // Look up current stop name
      const currentStop = cache.stops.get(currentStopId)
      const currentStopName = currentStop?.stopName || currentStopId

      // Get occupancy status
      const occupancyRaw = entity.vehicle.occupancy_status
      const occupancyStatus: OccupancyStatus = getOccupancyFromRaw(occupancyRaw)

      // Calculate schedule adherence
      const scheduleInfo = calculateScheduleAdherence(
        tripId,
        currentStopSequence,
        vehicleTimestamp,
        cache.stopTimes
      )

      // Get upcoming stops
      const upcomingStops = getUpcomingStops(
        tripId,
        currentStopSequence,
        cache.stopTimes,
        cache.stops,
        3
      )

      // Get trip progress
      const tripStops = cache.stopTimes.get(tripId)
      const tripProgress = tripStops ? {
        currentStop: currentStopSequence,
        totalStops: tripStops.length
      } : undefined

      return {
        vehicleId: entity.vehicle.vehicle.id,
        routeId: routeId,
        routeName: routeInfo
          ? `${routeInfo.shortName} - ${routeInfo.longName}`
          : `Route ${routeId}`,
        routeColor: routeInfo?.color || '#3b82f6',
        latitude: entity.vehicle.position.latitude,
        longitude: entity.vehicle.position.longitude,
        heading: entity.vehicle.position.bearing || 0,
        speed: (entity.vehicle.position.speed || 0) * 2.237, // Convert m/s to mph
        timestamp: vehicleTimestamp,
        // Enhanced fields
        tripId,
        occupancyStatus,
        occupancyRaw,
        currentStopSequence,
        currentStopId,
        currentStopName,
        upcomingStops,
        scheduleAdherence: scheduleInfo.adherence,
        scheduledArrival: scheduleInfo.scheduledTime,
        minutesOffSchedule: scheduleInfo.minutesOff,
        tripProgress,
        // Legacy fields
        nextStop: upcomingStops[0]?.name || currentStopName,
      }
    })

    // Get unique active routes using dynamic routes
    const activeRoutes = [...new Set(positions.map(p => p.routeId))]
      .filter(id => id !== 'unknown')
      .map(id => cache.routes.get(id)?.shortName || id)
      .sort((a, b) => {
        const numA = parseInt(a)
        const numB = parseInt(b)
        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b)
        if (isNaN(numA)) return 1
        if (isNaN(numB)) return -1
        return numA - numB
      })

    const apiResponse: TransitApiResponse = {
      buses: positions,
      routes: allRoutes,
      activeBusCount: positions.length,
      activeRoutes,
      timestamp: new Date(),
      source: 'passio'
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Transit API error:', error)
    return NextResponse.json(
      {
        buses: [],
        routes: [],
        activeBusCount: 0,
        activeRoutes: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Transit data temporarily unavailable'
      },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}
