import { NextResponse } from 'next/server'
import type { BusPosition, TransitRoute } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

// Sioux City Transit uses Passio GO
const PASSIO_API = 'https://passio3.com/siouxcity/passioTransit/gtfs/'

// Route info from actual GTFS routes.txt data
const ROUTE_INFO: Record<string, TransitRoute> = {
  '6361': { id: '6361', shortName: '11', longName: 'Airport', color: '#1F77B4', textColor: '#FFFFFF' },
  '6391': { id: '6391', shortName: '7', longName: 'Council Oaks', color: '#FF7F0E', textColor: '#FFFFFF' },
  '6392': { id: '6392', shortName: '8', longName: 'Indian Hills', color: '#2CA02C', textColor: '#FFFFFF' },
  '6396': { id: '6396', shortName: '4', longName: 'Leeds', color: '#D62728', textColor: '#FFFFFF' },
  '6397': { id: '6397', shortName: '10', longName: 'Mall-Commons', color: '#9467BD', textColor: '#FFFFFF' },
  '6398': { id: '6398', shortName: '3', longName: 'Marketplace', color: '#E377C2', textColor: '#000000' },
  '6399': { id: '6399', shortName: '2', longName: 'Pierce-Jackson', color: '#BCBD22', textColor: '#000000' },
  '6400': { id: '6400', shortName: '5', longName: 'Riverside', color: '#17BECF', textColor: '#000000' },
  '6390': { id: '6390', shortName: 'S', longName: 'School Tripper', color: '#000000', textColor: '#FFFFFF' },
  '6401': { id: '6401', shortName: '6', longName: 'Singing Hills', color: '#98DF8A', textColor: '#000000' },
  '6402': { id: '6402', shortName: '9', longName: 'South Sioux City', color: '#F7B6D2', textColor: '#000000' },
  '6403': { id: '6403', shortName: '1', longName: 'Sunnybrook', color: '#637939', textColor: '#FFFFFF' },
}

// Cache for trip_id -> route_id mapping
let tripToRouteMap: Map<string, string> | null = null
let tripMapLastFetched = 0
const TRIP_MAP_TTL = 1000 * 60 * 60 // 1 hour cache

async function getTripToRouteMap(): Promise<Map<string, string>> {
  const now = Date.now()

  // Return cached map if still valid
  if (tripToRouteMap && (now - tripMapLastFetched) < TRIP_MAP_TTL) {
    return tripToRouteMap
  }

  try {
    // Fetch trips.txt from GTFS static feed
    const response = await fetch(`${PASSIO_API}google_transit.zip`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      console.error('Failed to fetch GTFS zip')
      return tripToRouteMap || new Map()
    }

    const arrayBuffer = await response.arrayBuffer()
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(arrayBuffer)

    const tripsFile = zip.file('trips.txt')
    if (!tripsFile) {
      console.error('trips.txt not found in GTFS zip')
      return tripToRouteMap || new Map()
    }

    const tripsContent = await tripsFile.async('string')
    const lines = tripsContent.split('\n')
    const headers = lines[0].split(',')
    const routeIdIndex = headers.indexOf('route_id')
    const tripIdIndex = headers.indexOf('trip_id')

    const newMap = new Map<string, string>()
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols[tripIdIndex] && cols[routeIdIndex]) {
        newMap.set(cols[tripIdIndex].trim(), cols[routeIdIndex].trim())
      }
    }

    tripToRouteMap = newMap
    tripMapLastFetched = now
    console.log(`Loaded ${newMap.size} trip->route mappings`)
    return newMap
  } catch (error) {
    console.error('Error loading trip map:', error)
    return tripToRouteMap || new Map()
  }
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
    // Fetch trip-to-route mapping and vehicle positions in parallel
    const [tripMap, response] = await Promise.all([
      getTripToRouteMap(),
      fetch(`${PASSIO_API}realtime/vehiclePositions.json`, {
        next: { revalidate: 30 },
        headers: {
          'Accept': 'application/json',
        }
      })
    ])

    if (!response.ok) {
      return NextResponse.json({
        buses: [],
        routes: Object.values(ROUTE_INFO),
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
      // Look up route_id from trip_id using the mapping
      const routeId = entity.vehicle.trip.route_id || tripMap.get(tripId) || 'unknown'
      const routeInfo = ROUTE_INFO[routeId]

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
        timestamp: new Date(entity.vehicle.timestamp * 1000),
        nextStop: entity.vehicle.stop_id,
      }
    })

    // Get unique active routes
    const activeRoutes = [...new Set(positions.map(p => p.routeId))]
      .filter(id => id !== 'unknown')
      .map(id => ROUTE_INFO[id]?.shortName || id)
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
      routes: Object.values(ROUTE_INFO),
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
        routes: Object.values(ROUTE_INFO),
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
