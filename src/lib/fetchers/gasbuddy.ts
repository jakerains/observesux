// GasBuddy Gas Price Scraper using Firecrawl Agent
// Uses spark-1-mini model with targeted GasBuddy URLs

import Firecrawl from '@mendable/firecrawl-js'

// Actual response format from Firecrawl agent
interface FirecrawlAgentResponse {
  success: boolean
  status: string
  data: Array<{
    name: string
    address: string
    regular: { price: number; last_updated?: string } | null
    midgrade: { price: number; last_updated?: string } | null
    premium: { price: number; last_updated?: string } | null
  }>
  expiresAt?: string
  creditsUsed?: number
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

// GasBuddy URLs for Sioux City area
const GASBUDDY_URLS = [
  'https://www.gasbuddy.com/home?search=sioux+city%2C+iowa&fuel=1&method=all&maxAge=0', // Regular
  'https://www.gasbuddy.com/home?search=sioux+city%2C+iowa&fuel=2&method=all&maxAge=0', // Mid-grade
  'https://www.gasbuddy.com/home?search=sioux+city%2C+iowa&fuel=3&method=all&maxAge=0', // Premium
]

/**
 * Scrape gas prices from GasBuddy using Firecrawl's AI agent
 * Uses spark-1-mini model for cost-efficient scraping
 */
export async function scrapeGasPrices(): Promise<ScrapedGasStation[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not configured')
  }

  const firecrawl = new Firecrawl({
    apiKey: process.env.FIRECRAWL_API_KEY
  })

  const prompt = `Extract gas station name, address, and fuel prices for regular, mid-grade, and premium tiers from the provided GasBuddy URLs for Sioux City, Iowa. For each price entry, include the 'last updated' timestamp. Ensure the data is mapped correctly from each specific fuel-type URL.`

  console.log('[GasBuddy Scraper] Starting Firecrawl agent...')

  const result = await firecrawl.agent({
    prompt,
    urls: GASBUDDY_URLS,
    model: 'spark-1-mini',
  })

  console.log('[GasBuddy Scraper] Firecrawl agent completed')

  // Cast to actual response format
  const response = result as unknown as FirecrawlAgentResponse

  if (!response || !response.data || response.data.length === 0) {
    console.error('[GasBuddy Scraper] No stations returned:', result)
    return []
  }

  console.log(`[GasBuddy Scraper] Found ${response.data.length} stations`)

  // Transform to our internal format
  return response.data.map(station => {
    const fuelPrices: Array<{ fuelType: string; price: number }> = []

    if (station.regular?.price) {
      fuelPrices.push({ fuelType: 'Regular', price: station.regular.price })
    }
    if (station.midgrade?.price) {
      fuelPrices.push({ fuelType: 'Midgrade', price: station.midgrade.price })
    }
    if (station.premium?.price) {
      fuelPrices.push({ fuelType: 'Premium', price: station.premium.price })
    }

    return {
      brandName: station.name,
      streetAddress: station.address,
      fuelPrices
    }
  }).filter(station => station.fuelPrices.length > 0) // Only include stations with prices
}
