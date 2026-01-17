import { NextResponse } from 'next/server'
import type { BusPosition, TransitRoute, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

// Sioux City Transit uses Passio GO (note: no hyphen in URL)
const PASSIO_API = 'https://passio3.com/siouxcity/passioTransit/gtfs/realtime/'

// Route info from GTFS data with colors
const ROUTE_INFO: Record<string, TransitRoute> = {
  '9750': { id: '9750', shortName: '1', longName: 'Southern Hills', color: '#9ebbd7', textColor: '#000000' },
  '9751': { id: '9751', shortName: '2', longName: 'Pierce Jackson', color: '#9ed7c2', textColor: '#000000' },
  '76111': { id: '76111', shortName: '11', longName: 'Airport', color: '#862893', textColor: '#ffffff' },
  '9752': { id: '9752', shortName: '3', longName: 'Marketplace', color: '#f5ca7a', textColor: '#000000' },
  '9753': { id: '9753', shortName: '4', longName: 'Leeds', color: '#e69800', textColor: '#ffffff' },
  '9754': { id: '9754', shortName: '5', longName: 'Riverside', color: '#e6e600', textColor: '#000000' },
  '9755': { id: '9755', shortName: '6', longName: 'Singing Hills', color: '#967d51', textColor: '#ffffff' },
  '9756': { id: '9756', shortName: '7', longName: 'Council Oaks', color: '#ff5500', textColor: '#ffffff' },
  '9758': { id: '9758', shortName: '8', longName: 'Indian Hills', color: '#df73ff', textColor: '#000000' },
  '9759': { id: '9759', shortName: '9', longName: 'South Sioux', color: '#ff0000', textColor: '#ffffff' },
  '9760': { id: '9760', shortName: '10', longName: 'Commons', color: '#cd6699', textColor: '#ffffff' },
}

interface PassioVehicle {
  id: string
  vehicle: {
    trip: {
      tripId?: string
      routeId: string
      startTime?: string
      startDate?: string
    }
    position: {
      latitude: number
      longitude: number
      bearing?: number
      speed?: number
    }
    currentStopSequence?: number
    stopId?: string
    timestamp: string
  }
}

interface PassioFeed {
  header: {
    gtfs_realtime_version: string
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
    // Fetch real-time vehicle positions from Passio GO
    const response = await fetch(`${PASSIO_API}vehiclePositions.json`, {
      next: { revalidate: 30 },
      headers: {
        'Accept': 'application/json',
      }
    })

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
      const routeInfo = ROUTE_INFO[entity.vehicle.trip.routeId]
      return {
        vehicleId: entity.id,
        routeId: entity.vehicle.trip.routeId,
        routeName: routeInfo
          ? `${routeInfo.shortName} - ${routeInfo.longName}`
          : `Route ${entity.vehicle.trip.routeId}`,
        routeColor: routeInfo?.color || '#3b82f6',
        latitude: entity.vehicle.position.latitude,
        longitude: entity.vehicle.position.longitude,
        heading: entity.vehicle.position.bearing || 0,
        speed: (entity.vehicle.position.speed || 0) * 2.237, // Convert m/s to mph
        timestamp: new Date(parseInt(entity.vehicle.timestamp) * 1000),
        nextStop: entity.vehicle.stopId,
      }
    })

    // Get unique active routes
    const activeRoutes = [...new Set(positions.map(p => p.routeId))]
      .map(id => ROUTE_INFO[id]?.shortName || id)
      .sort((a, b) => parseInt(a) - parseInt(b))

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
