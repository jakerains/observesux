import { NextResponse } from 'next/server'
import { fetchAirQuality } from '@/lib/fetchers/airnow'
import type { AirQualityReading, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const reading = await fetchAirQuality()

    const response: ApiResponse<AirQualityReading> = {
      data: reading,
      timestamp: new Date(),
      source: reading.source
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600' }
    })
  } catch (error) {
    console.error('Air quality API error:', error)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch air quality data'
      },
      { status: 500 }
    )
  }
}
