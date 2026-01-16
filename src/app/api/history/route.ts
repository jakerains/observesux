import { NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import {
  getWeatherHistory,
  getRiverHistory,
  getAirQualityHistory,
  getRecentAlerts
} from '@/lib/db/historical'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Check if database is configured
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'Database not configured. Add DATABASE_URL to .env.local to enable historical data.',
      weather: [],
      rivers: { bigSioux: [], missouri: [] },
      airQuality: [],
      alerts: []
    })
  }

  const { searchParams } = new URL(request.url)
  const hours = parseInt(searchParams.get('hours') || '24', 10)
  const type = searchParams.get('type') // 'weather', 'rivers', 'air', 'alerts', or 'all'

  try {
    const data: Record<string, unknown> = {
      configured: true,
      hours
    }

    // Fetch requested data types
    if (type === 'weather' || type === 'all' || !type) {
      data.weather = await getWeatherHistory(hours)
    }

    if (type === 'rivers' || type === 'all' || !type) {
      data.rivers = {
        bigSioux: await getRiverHistory('06485950', hours),
        missouri: await getRiverHistory('06486000', hours)
      }
    }

    if (type === 'air' || type === 'all' || !type) {
      data.airQuality = await getAirQualityHistory(hours)
    }

    if (type === 'alerts' || type === 'all' || !type) {
      data.alerts = await getRecentAlerts(7)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json({
      configured: true,
      error: 'Failed to fetch historical data',
      weather: [],
      rivers: { bigSioux: [], missouri: [] },
      airQuality: [],
      alerts: []
    }, { status: 500 })
  }
}
