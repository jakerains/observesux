import { NextResponse } from 'next/server'
import { fetchNWSForecast, fetchNWSHourlyForecast } from '@/lib/fetchers/nws'
import type { WeatherForecast, HourlyWeatherForecast, ApiResponse } from '@/types'

export const revalidate = 300 // Revalidate every 5 minutes

export interface ForecastResponse {
  forecast: WeatherForecast
  hourly: HourlyWeatherForecast
}

export async function GET() {
  try {
    // Fetch both forecasts in parallel
    const [forecast, hourly] = await Promise.all([
      fetchNWSForecast(),
      fetchNWSHourlyForecast()
    ])

    const response: ApiResponse<ForecastResponse> = {
      data: {
        forecast,
        hourly
      },
      timestamp: new Date(),
      source: 'nws'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch (error) {
    console.error('Forecast API error:', error)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch forecast data'
      },
      { status: 500 }
    )
  }
}
