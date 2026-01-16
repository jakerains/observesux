import { NextResponse } from 'next/server'
import { fetchNWSObservations } from '@/lib/fetchers/nws'
import { storeWeatherObservation } from '@/lib/db/historical'
import type { WeatherObservation, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

export async function GET() {
  try {
    const observation = await fetchNWSObservations()

    // Store observation to database for historical tracking (non-blocking)
    storeWeatherObservation({
      temperature: observation.temperature,
      feelsLike: observation.feelsLike,
      humidity: observation.humidity,
      windSpeed: observation.windSpeed,
      windDirection: observation.windDirection,
      windGust: observation.windGust,
      conditions: observation.conditions,
      visibility: observation.visibility,
      pressure: observation.pressure,
      observedAt: new Date(observation.timestamp)
    }).catch(() => {}) // Silently fail - don't block response

    const response: ApiResponse<WeatherObservation> = {
      data: observation,
      timestamp: new Date(),
      source: 'nws'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch weather data'
      },
      { status: 500 }
    )
  }
}
