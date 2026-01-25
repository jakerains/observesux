import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { scrapeGasPrices, type ScrapedGasStation } from '@/lib/fetchers/gasbuddy'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Allow up to 5 minutes for scraping (Pro plan)

/**
 * Cron endpoint to scrape gas prices and update database
 * Runs daily at 12:00 UTC (6 AM Central) via Vercel Cron
 *
 * GET /api/cron/gas-prices
 */
function verifyCronRequest(request: NextRequest): boolean {
  // Method 1: Vercel cron sends this header automatically
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  // Method 2: Check CRON_SECRET if configured (for manual testing)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  // Method 3: Allow in development
  const isDev = process.env.NODE_ENV === 'development'

  return isVercelCron || hasValidSecret || isDev
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    console.warn('[Gas Prices Cron] Unauthorized request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  try {
    console.log('[Gas Prices Cron] Starting gas price scrape...')

    // Step 1: Scrape gas prices from GasBuddy
    const stations = await scrapeGasPrices()

    if (stations.length === 0) {
      console.warn('[Gas Prices Cron] No stations returned from scraper')
      return NextResponse.json({
        success: false,
        message: 'No stations found',
        stationsScraped: 0,
        pricesInserted: 0,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`[Gas Prices Cron] Scraped ${stations.length} stations`)

    // Step 2: Process and save each station
    let totalPricesInserted = 0
    let newStations = 0
    let geocodedCount = 0

    for (const station of stations) {
      const result = await processStation(station)
      totalPricesInserted += result.pricesInserted
      if (result.isNew) newStations++
      if (result.geocoded) geocodedCount++
    }

    // Step 3: Clean up old prices (older than 7 days)
    await sql`
      DELETE FROM gas_prices
      WHERE scraped_at < NOW() - INTERVAL '7 days'
    `

    console.log(`[Gas Prices Cron] Complete: ${stations.length} stations, ${totalPricesInserted} prices`)

    return NextResponse.json({
      success: true,
      stationsScraped: stations.length,
      newStations,
      pricesInserted: totalPricesInserted,
      geocoded: geocodedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gas Prices Cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST also supported for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}

// Helper: Process a single station
async function processStation(station: ScrapedGasStation): Promise<{
  stationId: number
  isNew: boolean
  geocoded: boolean
  pricesInserted: number
}> {
  const { city, state } = parseCityState(station.streetAddress)

  // Check if station exists
  const existing = await sql`
    SELECT id, latitude, longitude
    FROM gas_stations
    WHERE brand_name = ${station.brandName}
    AND street_address = ${station.streetAddress}
  `

  let stationId: number
  let isNew = false
  let geocoded = false

  if (existing.length > 0) {
    stationId = existing[0].id as number

    // Geocode if missing coordinates
    if (existing[0].latitude === null || existing[0].longitude === null) {
      const coords = await geocodeAddress(station.streetAddress)
      if (coords) {
        await sql`
          UPDATE gas_stations
          SET latitude = ${coords.latitude}, longitude = ${coords.longitude},
              city = ${city}, state = ${state}
          WHERE id = ${stationId}
        `
        geocoded = true
      }
    }
  } else {
    // Insert new station
    isNew = true
    const coords = await geocodeAddress(station.streetAddress)

    const insertResult = await sql`
      INSERT INTO gas_stations (brand_name, street_address, city, state, latitude, longitude)
      VALUES (${station.brandName}, ${station.streetAddress}, ${city}, ${state},
              ${coords?.latitude || null}, ${coords?.longitude || null})
      ON CONFLICT (brand_name, street_address) DO UPDATE SET
        city = EXCLUDED.city,
        state = EXCLUDED.state
      RETURNING id
    `

    stationId = insertResult[0].id as number
    if (coords) geocoded = true
  }

  // Insert prices for this station
  let pricesInserted = 0
  for (const fuel of station.fuelPrices) {
    await sql`
      INSERT INTO gas_prices (station_id, fuel_type, price, scraped_at)
      VALUES (${stationId}, ${fuel.fuelType}, ${fuel.price}, NOW())
    `
    pricesInserted++
  }

  return { stationId, isNew, geocoded, pricesInserted }
}

// Helper: Parse city and state from address
function parseCityState(address: string): { city: string; state: string } {
  const parts = address.split(',').map(s => s.trim())
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1]
    const cityPart = parts[parts.length - 2]

    const stateMatch = lastPart.match(/^([A-Z]{2})\s*\d*/)
    if (stateMatch) {
      return { city: cityPart, state: stateMatch[1] }
    }
  }
  return { city: 'Sioux City', state: 'IA' }
}

// Helper: Delay function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper: Geocode address using Nominatim (free, no API key)
// Includes rate limiting to avoid 503 errors
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`

  // Rate limit: Nominatim allows 1 request per second
  await delay(1100)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SiouxlandOnline/1.0 (https://siouxland.online)'
      }
    })

    if (!response.ok) {
      console.warn('[Geocode] Failed:', response.status)
      return null
    }

    const data = await response.json()
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('[Geocode] Error:', error)
    return null
  }
}
