/**
 * Sunrise-Sunset API — Solar data for Sioux City
 * Free, no API key required
 */

const SIOUX_CITY_LAT = 42.4969
const SIOUX_CITY_LON = -96.4003

export interface SunData {
  sunrise: string
  sunset: string
  dawn: string
  dusk: string
  goldenHour: string
  dayLength: string
  solarNoon: string
  firstLight: string
  lastLight: string
}

export async function fetchSunData(): Promise<SunData> {
  const response = await fetch(
    `https://api.sunrisesunset.io/json?lat=${SIOUX_CITY_LAT}&lng=${SIOUX_CITY_LON}&timezone=America/Chicago`
  )

  if (!response.ok) {
    throw new Error(`Sunrise-Sunset API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK' || !data.results) {
    throw new Error('Invalid response from Sunrise-Sunset API')
  }

  return {
    sunrise: data.results.sunrise,
    sunset: data.results.sunset,
    dawn: data.results.dawn,
    dusk: data.results.dusk,
    goldenHour: data.results.golden_hour,
    dayLength: data.results.day_length,
    solarNoon: data.results.solar_noon,
    firstLight: data.results.first_light,
    lastLight: data.results.last_light,
  }
}
