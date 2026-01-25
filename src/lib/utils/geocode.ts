// Geocoding utility using Nominatim (OpenStreetMap)
// Free API - respect rate limits (1 request per second)

export interface GeocodedLocation {
  latitude: number
  longitude: number
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 * Free service, no API key required
 * Rate limit: 1 request per second (enforced by caller)
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', address)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'us') // Limit to US for better accuracy

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SiouxlandOnline/1.0 (https://siouxland.online)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Geocoding failed for "${address}": ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      }
    }

    console.warn(`No geocoding results for address: ${address}`)
    return null
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error)
    return null
  }
}

/**
 * Parse city and state from an address string
 * Handles formats like:
 * - "123 Main St, Sioux City, IA"
 * - "123 Main St, Sioux City, IA 51101"
 * - "123 Main St Sioux City IA"
 */
export function parseCityState(address: string): { city: string | null; state: string | null } {
  // Common state abbreviations we care about
  const statePattern = /\b(IA|NE|SD)\b/i

  // Try to extract state
  const stateMatch = address.match(statePattern)
  const state = stateMatch ? stateMatch[1].toUpperCase() : null

  // Known cities in the Siouxland area
  const knownCities = [
    'Sioux City',
    'South Sioux City',
    'North Sioux City',
    'Sergeant Bluff',
    'Elk Point',
    'Dakota Dunes',
    'Le Mars',
    'Vermillion'
  ]

  for (const city of knownCities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return { city, state }
    }
  }

  // Try to extract city from comma-separated format
  const parts = address.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    // Second-to-last part is often the city
    const potentialCity = parts[parts.length - 2]
    // Clean up any numbers (zip codes, street numbers)
    const cleanCity = potentialCity.replace(/\d+/g, '').trim()
    if (cleanCity && cleanCity.length > 2) {
      return { city: cleanCity, state }
    }
  }

  return { city: null, state }
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
