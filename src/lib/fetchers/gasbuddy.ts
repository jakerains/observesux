// GasBuddy Gas Price Scraper using Firecrawl Scrape API
// Uses simple scrape endpoint with markdown - faster and cheaper than extract/agent mode

// Fuel type configuration
const FUEL_TYPES = [
  { fuel: 1, name: 'Regular' },
  { fuel: 2, name: 'Midgrade' },
  { fuel: 3, name: 'Premium' },
  { fuel: 4, name: 'Diesel' },
] as const

// Base URL for GasBuddy search
const GASBUDDY_BASE_URL = 'https://www.gasbuddy.com/home?search=sioux+city%2C+iowa&method=all&maxAge=0'

// Transformed station format for database
export interface ScrapedGasStation {
  brandName: string
  streetAddress: string
  fuelPrices: Array<{
    fuelType: string
    price: number
  }>
}

// Internal type for collecting prices across fuel types
interface StationPriceMap {
  [stationKey: string]: {
    brandName: string
    streetAddress: string
    prices: { [fuelType: string]: number }
  }
}

/**
 * Scrape a single fuel type from GasBuddy using Firecrawl's scrape API
 */
async function scrapeFuelType(fuelCode: number, fuelName: string): Promise<Array<{ name: string; address: string; price: number }>> {
  const url = `${GASBUDDY_BASE_URL}&fuel=${fuelCode}`

  console.log(`[GasBuddy Scraper] Scraping ${fuelName} (fuel=${fuelCode})...`)

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      maxAge: 172800000, // 48 hours cache
      formats: ['markdown']
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[GasBuddy Scraper] Firecrawl error for ${fuelName}:`, errorText)
    throw new Error(`Firecrawl scrape failed for ${fuelName}: ${response.status}`)
  }

  const data = await response.json()

  if (!data.success || !data.data?.markdown) {
    console.warn(`[GasBuddy Scraper] No markdown returned for ${fuelName}`)
    return []
  }

  // Parse the markdown to extract stations and prices
  return parseGasBuddyMarkdown(data.data.markdown, fuelName)
}

/**
 * Parse GasBuddy markdown to extract station data
 * GasBuddy typically shows stations in a list format with price and address
 */
function parseGasBuddyMarkdown(markdown: string, fuelType: string): Array<{ name: string; address: string; price: number }> {
  const stations: Array<{ name: string; address: string; price: number }> = []

  // GasBuddy markdown patterns vary but commonly include:
  // - Station name (brand)
  // - Price (e.g., $2.45 or 2.45)
  // - Address

  // Pattern 1: Look for price patterns followed by station info
  // Format often: "$2.459" or "2.45" followed by station details
  const pricePattern = /\$?(\d+\.\d{2,3})\s*(?:\/gal)?/gi

  // Split by common station separators
  const lines = markdown.split('\n')

  let currentStation: { name: string; address: string; price: number } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Look for price in the line
    const priceMatch = line.match(/\$?(\d+\.\d{2,3})/)

    // Look for common station brand names
    const brandMatch = line.match(/(Casey['']?s|Kum\s*&?\s*Go|QuikTrip|QT|Sapp Bros|Hy-Vee|Walmart|Costco|Sam['']?s Club|Murphy USA|Shell|BP|Chevron|Phillips 66|Sinclair|Cenex|Git['']?N['']?Go|Pump ['']?N['']? Pak|Fareway|Flying J|Pilot|Love['']?s|Kwik|Amoco|Conoco|Texaco|Exxon|Mobil|Valero|Speedway|Thorntons|Maverik|HyVee|7-Eleven)/i)

    // Look for address patterns (contains street number and common street types)
    const addressMatch = line.match(/(\d+\s+(?:N|S|E|W|North|South|East|West|NE|NW|SE|SW)?\.?\s*[\w\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Hwy|Highway|Way|Lane|Ln|Pkwy|Parkway|Ct|Court|Cir|Circle)\.?(?:,?\s*[\w\s]+,?\s*(?:IA|Iowa|NE|Nebraska|SD|South Dakota))?(?:\s+\d{5})?)/i)

    if (priceMatch && brandMatch) {
      // We found both price and brand on the same line
      const price = parseFloat(priceMatch[1])
      if (price > 0 && price < 10) { // Sanity check for gas prices
        currentStation = {
          name: brandMatch[1].replace(/[']/g, "'"),
          address: addressMatch ? addressMatch[1] : '',
          price
        }

        // If we have address too, add to stations
        if (currentStation.address) {
          stations.push(currentStation)
          currentStation = null
        }
      }
    } else if (currentStation && !currentStation.address && addressMatch) {
      // We have a pending station and found its address
      currentStation.address = addressMatch[1]
      stations.push(currentStation)
      currentStation = null
    } else if (priceMatch && !brandMatch) {
      // Price without brand - might be in a different format
      const price = parseFloat(priceMatch[1])
      if (price > 0 && price < 10) {
        // Look ahead for station name
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim()
          const nextBrand = nextLine.match(/(Casey['']?s|Kum\s*&?\s*Go|QuikTrip|QT|Sapp Bros|Hy-Vee|Walmart|Costco|Sam['']?s Club|Murphy USA|Shell|BP|Chevron|Phillips 66|Sinclair|Cenex|Git['']?N['']?Go|Pump ['']?N['']? Pak|Fareway|Flying J|Pilot|Love['']?s|Kwik|Amoco|Conoco|Texaco|Exxon|Mobil|Valero|Speedway|Thorntons|Maverik|HyVee|7-Eleven)/i)
          const nextAddress = nextLine.match(/(\d+\s+(?:N|S|E|W|North|South|East|West|NE|NW|SE|SW)?\.?\s*[\w\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Hwy|Highway|Way|Lane|Ln|Pkwy|Parkway|Ct|Court|Cir|Circle)\.?)/i)

          if (nextBrand) {
            currentStation = { name: nextBrand[1].replace(/[']/g, "'"), address: '', price }
          }
          if (currentStation && nextAddress) {
            currentStation.address = nextAddress[1]
            stations.push(currentStation)
            currentStation = null
            break
          }
        }
      }
    }
  }

  console.log(`[GasBuddy Scraper] Parsed ${stations.length} stations for ${fuelType}`)
  return stations
}

/**
 * Scrape gas prices from GasBuddy using Firecrawl's scrape API
 * Fetches all fuel types (Regular, Midgrade, Premium, Diesel) in parallel
 */
export async function scrapeGasPrices(): Promise<ScrapedGasStation[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not configured')
  }

  console.log('[GasBuddy Scraper] Starting Firecrawl scrape for all fuel types...')

  try {
    // Scrape all fuel types in parallel
    const results = await Promise.all(
      FUEL_TYPES.map(({ fuel, name }) =>
        scrapeFuelType(fuel, name)
          .then(stations => ({ fuelType: name, stations }))
          .catch(err => {
            console.error(`[GasBuddy Scraper] Failed to scrape ${name}:`, err)
            return { fuelType: name, stations: [] }
          })
      )
    )

    // Merge all fuel types by station (using name + address as key)
    const stationMap: StationPriceMap = {}

    for (const { fuelType, stations } of results) {
      for (const station of stations) {
        // Create a consistent key for the station
        const key = `${station.name.toLowerCase()}|${station.address.toLowerCase()}`

        if (!stationMap[key]) {
          stationMap[key] = {
            brandName: station.name,
            streetAddress: station.address,
            prices: {}
          }
        }

        stationMap[key].prices[fuelType] = station.price
      }
    }

    // Transform to output format
    const scrapedStations: ScrapedGasStation[] = Object.values(stationMap)
      .map(station => ({
        brandName: station.brandName,
        streetAddress: station.streetAddress,
        fuelPrices: Object.entries(station.prices).map(([fuelType, price]) => ({
          fuelType,
          price
        }))
      }))
      .filter(station => station.fuelPrices.length > 0)

    console.log(`[GasBuddy Scraper] Complete: ${scrapedStations.length} stations with prices`)
    return scrapedStations

  } catch (error) {
    console.error('[GasBuddy Scraper] Error:', error)
    throw error
  }
}
