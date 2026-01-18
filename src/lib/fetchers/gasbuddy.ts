// GasBuddy Gas Price Scraper using Firecrawl Agent
// Uses spark-1-mini model for efficient web scraping with AI

import FirecrawlApp from '@mendable/firecrawl-js'

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

export interface FirecrawlGasData {
  gas_stations: Array<{
    brand_name: string
    street_address: string
    fuel_prices: Array<{
      fuel_type: string
      price: number
    }>
  }>
}

export interface ScrapedGasStation {
  brandName: string
  streetAddress: string
  fuelPrices: Array<{
    fuelType: string
    price: number
  }>
}

/**
 * Scrape gas prices from GasBuddy using Firecrawl's AI agent
 * Uses spark-1-mini model for cost-efficient scraping (~$0.01-0.05 per run)
 */
export async function scrapeGasPrices(): Promise<ScrapedGasStation[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not configured')
  }

  const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY
  })

  const prompt = `Extract current gas prices for all gas stations in Sioux City, Iowa and the surrounding Siouxland area including South Sioux City NE, North Sioux City SD, and Sergeant Bluff IA.

For each station, capture:
- brand_name: The gas station brand (e.g., "Casey's", "Maverik", "Kum & Go")
- street_address: Full street address including city and state
- fuel_prices: Array of fuel types and prices (Regular, Midgrade, Premium, Diesel)

Search GasBuddy or similar gas price aggregator for Sioux City, IA area gas prices.`

  const agentResult = await firecrawl.agent({
    prompt,
    schema: gasPriceSchema as Record<string, unknown>,
    model: 'spark-1-mini',
  })

  // Extract the data from the agent response
  const result = agentResult as unknown as FirecrawlGasData

  if (!result || !result.gas_stations) {
    console.error('Firecrawl agent returned no data:', agentResult)
    return []
  }

  // Transform to our internal format
  return result.gas_stations.map((station: { brand_name: string; street_address: string; fuel_prices: Array<{ fuel_type: string; price: number }> }) => ({
    brandName: station.brand_name,
    streetAddress: station.street_address,
    fuelPrices: station.fuel_prices.map((fuel: { fuel_type: string; price: number }) => ({
      fuelType: normalizeFuelType(fuel.fuel_type),
      price: fuel.price
    }))
  }))
}

/**
 * Normalize fuel type strings to standard format
 */
function normalizeFuelType(fuelType: string): string {
  const lower = fuelType.toLowerCase()
  if (lower.includes('regular') || lower === 'unleaded' || lower === '87') return 'Regular'
  if (lower.includes('midgrade') || lower.includes('plus') || lower === '89') return 'Midgrade'
  if (lower.includes('premium') || lower.includes('super') || lower === '91' || lower === '93') return 'Premium'
  if (lower.includes('diesel')) return 'Diesel'
  return fuelType // Return as-is if unknown
}
