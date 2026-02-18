import { NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import type { GasStation, GasPrice, GasPriceData, FuelType } from '@/types'

export const dynamic = 'force-dynamic'

interface DbStation {
  id: number
  brand_name: string
  street_address: string
  city: string | null
  state: string | null
  latitude: string | null
  longitude: string | null
}

interface DbPrice {
  station_id: number
  fuel_type: string
  price: string
  scraped_at: string
}

/**
 * Get cached gas prices from database
 * GET /api/gas-prices
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      data: {
        stations: [],
        stats: {
          lowestRegular: null,
          averageRegular: null,
          highestRegular: null,
          stationCount: 0,
          cheapestStation: null
        },
        scrapedAt: null
      },
      timestamp: new Date().toISOString(),
      source: 'gasbuddy',
      error: 'Database not configured'
    })
  }

  try {
    // Get all stations
    const stationsResult = await sql`
      SELECT id, brand_name, street_address, city, state, latitude, longitude
      FROM gas_stations
      ORDER BY brand_name
    ` as DbStation[]

    // Get most recent prices for each station (within last 48 hours)
    const pricesResult = await sql`
      SELECT DISTINCT ON (station_id, fuel_type)
        station_id, fuel_type, price, scraped_at
      FROM gas_prices
      WHERE scraped_at > NOW() - INTERVAL '48 hours'
      ORDER BY station_id, fuel_type, scraped_at DESC
    ` as DbPrice[]

    // Get the most recent scrape time
    const lastScrapeResult = await sql`
      SELECT MAX(scraped_at) as last_scraped FROM gas_prices
    `
    const scrapedAt = lastScrapeResult[0]?.last_scraped || null

    // Group prices by station
    const pricesByStation = new Map<number, GasPrice[]>()
    for (const price of pricesResult) {
      if (!pricesByStation.has(price.station_id)) {
        pricesByStation.set(price.station_id, [])
      }
      pricesByStation.get(price.station_id)!.push({
        fuelType: price.fuel_type as FuelType,
        price: parseFloat(price.price)
      })
    }

    // Build station list with prices
    const stations: GasStation[] = stationsResult.map(station => ({
      id: station.id,
      brandName: station.brand_name,
      streetAddress: station.street_address,
      city: station.city,
      state: station.state,
      latitude: station.latitude ? parseFloat(station.latitude) : null,
      longitude: station.longitude ? parseFloat(station.longitude) : null,
      prices: pricesByStation.get(station.id) || []
    }))

    // Filter to only stations that have prices
    const stationsWithPrices = stations.filter(s => s.prices.length > 0)

    // Calculate stats for Regular fuel
    const regularPrices = stationsWithPrices
      .map(s => s.prices.find(p => p.fuelType === 'Regular')?.price)
      .filter((p): p is number => p !== undefined)

    let lowestRegular: number | null = null
    let highestRegular: number | null = null
    let averageRegular: number | null = null
    let cheapestStation: string | null = null

    if (regularPrices.length > 0) {
      lowestRegular = Math.min(...regularPrices)
      highestRegular = Math.max(...regularPrices)
      averageRegular = regularPrices.reduce((a, b) => a + b, 0) / regularPrices.length
      averageRegular = Math.round(averageRegular * 1000) / 1000

      // Find cheapest station
      const cheapest = stationsWithPrices.find(s =>
        s.prices.find(p => p.fuelType === 'Regular')?.price === lowestRegular
      )
      if (cheapest) {
        cheapestStation = cheapest.streetAddress
          ? `${cheapest.brandName} at ${cheapest.streetAddress}`
          : cheapest.brandName
      }
    }

    // Sort stations by Regular price (lowest first)
    stationsWithPrices.sort((a, b) => {
      const priceA = a.prices.find(p => p.fuelType === 'Regular')?.price ?? Infinity
      const priceB = b.prices.find(p => p.fuelType === 'Regular')?.price ?? Infinity
      return priceA - priceB
    })

    const data: GasPriceData = {
      stations: stationsWithPrices,
      stats: {
        lowestRegular,
        averageRegular,
        highestRegular,
        stationCount: stationsWithPrices.length,
        cheapestStation
      },
      scrapedAt
    }

    return NextResponse.json({
      data,
      timestamp: new Date().toISOString(),
      source: 'gasbuddy'
    }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600' }
    })
  } catch (error) {
    console.error('[Gas Prices API] Error:', error)
    return NextResponse.json({
      data: {
        stations: [],
        stats: {
          lowestRegular: null,
          averageRegular: null,
          highestRegular: null,
          stationCount: 0,
          cheapestStation: null
        },
        scrapedAt: null
      },
      timestamp: new Date().toISOString(),
      source: 'gasbuddy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
