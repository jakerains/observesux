import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { scrapeGasPrices, type ScrapedGasStation } from '@/lib/fetchers/gasbuddy'
import { logCronRun } from '@/lib/db/historical'
import { verifyCronRequest } from '@/lib/utils/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Allow up to 5 minutes for scraping (Pro plan)

/**
 * Blocklist of stations that no longer exist (demolished, permanently closed, etc.).
 * Matched case-insensitively against scraped brand_name and street_address.
 * When a station is added here, the cron job will also delete it from the DB on next run.
 */
const STATION_BLOCKLIST = [
  { brandName: 'Phillips 66', addressContains: 'Gordon' },
]

function isBlocklisted(station: ScrapedGasStation): boolean {
  return STATION_BLOCKLIST.some(blocked => {
    const nameMatch = station.brandName.toLowerCase().includes(blocked.brandName.toLowerCase())
    const addressMatch = station.streetAddress.toLowerCase().includes(blocked.addressContains.toLowerCase())
    return nameMatch && addressMatch
  })
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

  const startedAt = new Date()

  try {
    console.log('[Gas Prices Cron] Starting gas price scrape...')

    // Step 1: Scrape gas prices from GasBuddy
    const stations = await scrapeGasPrices()

    if (stations.length === 0) {
      console.warn('[Gas Prices Cron] No stations returned from scraper')
      await logCronRun('gas-prices', 'skipped', startedAt, { stationsScraped: 0, pricesInserted: 0 })
      return NextResponse.json({
        success: false,
        message: 'No stations found',
        stationsScraped: 0,
        pricesInserted: 0,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`[Gas Prices Cron] Scraped ${stations.length} stations`)

    // Step 1b: Filter out blocklisted stations (demolished, permanently closed)
    const activeStations = stations.filter(station => {
      if (isBlocklisted(station)) {
        console.log(`[Gas Prices Cron] Skipping blocklisted station: ${station.brandName} at ${station.streetAddress}`)
        return false
      }
      return true
    })

    // Step 1c: Remove blocklisted stations from DB (if they still exist)
    for (const blocked of STATION_BLOCKLIST) {
      const deleted = await sql`
        DELETE FROM gas_stations
        WHERE LOWER(brand_name) LIKE ${`%${blocked.brandName.toLowerCase()}%`}
        AND LOWER(street_address) LIKE ${`%${blocked.addressContains.toLowerCase()}%`}
        RETURNING id, brand_name, street_address
      `
      if (deleted.length > 0) {
        console.log(`[Gas Prices Cron] Removed blocklisted station from DB: ${deleted.map(d => `${d.brand_name} at ${d.street_address}`).join(', ')}`)
      }
    }

    console.log(`[Gas Prices Cron] Processing ${activeStations.length} stations (${stations.length - activeStations.length} blocklisted)`)

    // Step 2: Process and save each station
    let totalPricesInserted = 0
    let newStations = 0
    let geocodedCount = 0

    for (const station of activeStations) {
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

    const blockedCount = stations.length - activeStations.length
    console.log(`[Gas Prices Cron] Complete: ${activeStations.length} stations, ${totalPricesInserted} prices (${blockedCount} blocklisted)`)

    await logCronRun('gas-prices', 'success', startedAt, {
      stationsScraped: activeStations.length,
      blocklisted: blockedCount,
      newStations,
      pricesInserted: totalPricesInserted,
      geocoded: geocodedCount,
    })

    return NextResponse.json({
      success: true,
      stationsScraped: activeStations.length,
      blocklisted: blockedCount,
      newStations,
      pricesInserted: totalPricesInserted,
      geocoded: geocodedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gas Prices Cron] Error:', error)
    await logCronRun('gas-prices', 'error', startedAt, undefined, error instanceof Error ? error.message : 'Unknown error')
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
