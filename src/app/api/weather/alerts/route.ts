import { NextResponse } from 'next/server'
import { fetchNWSAlerts } from '@/lib/fetchers/nws'
import type { WeatherAlert, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const alerts = await fetchNWSAlerts()

    // Sort by severity
    const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    const response: ApiResponse<WeatherAlert[]> = {
      data: alerts,
      timestamp: new Date(),
      source: 'nws'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' }
    })
  } catch (error) {
    console.error('Weather alerts API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch weather alerts'
      },
      { status: 500 }
    )
  }
}
