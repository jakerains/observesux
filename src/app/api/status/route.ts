import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Simple health check endpoint for all data sources
export async function GET(request: NextRequest) {
  // Use the request's origin to construct base URL (works on both Vercel and localhost)
  const baseUrl = new URL(request.url).origin

  // Check each endpoint with a timeout
  async function checkEndpoint(path: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  // Check all endpoints in parallel
  const [
    cameras,
    weather,
    rivers,
    airQuality,
    transit,
    outages,
    flights,
    earthquakes,
    trafficEvents,
    snowplows,
    news,
    aviation,
    aircraft,
    gasPrices,
    events,
  ] = await Promise.all([
    checkEndpoint('/api/cameras'),
    checkEndpoint('/api/weather'),
    checkEndpoint('/api/rivers'),
    checkEndpoint('/api/air-quality'),
    checkEndpoint('/api/transit'),
    checkEndpoint('/api/outages'),
    checkEndpoint('/api/flights'),
    checkEndpoint('/api/earthquakes'),
    checkEndpoint('/api/traffic-events'),
    checkEndpoint('/api/snowplows'),
    checkEndpoint('/api/news'),
    checkEndpoint('/api/aviation'),
    checkEndpoint('/api/aircraft'),
    checkEndpoint('/api/gas-prices'),
    checkEndpoint('/api/events'),
  ])

  return NextResponse.json({
    cameras,
    weather,
    rivers,
    airQuality,
    transit,
    outages,
    flights,
    earthquakes,
    trafficEvents,
    snowplows,
    news,
    aviation,
    aircraft,
    gasPrices,
    events,
    timestamp: new Date().toISOString()
  })
}
