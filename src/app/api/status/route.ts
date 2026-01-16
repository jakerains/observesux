import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Simple health check endpoint for all data sources
export async function GET(request: NextRequest) {
  // Construct base URL from the request or Vercel environment
  const protocol = process.env.VERCEL_URL ? 'https' : 'http'
  const host = process.env.VERCEL_URL || request.headers.get('host') || 'localhost:3000'
  const baseUrl = `${protocol}://${host}`

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
  const [cameras, weather, rivers, airQuality, transit, outages, flights, earthquakes] =
    await Promise.all([
      checkEndpoint('/api/cameras'),
      checkEndpoint('/api/weather'),
      checkEndpoint('/api/rivers'),
      checkEndpoint('/api/air-quality'),
      checkEndpoint('/api/transit'),
      checkEndpoint('/api/outages'),
      checkEndpoint('/api/flights'),
      checkEndpoint('/api/earthquakes')
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
    timestamp: new Date().toISOString()
  })
}
