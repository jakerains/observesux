import { NextResponse } from 'next/server'
import { fetchAirQuality } from '@/lib/fetchers/airnow'
import { storeAirQualityReading } from '@/lib/db/historical'
import type { AirQualityReading, ApiResponse } from '@/types'

export const revalidate = 3600 // Revalidate every hour (AirNow updates hourly)

export async function GET() {
  try {
    const reading = await fetchAirQuality()

    // Store reading to database for historical tracking (non-blocking)
    storeAirQualityReading({
      aqi: reading.aqi,
      category: reading.category,
      primaryPollutant: reading.primaryPollutant,
      pm25: reading.pm25,
      source: reading.source,
      observedAt: new Date(reading.timestamp)
    }).catch(() => {}) // Silently fail

    const response: ApiResponse<AirQualityReading> = {
      data: reading,
      timestamp: new Date(),
      source: reading.source
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' }
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
