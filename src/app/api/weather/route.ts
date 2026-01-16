import { NextResponse } from 'next/server'
import { fetchNWSObservations } from '@/lib/fetchers/nws'
import type { WeatherObservation, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

export async function GET() {
  try {
    const observation = await fetchNWSObservations()

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
