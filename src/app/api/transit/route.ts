import { NextResponse } from 'next/server'
import type { BusPosition, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

// Sioux City Transit uses Passio GO
const PASSIO_API = 'https://passio3.com/sioux-city/passioTransit/gtfs/realtime/'

interface PassioVehicle {
  id: string
  vehicle: {
    trip: {
      routeId: string
    }
    position: {
      latitude: number
      longitude: number
      bearing?: number
      speed?: number
    }
    timestamp: string
  }
}

interface PassioFeed {
  entity?: PassioVehicle[]
}

export async function GET() {
  try {
    // Try to fetch from Passio GO
    const response = await fetch(`${PASSIO_API}vehiclePositions.json`, {
      next: { revalidate: 30 }
    })

    if (!response.ok) {
      // Passio API might not be publicly accessible
      // Return empty array for now
      return NextResponse.json({
        data: [],
        timestamp: new Date(),
        source: 'passio',
        error: 'Transit data temporarily unavailable'
      })
    }

    const data: PassioFeed = await response.json()

    const positions: BusPosition[] = (data.entity || []).map(entity => ({
      vehicleId: entity.id,
      routeId: entity.vehicle.trip.routeId,
      routeName: `Route ${entity.vehicle.trip.routeId}`,
      latitude: entity.vehicle.position.latitude,
      longitude: entity.vehicle.position.longitude,
      heading: entity.vehicle.position.bearing || 0,
      speed: entity.vehicle.position.speed || 0,
      timestamp: new Date(entity.vehicle.timestamp)
    }))

    const apiResponse: ApiResponse<BusPosition[]> = {
      data: positions,
      timestamp: new Date(),
      source: 'passio'
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Transit API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Transit data temporarily unavailable'
      },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}
