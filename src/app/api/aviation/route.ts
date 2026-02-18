import { NextResponse } from 'next/server'
import { fetchAviationWeather } from '@/lib/fetchers/aviation'
import type { AviationWeather, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const aviationWeather = await fetchAviationWeather()

    const response: ApiResponse<AviationWeather> = {
      data: aviationWeather,
      timestamp: new Date(),
      source: 'aviationweather.gov',
      cached: false
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=120' }
    })
  } catch (error) {
    console.error('Aviation weather API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch aviation weather data',
        timestamp: new Date(),
        source: 'aviationweather.gov'
      },
      { status: 500 }
    )
  }
}
