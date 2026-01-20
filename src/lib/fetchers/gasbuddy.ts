// GasBuddy Gas Price Scraper using Firecrawl Agent
// Uses spark-1-mini model with targeted GasBuddy URLs

import Firecrawl from '@mendable/firecrawl-js'
import { z } from 'zod'

// Zod schema for Firecrawl agent extraction
const gasPriceSchema = z.object({
  gasbuddy_stations: z.array(z.object({
    station_name: z.string().describe("Name of the gas station"),
    station_name_citation: z.string().describe("Source URL for station_name").optional(),
    address: z.string().describe("Address of the gas station"),
    address_citation: z.string().describe("Source URL for address").optional(),
    regular_fuel: z.object({
      price: z.number().describe("Price of regular fuel").optional(),
      price_citation: z.string().describe("Source URL for price").optional(),
      last_updated: z.string().describe("Timestamp of the last update for regular fuel price").optional(),
      last_updated_citation: z.string().describe("Source URL for last_updated").optional()
    }).describe("Regular fuel price and last updated timestamp").optional(),
    mid_grade_fuel: z.object({
      price: z.number().describe("Price of mid-grade fuel").optional(),
      price_citation: z.string().describe("Source URL for price").optional(),
      last_updated: z.string().describe("Timestamp of the last update for mid-grade fuel price").optional(),
      last_updated_citation: z.string().describe("Source URL for last_updated").optional()
    }).describe("Mid-grade fuel price and last updated timestamp").optional(),
    premium_fuel: z.object({
      price: z.number().describe("Price of premium fuel").optional(),
      price_citation: z.string().describe("Source URL for price").optional(),
      last_updated: z.string().describe("Timestamp of the last update for premium fuel price").optional(),
      last_updated_citation: z.string().describe("Source URL for last_updated").optional()
    }).describe("Premium fuel price and last updated timestamp").optional()
  })).describe("List of gas stations and fuel prices from GasBuddy")
})

// Type inferred from Zod schema
export type FirecrawlGasData = z.infer<typeof gasPriceSchema>

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
    schema: gasPriceSchema as unknown as Record<string, unknown>,
    urls: GASBUDDY_URLS,
    model: 'spark-1-mini',
  })

  console.log('[GasBuddy Scraper] Firecrawl agent completed')

  // Extract the data from the agent response
  const data = result as unknown as FirecrawlGasData

  if (!data || !data.gasbuddy_stations || data.gasbuddy_stations.length === 0) {
    console.error('[GasBuddy Scraper] No stations returned:', result)
    return []
  }

  console.log(`[GasBuddy Scraper] Found ${data.gasbuddy_stations.length} stations`)

  // Transform to our internal format
  return data.gasbuddy_stations.map(station => {
    const fuelPrices: Array<{ fuelType: string; price: number }> = []

    if (station.regular_fuel?.price) {
      fuelPrices.push({ fuelType: 'Regular', price: station.regular_fuel.price })
    }
    if (station.mid_grade_fuel?.price) {
      fuelPrices.push({ fuelType: 'Midgrade', price: station.mid_grade_fuel.price })
    }
    if (station.premium_fuel?.price) {
      fuelPrices.push({ fuelType: 'Premium', price: station.premium_fuel.price })
    }

    return {
      brandName: station.station_name,
      streetAddress: station.address,
      fuelPrices
    }
  }).filter(station => station.fuelPrices.length > 0) // Only include stations with prices
}
