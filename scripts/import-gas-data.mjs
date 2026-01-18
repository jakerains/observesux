import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

// Load DATABASE_URL from .env.local manually
const envContent = readFileSync('.env.local', 'utf-8')
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL

const sql = neon(databaseUrl)

const data = JSON.parse(readFileSync('./docs/extract-data-2026-01-18.json', 'utf-8'))

async function importData() {
  let stationsInserted = 0
  let pricesInserted = 0

  for (const station of data.gas_stations) {
    // Skip stations with no valid coordinates or no prices
    if (station.latitude === 0 || station.longitude === 0) continue
    if (station.fuel_prices.length === 0) continue
    if (station.brand_name === 'Unknown') continue

    // Parse city and state from address
    const addressParts = station.street_address.split(',')
    let city = null
    let state = null
    if (addressParts.length >= 2) {
      const lastPart = addressParts[addressParts.length - 1].trim()
      const stateMatch = lastPart.match(/(IA|NE|SD)/)
      state = stateMatch ? stateMatch[1] : null
      city = addressParts[addressParts.length - 2]?.trim() || null
    }

    try {
      // Insert station
      const result = await sql`
        INSERT INTO gas_stations (brand_name, street_address, city, state, latitude, longitude)
        VALUES (${station.brand_name}, ${station.street_address}, ${city}, ${state}, ${station.latitude}, ${station.longitude})
        ON CONFLICT (brand_name, street_address) DO UPDATE SET
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          city = EXCLUDED.city,
          state = EXCLUDED.state
        RETURNING id
      `

      const stationId = result[0].id
      stationsInserted++

      // Insert prices
      for (const price of station.fuel_prices) {
        // Normalize fuel type
        let fuelType = price.fuel_type
        if (fuelType.includes('Regular') || fuelType === 'UNL88') fuelType = 'Regular'
        if (fuelType.includes('Midgrade')) fuelType = 'Midgrade'
        if (fuelType.includes('Premium')) fuelType = 'Premium'
        if (fuelType.includes('Diesel')) fuelType = 'Diesel'
        if (fuelType === 'E85') continue // Skip E85 for now

        await sql`
          INSERT INTO gas_prices (station_id, fuel_type, price, scraped_at)
          VALUES (${stationId}, ${fuelType}, ${price.price}, NOW())
        `
        pricesInserted++
      }

      console.log(`✓ ${station.brand_name} - ${station.street_address}`)
    } catch (err) {
      console.error(`✗ ${station.brand_name}: ${err.message}`)
    }
  }

  console.log(`\nImported ${stationsInserted} stations with ${pricesInserted} prices`)
}

importData().catch(console.error)
