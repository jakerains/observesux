import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { scrapeGasPrices, ScrapedGasStation } from '@/lib/fetchers/gasbuddy'
import { geocodeAddress, parseCityState, delay } from '@/lib/utils/geocode'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for scraping + geocoding

/**
 * Cron endpoint to scrape gas prices from GasBuddy via Firecrawl
 * Runs daily at 6 AM CST (12:00 UTC) via Vercel Cron
 *
 * POST /api/cron/gas-prices
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  try {
    console.log('[Gas Prices Cron] Starting scrape...')

    // Step 1: Scrape gas prices from GasBuddy via Firecrawl
    const stations = await scrapeGasPrices()
    console.log(`[Gas Prices Cron] Scraped ${stations.length} stations`)

    if (stations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No stations scraped',
        timestamp: new Date().toISOString()
      })
    }

    // Step 2: Upsert stations and prices to database
    let stationsUpserted = 0
    let pricesInserted = 0
    let geocoded = 0

    for (const station of stations) {
      try {
        // Parse city and state from address
        const { city, state } = parseCityState(station.streetAddress)

        // Check if station exists
        const existing = await sql`
          SELECT id, latitude, longitude
          FROM gas_stations
          WHERE brand_name = ${station.brandName}
          AND street_address = ${station.streetAddress}
        `

        let stationId: number

        if (existing.length > 0) {
          // Station exists
          stationId = existing[0].id

          // Geocode if missing coordinates
          if (existing[0].latitude === null || existing[0].longitude === null) {
            console.log(`[Gas Prices Cron] Geocoding: ${station.streetAddress}`)
            await delay(1100) // Rate limit for Nominatim
            const coords = await geocodeAddress(station.streetAddress)

            if (coords) {
              await sql`
                UPDATE gas_stations
                SET latitude = ${coords.latitude}, longitude = ${coords.longitude},
                    city = ${city}, state = ${state}
                WHERE id = ${stationId}
              `
              geocoded++
            }
          }
        } else {
          // Insert new station
          console.log(`[Gas Prices Cron] New station: ${station.brandName} - ${station.streetAddress}`)

          // Geocode new station
          await delay(1100) // Rate limit for Nominatim
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

          stationId = insertResult[0].id
          stationsUpserted++
          if (coords) geocoded++
        }

        // Insert new prices for this station
        for (const fuel of station.fuelPrices) {
          await sql`
            INSERT INTO gas_prices (station_id, fuel_type, price, scraped_at)
            VALUES (${stationId}, ${fuel.fuelType}, ${fuel.price}, NOW())
          `
          pricesInserted++
        }
      } catch (stationError) {
        console.error(`[Gas Prices Cron] Error processing station ${station.brandName}:`, stationError)
      }
    }

    // Clean up old prices (keep only last 7 days)
    await sql`
      DELETE FROM gas_prices
      WHERE scraped_at < NOW() - INTERVAL '7 days'
    `

    const summary = {
      success: true,
      stationsScraped: stations.length,
      stationsUpserted,
      pricesInserted,
      stationsGeocoded: geocoded,
      timestamp: new Date().toISOString()
    }

    console.log('[Gas Prices Cron] Complete:', summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('[Gas Prices Cron] Error:', error)
    return NextResponse.json(
      {
        error: 'Scrape failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing (still requires auth)
export async function GET(request: NextRequest) {
  return POST(request)
}
