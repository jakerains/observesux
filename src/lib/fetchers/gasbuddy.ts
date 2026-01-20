// GasBuddy Gas Price Scraper using Firecrawl Agent
// Uses spark-1-mini model with targeted GasBuddy URLs

import Firecrawl from '@mendable/firecrawl-js'

// Actual response format from Firecrawl agent
// Note: prices come as strings from GasBuddy, need to parse
interface FirecrawlAgentResponse {
  success: boolean
  status: string
  data: Array<{
    name: string
    address: string
    regular: { price: string | number; last_updated?: string } | null
    mid_grade: { price: string | number; last_updated?: string } | null  // Note: mid_grade not midgrade
    premium: { price: string | number; last_updated?: string } | null
  }>
  expiresAt?: string
  creditsUsed?: number
}

// Helper to parse price (handles both string and number)
function parsePrice(price: string | number | undefined): number | null {
  if (price === undefined || price === null) return null
  const parsed = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(parsed) ? null : parsed
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

  let result
  try {
    result = await firecrawl.agent({
      prompt,
      urls: GASBUDDY_URLS,
      model: 'spark-1-mini',
    })
  } catch (firecrawlError) {
    console.error('[GasBuddy Scraper] Firecrawl agent threw error:', firecrawlError)
    throw new Error(`Firecrawl agent error: ${firecrawlError instanceof Error ? firecrawlError.message : String(firecrawlError)}`)
  }

  console.log('[GasBuddy Scraper] Firecrawl agent completed')
  console.log('[GasBuddy Scraper] Raw result:', JSON.stringify(result, null, 2))

  // Cast to actual response format
  const response = result as unknown as FirecrawlAgentResponse

  // Check for error response
  if (!response.success) {
    console.error('[GasBuddy Scraper] Firecrawl returned error:', response)
    throw new Error(`Firecrawl agent failed: ${response.status || 'unknown error'}`)
  }

  if (!response.data || response.data.length === 0) {
    console.error('[GasBuddy Scraper] No stations in response:', result)
    return []
  }

  console.log(`[GasBuddy Scraper] Found ${response.data.length} stations`)

  // Transform to our internal format
  return response.data.map(station => {
    const fuelPrices: Array<{ fuelType: string; price: number }> = []

    const regularPrice = parsePrice(station.regular?.price)
    const midgradePrice = parsePrice(station.mid_grade?.price)  // Note: mid_grade from API
    const premiumPrice = parsePrice(station.premium?.price)

    if (regularPrice !== null) {
      fuelPrices.push({ fuelType: 'Regular', price: regularPrice })
    }
    if (midgradePrice !== null) {
      fuelPrices.push({ fuelType: 'Midgrade', price: midgradePrice })
    }
    if (premiumPrice !== null) {
      fuelPrices.push({ fuelType: 'Premium', price: premiumPrice })
    }

    return {
      brandName: station.name,
      streetAddress: station.address,
      fuelPrices
    }
  }).filter(station => station.fuelPrices.length > 0) // Only include stations with prices
}
