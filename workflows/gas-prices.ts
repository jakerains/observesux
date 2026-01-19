/**
 * Gas Prices Workflow
 *
 * A durable workflow that scrapes gas prices from GasBuddy via Firecrawl,
 * geocodes new stations, and saves to the database.
 *
 * Benefits over cron:
 * - Automatic retries on failure
 * - Survives deployments and restarts
 * - Better observability via workflow inspector
 * - Explicit error handling with FatalError vs RetryableError
 */

import { FatalError, RetryableError } from 'workflow'
import FirecrawlApp from '@mendable/firecrawl-js'
import { neon } from '@neondatabase/serverless'

// Types
interface ScrapedGasStation {
  brandName: string
  streetAddress: string
  fuelPrices: Array<{
    fuelType: string
    price: number
  }>
}

interface ProcessedStation {
  stationId: number
  isNew: boolean
  geocoded: boolean
}

interface WorkflowResult {
  success: boolean
  stationsScraped: number
  stationsProcessed: number
  pricesInserted: number
  geocoded: number
  timestamp: string
}

// JSON Schema for Firecrawl agent extraction
const gasPriceSchema = {
  type: 'object',
  properties: {
    gas_stations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          brand_name: { type: 'string' },
          street_address: { type: 'string' },
          fuel_prices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fuel_type: { type: 'string' },
                price: { type: 'number' }
              },
              required: ['fuel_type', 'price']
            }
          }
        },
        required: ['brand_name', 'street_address', 'fuel_prices']
      }
    }
  },
  required: ['gas_stations']
}

/**
 * Main workflow function - orchestrates the gas price scraping process
 */
export async function gasPricesWorkflow(): Promise<WorkflowResult> {
  'use workflow'

  // Step 1: Scrape gas prices from GasBuddy
  const stations = await scrapeGasPricesStep()

  if (stations.length === 0) {
    return {
      success: false,
      stationsScraped: 0,
      stationsProcessed: 0,
      pricesInserted: 0,
      geocoded: 0,
      timestamp: new Date().toISOString()
    }
  }

  // Step 2: Process each station (check exists, geocode if needed)
  let totalGeocoded = 0
  let totalPricesInserted = 0
  const processedStations: ProcessedStation[] = []

  for (const station of stations) {
    const processed = await processStationStep(station)
    processedStations.push(processed)
    if (processed.geocoded) totalGeocoded++

    // Step 3: Save prices for this station
    const pricesInserted = await savePricesStep(processed.stationId, station.fuelPrices)
    totalPricesInserted += pricesInserted
  }

  // Step 4: Clean up old prices
  await cleanupOldPricesStep()

  return {
    success: true,
    stationsScraped: stations.length,
    stationsProcessed: processedStations.length,
    pricesInserted: totalPricesInserted,
    geocoded: totalGeocoded,
    timestamp: new Date().toISOString()
  }
}

/**
 * Step: Scrape gas prices from GasBuddy using Firecrawl
 */
async function scrapeGasPricesStep(): Promise<ScrapedGasStation[]> {
  'use step'

  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new FatalError('FIRECRAWL_API_KEY not configured')
  }

  const firecrawl = new FirecrawlApp({ apiKey })

  const prompt = `Extract current gas prices for all gas stations in Sioux City, Iowa and the surrounding Siouxland area including South Sioux City NE, North Sioux City SD, and Sergeant Bluff IA.

For each station, capture:
- brand_name: The gas station brand (e.g., "Casey's", "Maverik", "Kum & Go")
- street_address: Full street address including city and state
- fuel_prices: Array of fuel types and prices (Regular, Midgrade, Premium, Diesel)

Search GasBuddy or similar gas price aggregator for Sioux City, IA area gas prices.`

  try {
    const agentResult = await firecrawl.agent({
      prompt,
      schema: gasPriceSchema as Record<string, unknown>,
      model: 'spark-1-mini',
    })

    const result = agentResult as unknown as { gas_stations?: Array<{
      brand_name: string
      street_address: string
      fuel_prices: Array<{ fuel_type: string; price: number }>
    }> }

    if (!result || !result.gas_stations) {
      console.error('[Workflow] Firecrawl returned no data:', agentResult)
      return []
    }

    // Transform to our internal format
    return result.gas_stations.map(station => ({
      brandName: station.brand_name,
      streetAddress: station.street_address,
      fuelPrices: station.fuel_prices.map(fuel => ({
        fuelType: normalizeFuelType(fuel.fuel_type),
        price: fuel.price
      }))
    }))
  } catch (error) {
    // Rate limiting - retry after delay
    if (error instanceof Error && error.message.includes('rate')) {
      throw new RetryableError('Firecrawl rate limited', { retryAfter: '2m' })
    }
    // Other errors - retry with default backoff
    throw error
  }
}

/**
 * Step: Process a single station - check if exists, geocode if needed
 */
async function processStationStep(station: ScrapedGasStation): Promise<ProcessedStation> {
  'use step'

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new FatalError('DATABASE_URL not configured')
  }

  const sql = neon(databaseUrl)
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

  return { stationId, isNew, geocoded }
}

/**
 * Step: Save fuel prices for a station
 */
async function savePricesStep(
  stationId: number,
  fuelPrices: Array<{ fuelType: string; price: number }>
): Promise<number> {
  'use step'

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new FatalError('DATABASE_URL not configured')
  }

  const sql = neon(databaseUrl)
  let inserted = 0

  for (const fuel of fuelPrices) {
    await sql`
      INSERT INTO gas_prices (station_id, fuel_type, price, scraped_at)
      VALUES (${stationId}, ${fuel.fuelType}, ${fuel.price}, NOW())
    `
    inserted++
  }

  return inserted
}

/**
 * Step: Clean up old prices (older than 7 days)
 */
async function cleanupOldPricesStep(): Promise<void> {
  'use step'

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new FatalError('DATABASE_URL not configured')
  }

  const sql = neon(databaseUrl)
  await sql`
    DELETE FROM gas_prices
    WHERE scraped_at < NOW() - INTERVAL '7 days'
  `
}

// Helper functions

function normalizeFuelType(fuelType: string): string {
  const lower = fuelType.toLowerCase()
  if (lower.includes('regular') || lower === 'unleaded' || lower === '87') return 'Regular'
  if (lower.includes('midgrade') || lower.includes('plus') || lower === '89') return 'Midgrade'
  if (lower.includes('premium') || lower.includes('super') || lower === '91' || lower === '93') return 'Premium'
  if (lower.includes('diesel')) return 'Diesel'
  return fuelType
}

function parseCityState(address: string): { city: string; state: string } {
  // Try to parse "Street, City, State ZIP" format
  const parts = address.split(',').map(s => s.trim())
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1]
    const cityPart = parts[parts.length - 2]

    // Extract state from "State ZIP" or just "State"
    const stateMatch = lastPart.match(/^([A-Z]{2})\s*\d*/)
    if (stateMatch) {
      return { city: cityPart, state: stateMatch[1] }
    }
  }
  return { city: 'Sioux City', state: 'IA' }
}

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  // Use Nominatim for geocoding (free, no API key)
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ObserveSUX/1.0 (https://siouxland.online)'
      }
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new RetryableError('Nominatim rate limited', { retryAfter: '1m' })
      }
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
    if (error instanceof RetryableError) throw error
    console.error('[Workflow] Geocoding failed:', error)
    return null
  }
}
