// GasBuddy Gas Price Scraper using Firecrawl Extract
// Uses dedicated extract endpoint - faster than agent mode

import Firecrawl from '@mendable/firecrawl-js'

// JSON Schema for extraction (Firecrawl accepts JSON Schema or Zod)
const GasStationJsonSchema = {
  type: 'object',
  properties: {
    stations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Gas station brand name (e.g., Casey\'s, Kum & Go)' },
          address: { type: 'string', description: 'Full street address' },
          regular_price: { type: ['number', 'null'], description: 'Regular unleaded price in dollars' },
          midgrade_price: { type: ['number', 'null'], description: 'Midgrade price in dollars' },
          premium_price: { type: ['number', 'null'], description: 'Premium price in dollars' },
          diesel_price: { type: ['number', 'null'], description: 'Diesel price in dollars' },
        },
        required: ['name', 'address']
      }
    }
  },
  required: ['stations']
}

// Extracted data shape
interface ExtractedData {
  stations: Array<{
    name: string
    address: string
    regular_price: number | null
    midgrade_price: number | null
    premium_price: number | null
    diesel_price: number | null
  }>
}

// Transformed station format for database
export interface ScrapedGasStation {
  brandName: string
  streetAddress: string
  fuelPrices: Array<{
    fuelType: string
    price: number
  }>
}

// GasBuddy URL - single page with all stations
const GASBUDDY_URL = 'https://www.gasbuddy.com/home?search=sioux+city%2C+ia&fuel=1&maxAge=0&method=all'

/**
 * Scrape gas prices from GasBuddy using Firecrawl's extract feature
 * Should complete in ~20-40 seconds
 */
export async function scrapeGasPrices(): Promise<ScrapedGasStation[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not configured')
  }

  const firecrawl = new Firecrawl({
    apiKey: process.env.FIRECRAWL_API_KEY
  })

  console.log('[GasBuddy Scraper] Starting Firecrawl extract...')

  try {
    const result = await firecrawl.extract({
      urls: [GASBUDDY_URL],
      schema: GasStationJsonSchema,
      prompt: 'Extract all gas stations with their names, addresses, and fuel prices. Get regular, midgrade, premium, and diesel prices where available. Prices should be numbers like 2.45 not strings.',
      timeout: 55, // Stay under Vercel's 60s limit
    })

    console.log('[GasBuddy Scraper] Firecrawl extract completed')

    if (!result.success) {
      console.error('[GasBuddy Scraper] Firecrawl returned error:', result)
      throw new Error('Firecrawl extract failed')
    }

    // The data is in result.data
    const extracted = result.data as ExtractedData | undefined

    if (!extracted?.stations || extracted.stations.length === 0) {
      console.warn('[GasBuddy Scraper] No stations extracted')
      return []
    }

    console.log(`[GasBuddy Scraper] Extracted ${extracted.stations.length} stations`)

    // Transform to our internal format
    return extracted.stations.map(station => {
      const fuelPrices: Array<{ fuelType: string; price: number }> = []

      if (station.regular_price !== null && station.regular_price > 0) {
        fuelPrices.push({ fuelType: 'Regular', price: station.regular_price })
      }
      if (station.midgrade_price !== null && station.midgrade_price > 0) {
        fuelPrices.push({ fuelType: 'Midgrade', price: station.midgrade_price })
      }
      if (station.premium_price !== null && station.premium_price > 0) {
        fuelPrices.push({ fuelType: 'Premium', price: station.premium_price })
      }
      if (station.diesel_price !== null && station.diesel_price > 0) {
        fuelPrices.push({ fuelType: 'Diesel', price: station.diesel_price })
      }

      return {
        brandName: station.name,
        streetAddress: station.address,
        fuelPrices
      }
    }).filter(station => station.fuelPrices.length > 0)

  } catch (error) {
    console.error('[GasBuddy Scraper] Error:', error)
    throw error
  }
}
