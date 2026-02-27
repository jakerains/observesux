// GasBuddy Gas Price Scraper using Firecrawl Scrape API
// Uses simple scrape endpoint with markdown - GasBuddy requires JS wait for station listings

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
 * Scrape a single fuel type from GasBuddy using Firecrawl's scrape API.
 * GasBuddy is a React app — requires a JS wait action so station listings render.
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
      formats: ['markdown'],
      onlyMainContent: true,
      // GasBuddy renders stations client-side — wait for JS to load them
      actions: [
        { type: 'wait', milliseconds: 3000 }
      ]
      // No maxAge: always fetch fresh data (don't use cached empty scrapes)
    }),
    signal: AbortSignal.timeout(60000), // 60s timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[GasBuddy Scraper] Firecrawl error for ${fuelName}:`, errorText)
    throw new Error(`Firecrawl scrape failed for ${fuelName}: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  if (!data.success || !data.data?.markdown) {
    console.warn(`[GasBuddy Scraper] No markdown returned for ${fuelName}`, data)
    return []
  }

  // Parse the markdown to extract stations and prices
  return parseGasBuddyMarkdown(data.data.markdown, fuelName)
}

/**
 * Parse GasBuddy markdown to extract station data.
 *
 * GasBuddy renders stations as:
 *   ### [StationName](url)[optional verified icon]
 *   [star rating line]
 *   [review count — a lone number]
 *   [street address]
 *   [City, ST]
 *   $X.XX
 *   [reporter info / time ago line]
 *
 * Station listings begin after the "## ... Gas Prices Near ..." heading.
 */
function parseGasBuddyMarkdown(markdown: string, fuelType: string): Array<{ name: string; address: string; price: number }> {
  const stations: Array<{ name: string; address: string; price: number }> = []

  // Find where the actual station listings start (skip the filter/nav section)
  const listingMatch = markdown.match(/## .+Gas Prices Near/)
  const listingSection = listingMatch
    ? markdown.slice(markdown.indexOf(listingMatch[0]))
    : markdown

  const lines = listingSection.split('\n').map(l => l.trim()).filter(Boolean)

  type StationState = {
    name: string
    street: string
    cityState: string
    price: number | null
  }

  let current: StationState | null = null

  const saveStation = () => {
    if (!current || current.price === null || !current.name) return
    const address = current.street && current.cityState
      ? `${current.street}, ${current.cityState}`
      : current.cityState || current.street
    if (address && current.price > 0 && current.price < 10) {
      stations.push({ name: current.name, address, price: current.price })
    }
    current = null
  }

  for (const line of lines) {
    // New station header: ### [Name](url)...
    const stationMatch = line.match(/^###\s+\[([^\]]+)\]/)
    if (stationMatch) {
      saveStation()
      current = {
        name: stationMatch[1].trim(),
        street: '',
        cityState: '',
        price: null,
      }
      continue
    }

    if (!current) continue

    // Skip star rating lines
    if (line.includes('Star Icon')) continue

    // Skip reporter/time-ago lines (contain "Reporter Icon" or "X Hours/Days/Minutes Ago")
    if (
      line.includes('Reporter Icon') ||
      /\d+\s+(?:Hour|Day|Minute)s?\s+Ago/i.test(line) ||
      /^[![]/.test(line)
    ) continue

    // Skip pure number lines (review count)
    if (/^\d+$/.test(line)) continue

    // Price line: $X.XX or $X.XXX
    const priceMatch = line.match(/^\$(\d+\.\d{2,3})$/)
    if (priceMatch) {
      current.price = parseFloat(priceMatch[1])
      saveStation()
      continue
    }

    // City, State line: "Sioux City, IA" / "North Sioux City, SD"
    if (!current.cityState && /^[\w\s.'-]+,\s+[A-Z]{2}$/.test(line)) {
      current.cityState = line
      continue
    }

    // Street address: starts with a digit and has more content (not just a review count)
    if (!current.street && !current.cityState && /^\d/.test(line) && !/^\d+\s+(?:Hour|Day|Min)/i.test(line)) {
      current.street = line
      continue
    }
  }

  saveStation() // flush last station

  console.log(`[GasBuddy Scraper] Parsed ${stations.length} stations for ${fuelType}`)
  return stations
}

/**
 * Scrape gas prices from GasBuddy using Firecrawl's scrape API.
 * Fetches all fuel types (Regular, Midgrade, Premium, Diesel) in parallel.
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
