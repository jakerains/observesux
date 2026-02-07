import { NextResponse } from 'next/server'
import type { Flight, ApiResponse } from '@/types'

export const revalidate = 300 // Revalidate every 5 minutes

// Note: Flight data typically requires paid API access (FlightAware, AeroAPI, etc.)
// For demonstration, we'll return sample schedule data
// In production, you'd integrate with FlightAware's AeroAPI or similar

export async function GET() {
  try {
    // Sample flight schedule for KSUX (Sioux City Gateway Airport)
    // In production, this would come from FlightAware or AviationEdge API

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Typical flights at SUX (small regional airport)
    const arrivals: Flight[] = [
      {
        flightNumber: 'UA 5432',
        airline: 'United Express',
        origin: 'ORD',
        originCity: 'Chicago O\'Hare',
        destination: 'SUX',
        destinationCity: 'Sioux City',
        scheduledTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
        status: 'scheduled',
        type: 'arrival',
        aircraft: 'CRJ-200'
      },
      {
        flightNumber: 'AA 3892',
        airline: 'American Eagle',
        origin: 'DFW',
        originCity: 'Dallas/Fort Worth',
        destination: 'SUX',
        destinationCity: 'Sioux City',
        scheduledTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
        status: 'scheduled',
        type: 'arrival',
        aircraft: 'ERJ-145'
      }
    ]

    const departures: Flight[] = [
      {
        flightNumber: 'UA 5433',
        airline: 'United Express',
        origin: 'SUX',
        originCity: 'Sioux City',
        destination: 'ORD',
        destinationCity: 'Chicago O\'Hare',
        scheduledTime: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6 AM
        status: 'departed',
        type: 'departure',
        aircraft: 'CRJ-200'
      },
      {
        flightNumber: 'AA 3893',
        airline: 'American Eagle',
        origin: 'SUX',
        originCity: 'Sioux City',
        destination: 'DFW',
        destinationCity: 'Dallas/Fort Worth',
        scheduledTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM
        status: 'scheduled',
        type: 'departure',
        aircraft: 'ERJ-145'
      }
    ]

    // Update status based on current time
    const updateFlightStatus = (flight: Flight): Flight => {
      const diff = now.getTime() - flight.scheduledTime.getTime()
      const hoursDiff = diff / (1000 * 60 * 60)

      if (hoursDiff > 1) {
        return { ...flight, status: flight.type === 'arrival' ? 'arrived' : 'departed' }
      } else if (hoursDiff > 0) {
        return { ...flight, status: flight.type === 'arrival' ? 'landed' : 'departed' }
      } else if (hoursDiff > -0.5) {
        return { ...flight, status: flight.type === 'arrival' ? 'in_air' : 'boarding' }
      }
      return flight
    }

    const response: ApiResponse<{ arrivals: Flight[]; departures: Flight[] }> = {
      data: {
        arrivals: arrivals.map(updateFlightStatus),
        departures: departures.map(updateFlightStatus)
      },
      timestamp: new Date(),
      source: 'demo' // Would be 'flightaware' or 'aeroappi' in production
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch (error) {
    console.error('Flights API error:', error)
    return NextResponse.json(
      {
        data: { arrivals: [], departures: [] },
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch flight data'
      },
      { status: 500 }
    )
  }
}
