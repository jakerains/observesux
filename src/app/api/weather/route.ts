import { NextResponse } from 'next/server'
import { fetchNWSObservations } from '@/lib/fetchers/nws'
import { storeWeatherObservation } from '@/lib/db/historical'
import type { WeatherObservation, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

// Sioux City coordinates
const LAT = 42.4997
const LON = -96.4003

function wmoCodeToDescription(code: number): string {
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mainly Clear'
  if (code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if ([45, 48].includes(code)) return 'Foggy'
  if ([51, 53, 55].includes(code)) return 'Drizzle'
  if ([61, 63, 65].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Rain Showers'
  if ([85, 86].includes(code)) return 'Snow Showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Unknown'
}

async function fetchOpenMeteoFallback(): Promise<WeatherObservation> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,visibility,surface_pressure&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=America%2FChicago`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
  const data = await res.json()
  const c = data.current

  return {
    stationId: 'OPEN-METEO',
    stationName: 'Sioux City (Open-Meteo)',
    timestamp: new Date(c.time),
    temperature: c.temperature_2m != null ? Math.round(c.temperature_2m * 10) / 10 : null,
    temperatureUnit: 'F',
    humidity: c.relative_humidity_2m != null ? Math.round(c.relative_humidity_2m) : null,
    windSpeed: c.wind_speed_10m != null ? Math.round(c.wind_speed_10m * 10) / 10 : null,
    windDirection: null,
    windGust: c.wind_gusts_10m != null ? Math.round(c.wind_gusts_10m * 10) / 10 : null,
    pressure: c.surface_pressure != null ? Math.round(c.surface_pressure * 0.02953 * 100) / 100 : null,
    visibility: c.visibility != null ? Math.round(c.visibility * 0.000621371 * 10) / 10 : null,
    conditions: wmoCodeToDescription(c.weather_code ?? 0),
    dewpoint: null,
    heatIndex: null,
    windChill: c.apparent_temperature != null ? Math.round(c.apparent_temperature * 10) / 10 : null,
  }
}

export async function GET() {
  let observation: WeatherObservation
  let source: string

  try {
    observation = await fetchNWSObservations()
    source = 'nws'
  } catch (nwsError) {
    console.warn('[Weather] NWS failed, falling back to Open-Meteo:', nwsError instanceof Error ? nwsError.message : nwsError)
    try {
      observation = await fetchOpenMeteoFallback()
      source = 'open-meteo'
    } catch (fallbackError) {
      console.error('[Weather] Both NWS and Open-Meteo failed:', fallbackError)
      return NextResponse.json(
        { data: null, timestamp: new Date(), source: 'error', error: 'Failed to fetch weather data' },
        { status: 500 }
      )
    }
  }

  // Store observation to database for historical tracking (non-blocking)
  const feelsLike = observation.windChill ?? observation.heatIndex ?? observation.temperature
  storeWeatherObservation({
    temperature: observation.temperature,
    feelsLike,
    humidity: observation.humidity,
    windSpeed: observation.windSpeed,
    windDirection: observation.windDirection,
    windGust: observation.windGust,
    conditions: observation.conditions,
    visibility: observation.visibility,
    pressure: observation.pressure,
    observedAt: new Date(observation.timestamp)
  }).catch(() => {})

  const response: ApiResponse<WeatherObservation> = {
    data: observation,
    timestamp: new Date(),
    source
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30' }
  })
}
