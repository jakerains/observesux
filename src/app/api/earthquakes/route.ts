import { NextResponse } from 'next/server'
import { fetchEarthquakes } from '@/lib/fetchers/usgs'
import type { Earthquake, ApiResponse } from '@/types'

export const revalidate = 600 // Revalidate every 10 minutes

export async function GET() {
  try {
    const earthquakes = await fetchEarthquakes()

    // Sort by time (most recent first)
    earthquakes.sort((a, b) => b.time.getTime() - a.time.getTime())

    const response: ApiResponse<Earthquake[]> = {
      data: earthquakes,
      timestamp: new Date(),
      source: 'usgs'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' }
    })
  } catch (error) {
    console.error('Earthquakes API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch earthquake data'
      },
      { status: 500 }
    )
  }
}
