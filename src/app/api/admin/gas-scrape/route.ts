import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { scrapeGasPrices, type ScrapedGasStation } from '@/lib/fetchers/gasbuddy'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Admin endpoint to manually trigger gas price scraping
 * POST /api/admin/gas-scrape
 * Requires admin password authentication
 *
 * Calls the scraper directly (same logic as cron endpoint)
 */
export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: '' }))

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  try {
    console.log('[Gas Prices Admin] Starting manual scrape...')

    // Step 1: Scrape gas prices from GasBuddy
    const stations = await scrapeGasPrices()

    if (stations.length === 0) {
      console.warn('[Gas Prices Admin] No stations returned from scraper')
      return NextResponse.json({
        success: false,
        message: 'No stations found',
        stationsScraped: 0,
        pricesInserted: 0,
        triggeredBy: 'admin',
        timestamp: new Date().toISOString()
      })
    }

    console.log(`[Gas Prices Admin] Scraped ${stations.length} stations`)

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

    console.log(`[Gas Prices Admin] Complete: ${stations.length} stations, ${totalPricesInserted} prices`)

    return NextResponse.json({
      success: true,
      stationsScraped: stations.length,
      newStations,
      pricesInserted: totalPricesInserted,
      geocoded: geocodedCount,
      triggeredBy: 'admin',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gas Prices Admin] Failed:', error)
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

/**
 * GET endpoint - just returns instructions
 */
export async function GET() {
  return NextResponse.json({
    message: 'Use POST with { password: "your-admin-password" } to trigger gas price scrape',
    endpoint: '/api/admin/gas-scrape'
  })
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

// Helper: Geocode address using Nominatim (free, no API key)
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ObserveSUX/1.0 (https://siouxland.online)'
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
