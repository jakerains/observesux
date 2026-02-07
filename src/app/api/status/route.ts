import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Direct upstream health checks — no self-referencing fetch fan-out.
// Each entry hits the real external API with a lightweight HEAD or small GET request.
const UPSTREAM_CHECKS: Record<string, { url: string; method?: string; headers?: Record<string, string> }> = {
  cameras: {
    url: 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Traffic_Cameras_View/FeatureServer/0/query?f=json&where=1%3D1&resultRecordCount=1&returnGeometry=false',
  },
  weather: {
    url: 'https://api.weather.gov/stations/KSUX/observations/latest',
    headers: {
      'User-Agent': 'SiouxlandOnline/1.0 (https://siouxland.online)',
      'Accept': 'application/geo+json',
    },
  },
  rivers: {
    url: 'https://waterservices.usgs.gov/nwis/iv/?sites=06486000&parameterCd=00065&format=json',
  },
  airQuality: {
    // AirNow requires an API key; if present, check AirNow, otherwise check the Mesonet fallback
    url: process.env.AIRNOW_API_KEY
      ? `https://www.airnowapi.org/aq/observation/latLong/current/?format=json&latitude=42.5&longitude=-96.4&distance=50&API_KEY=${process.env.AIRNOW_API_KEY}`
      : 'https://mesonet.agron.iastate.edu/json/current.py?network=IA_ASOS&station=SUX',
  },
  transit: {
    url: 'https://passio3.com/siouxcity/passioTransit/gtfs/realtime/vehiclePositions.json',
    method: 'HEAD',
  },
  earthquakes: {
    url: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=42.5&longitude=-96.4&maxradiuskm=500&minmagnitude=2&limit=1',
  },
  trafficEvents: {
    url: 'https://data.iowa.gov/api/views/yata-4k7n/rows.json?accessType=DOWNLOAD',
    method: 'HEAD',
  },
  snowplows: {
    url: 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/AVL_Trucks_Iowa_DOT/FeatureServer/0/query?f=json&where=1%3D1&resultRecordCount=1&returnGeometry=false',
  },
  news: {
    url: 'https://news.google.com/rss/search?q=Sioux+City+Iowa&hl=en-US&gl=US&ceid=US:en',
    method: 'HEAD',
  },
  aviation: {
    url: 'https://aviationweather.gov/api/data/metar?ids=KSUX&format=json',
  },
  aircraft: {
    url: 'https://api.airplanes.live/v2/point/42.4036/-96.3844/50',
  },
}

// Routes that are purely database-backed or return static/demo data — always healthy
const DB_ONLY_ROUTES = ['gasPrices', 'events', 'outages', 'flights'] as const

async function checkUpstream(name: string, config: { url: string; method?: string; headers?: Record<string, string> }): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(config.url, {
      method: config.method || 'GET',
      signal: controller.signal,
      headers: config.headers,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

export async function GET() {
  // Check all external upstreams in parallel
  const entries = Object.entries(UPSTREAM_CHECKS)
  const results = await Promise.all(
    entries.map(([name, config]) => checkUpstream(name, config))
  )

  // Build result object
  const status: Record<string, boolean> = {}
  entries.forEach(([name], i) => {
    status[name] = results[i]
  })

  // DB-only routes are always considered healthy
  for (const route of DB_ONLY_ROUTES) {
    status[route] = true
  }

  return NextResponse.json({
    ...status,
    timestamp: new Date().toISOString(),
  })
}
