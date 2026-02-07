import { NextRequest, NextResponse } from 'next/server'
import type { GtfsStop, TransitRoute, RouteShape, GtfsStopTime } from '@/types'

export const revalidate = 3600 // 1 hour

const PASSIO_API = 'https://passio3.com/siouxcity/passioTransit/gtfs/'

// In-memory cache for GTFS data
interface GtfsCache {
  stops: Map<string, GtfsStop>
  routes: TransitRoute[]
  shapes: Map<string, RouteShape>
  stopTimes: Map<string, GtfsStopTime[]>
  tripToRoute: Map<string, string>
  tripToShape: Map<string, string>
  routeStops: Map<string, string[]> // routeId -> stopIds in order
  lastFetched: number
}

let gtfsCache: GtfsCache | null = null
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

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

// Parse a GTFS CSV file
function parseGtfsFile<T>(content: string, transform: (row: Record<string, string>) => T): T[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const headers = parseCSVLine(lines[0])
  const results: T[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    try {
      results.push(transform(row))
    } catch {
      // Skip malformed rows
    }
  }

  return results
}

async function loadGtfsData(): Promise<GtfsCache> {
  const now = Date.now()

  if (gtfsCache && (now - gtfsCache.lastFetched) < CACHE_TTL) {
    return gtfsCache
  }

  console.log('[GTFS] Loading GTFS static data...')

  const response = await fetch(`${PASSIO_API}google_transit.zip`, {
    next: { revalidate: 3600 }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch GTFS zip: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Parse stops.txt
  const stopsFile = zip.file('stops.txt')
  const stopsContent = stopsFile ? await stopsFile.async('string') : ''
  const stops = new Map<string, GtfsStop>()

  parseGtfsFile(stopsContent, row => ({
    stopId: row.stop_id,
    stopName: row.stop_name,
    latitude: parseFloat(row.stop_lat),
    longitude: parseFloat(row.stop_lon),
    wheelchairBoarding: row.wheelchair_boarding === '1'
  })).forEach(stop => {
    if (stop.stopId && !isNaN(stop.latitude)) {
      stops.set(stop.stopId, stop)
    }
  })

  console.log(`[GTFS] Loaded ${stops.size} stops`)

  // Parse routes.txt
  const routesFile = zip.file('routes.txt')
  const routesContent = routesFile ? await routesFile.async('string') : ''
  const routes: TransitRoute[] = parseGtfsFile(routesContent, row => ({
    id: row.route_id,
    shortName: row.route_short_name,
    longName: row.route_long_name,
    color: row.route_color ? `#${row.route_color}` : '#3b82f6',
    textColor: row.route_text_color ? `#${row.route_text_color}` : '#ffffff'
  })).filter(route => route.id)

  console.log(`[GTFS] Loaded ${routes.length} routes`)

  // Parse shapes.txt
  const shapesFile = zip.file('shapes.txt')
  const shapesContent = shapesFile ? await shapesFile.async('string') : ''
  const shapePoints: Array<{ shapeId: string; lat: number; lon: number; sequence: number }> =
    parseGtfsFile(shapesContent, row => ({
      shapeId: row.shape_id,
      lat: parseFloat(row.shape_pt_lat),
      lon: parseFloat(row.shape_pt_lon),
      sequence: parseInt(row.shape_pt_sequence, 10)
    })).filter(pt => pt.shapeId && !isNaN(pt.lat))

  // Group shape points by shape_id and sort by sequence
  const shapeGroups = new Map<string, Array<{ lat: number; lon: number; sequence: number }>>()
  shapePoints.forEach(pt => {
    if (!shapeGroups.has(pt.shapeId)) {
      shapeGroups.set(pt.shapeId, [])
    }
    shapeGroups.get(pt.shapeId)!.push({ lat: pt.lat, lon: pt.lon, sequence: pt.sequence })
  })

  const shapes = new Map<string, RouteShape>()
  shapeGroups.forEach((points, shapeId) => {
    points.sort((a, b) => a.sequence - b.sequence)
    shapes.set(shapeId, {
      routeId: '', // Will be filled in from trips
      shapeId,
      coordinates: points.map(pt => [pt.lat, pt.lon] as [number, number]),
      color: '#3b82f6'
    })
  })

  console.log(`[GTFS] Loaded ${shapes.size} shapes with ${shapePoints.length} points`)

  // Parse trips.txt to get trip->route and trip->shape mappings
  const tripsFile = zip.file('trips.txt')
  const tripsContent = tripsFile ? await tripsFile.async('string') : ''
  const tripToRoute = new Map<string, string>()
  const tripToShape = new Map<string, string>()
  const routeToShape = new Map<string, string>() // First shape per route

  parseGtfsFile(tripsContent, row => ({
    tripId: row.trip_id,
    routeId: row.route_id,
    shapeId: row.shape_id
  })).forEach(trip => {
    if (trip.tripId && trip.routeId) {
      tripToRoute.set(trip.tripId, trip.routeId)
      if (trip.shapeId) {
        tripToShape.set(trip.tripId, trip.shapeId)
        if (!routeToShape.has(trip.routeId)) {
          routeToShape.set(trip.routeId, trip.shapeId)
        }
      }
    }
  })

  console.log(`[GTFS] Loaded ${tripToRoute.size} trip mappings`)

  // Associate shapes with routes and colors
  const routeMap = new Map(routes.map(r => [r.id, r]))
  routeToShape.forEach((shapeId, routeId) => {
    const shape = shapes.get(shapeId)
    const route = routeMap.get(routeId)
    if (shape && route) {
      shape.routeId = routeId
      shape.color = route.color
    }
  })

  // Parse stop_times.txt
  const stopTimesFile = zip.file('stop_times.txt')
  const stopTimesContent = stopTimesFile ? await stopTimesFile.async('string') : ''
  const allStopTimes: GtfsStopTime[] = parseGtfsFile(stopTimesContent, row => ({
    tripId: row.trip_id,
    stopId: row.stop_id,
    arrivalTime: row.arrival_time,
    departureTime: row.departure_time,
    stopSequence: parseInt(row.stop_sequence, 10)
  })).filter(st => st.tripId && st.stopId && !isNaN(st.stopSequence))

  // Group stop times by trip_id
  const stopTimes = new Map<string, GtfsStopTime[]>()
  allStopTimes.forEach(st => {
    if (!stopTimes.has(st.tripId)) {
      stopTimes.set(st.tripId, [])
    }
    stopTimes.get(st.tripId)!.push(st)
  })

  // Sort each trip's stop times by sequence
  stopTimes.forEach(times => {
    times.sort((a, b) => a.stopSequence - b.stopSequence)
  })

  console.log(`[GTFS] Loaded ${allStopTimes.length} stop times for ${stopTimes.size} trips`)

  // Build route->stops mapping (get stops from first trip of each route)
  const routeStops = new Map<string, string[]>()
  const seenRoutes = new Set<string>()

  tripToRoute.forEach((routeId, tripId) => {
    if (seenRoutes.has(routeId)) return
    const times = stopTimes.get(tripId)
    if (times && times.length > 0) {
      routeStops.set(routeId, times.map(t => t.stopId))
      seenRoutes.add(routeId)
    }
  })

  console.log(`[GTFS] Built stop lists for ${routeStops.size} routes`)

  gtfsCache = {
    stops,
    routes,
    shapes,
    stopTimes,
    tripToRoute,
    tripToShape,
    routeStops,
    lastFetched: now
  }

  return gtfsCache
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const routeId = searchParams.get('routeId')

    const data = await loadGtfsData()

    switch (type) {
      case 'stops': {
        // Return all stops or stops for a specific route
        if (routeId) {
          const stopIds = data.routeStops.get(routeId) || []
          const routeStops = stopIds
            .map(id => data.stops.get(id))
            .filter((s): s is GtfsStop => s !== undefined)
          return NextResponse.json({
            stops: routeStops,
            routeId,
            timestamp: new Date().toISOString()
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
          })
        }
        return NextResponse.json({
          stops: Array.from(data.stops.values()),
          timestamp: new Date().toISOString()
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
        })
      }

      case 'routes': {
        return NextResponse.json({
          routes: data.routes,
          timestamp: new Date().toISOString()
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
        })
      }

      case 'shapes': {
        // Return shape for a specific route
        if (routeId) {
          // Find shape for this route
          const matchingShapes = Array.from(data.shapes.values())
            .filter(s => s.routeId === routeId)
          return NextResponse.json({
            shapes: matchingShapes,
            routeId,
            timestamp: new Date().toISOString()
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
          })
        }
        // Return all shapes with route associations
        return NextResponse.json({
          shapes: Array.from(data.shapes.values()),
          timestamp: new Date().toISOString()
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
        })
      }

      case 'schedule': {
        // Return stop times for a specific trip
        const tripId = searchParams.get('tripId')
        if (tripId) {
          const times = data.stopTimes.get(tripId) || []
          // Enrich with stop names
          const enrichedTimes = times.map(t => ({
            ...t,
            stopName: data.stops.get(t.stopId)?.stopName || t.stopId,
            latitude: data.stops.get(t.stopId)?.latitude,
            longitude: data.stops.get(t.stopId)?.longitude
          }))
          return NextResponse.json({
            stopTimes: enrichedTimes,
            tripId,
            timestamp: new Date().toISOString()
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
          })
        }
        return NextResponse.json({ error: 'tripId required for schedule' }, { status: 400 })
      }

      case 'lookup': {
        // Lookup specific stop or stops
        const stopId = searchParams.get('stopId')
        const stopIds = searchParams.get('stopIds')

        if (stopId) {
          const stop = data.stops.get(stopId)
          return NextResponse.json({
            stop: stop || null,
            timestamp: new Date().toISOString()
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
          })
        }

        if (stopIds) {
          const ids = stopIds.split(',')
          const foundStops = ids
            .map(id => data.stops.get(id.trim()))
            .filter((s): s is GtfsStop => s !== undefined)
          return NextResponse.json({
            stops: foundStops,
            timestamp: new Date().toISOString()
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
          })
        }

        return NextResponse.json({ error: 'stopId or stopIds required' }, { status: 400 })
      }

      case 'summary': {
        // Return summary stats
        return NextResponse.json({
          stopCount: data.stops.size,
          routeCount: data.routes.length,
          shapeCount: data.shapes.size,
          tripCount: data.tripToRoute.size,
          cacheAge: Date.now() - data.lastFetched,
          timestamp: new Date().toISOString()
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
        })
      }

      default: {
        // Return everything (for initial load)
        return NextResponse.json({
          stops: Object.fromEntries(data.stops),
          routes: data.routes,
          shapes: Array.from(data.shapes.values()),
          routeStops: Object.fromEntries(data.routeStops),
          timestamp: new Date().toISOString()
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
        })
      }
    }
  } catch (error) {
    console.error('[GTFS] Error loading GTFS data:', error)
    return NextResponse.json(
      { error: 'Failed to load GTFS data', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
