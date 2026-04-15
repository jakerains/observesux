import { NextRequest, NextResponse } from 'next/server'
import { fetchAirQuality } from '@/lib/fetchers/airnow'
import { fetchRiverGauges } from '@/lib/fetchers/usgs'
import {
  storeAirQualityReading,
  storeRiverReading,
  storeWeatherObservation,
  logCronRun,
} from '@/lib/db/historical'
import { verifyCronRequest } from '@/lib/utils/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

async function snapshotWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,visibility,surface_pressure&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=America%2FChicago`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
  const data = await res.json()
  const c = data.current

  const temperature = c.temperature_2m != null ? Math.round(c.temperature_2m * 10) / 10 : null
  const feelsLike = c.apparent_temperature != null ? Math.round(c.apparent_temperature * 10) / 10 : temperature

  await storeWeatherObservation({
    temperature,
    feelsLike,
    humidity: c.relative_humidity_2m != null ? Math.round(c.relative_humidity_2m) : null,
    windSpeed: c.wind_speed_10m != null ? Math.round(c.wind_speed_10m * 10) / 10 : null,
    windDirection: null,
    windGust: c.wind_gusts_10m != null ? Math.round(c.wind_gusts_10m * 10) / 10 : null,
    conditions: wmoCodeToDescription(c.weather_code ?? 0),
    visibility: c.visibility != null ? Math.round(c.visibility * 0.000621371 * 10) / 10 : null,
    pressure: c.surface_pressure != null ? Math.round(c.surface_pressure * 0.02953 * 100) / 100 : null,
    observedAt: new Date(c.time),
  })

  return { temperature, conditions: wmoCodeToDescription(c.weather_code ?? 0) }
}

async function snapshotRivers() {
  const readings = await fetchRiverGauges()
  let stored = 0
  for (const reading of readings) {
    await storeRiverReading({
      siteId: reading.siteId,
      siteName: reading.siteName,
      gaugeHeight: reading.gaugeHeight,
      discharge: reading.discharge,
      waterTemp: reading.waterTemp,
      floodStage: reading.floodStage,
      observedAt: new Date(reading.timestamp),
    })
    stored++
  }
  return { stationsRead: readings.length, stored }
}

async function snapshotAirQuality() {
  const reading = await fetchAirQuality()
  await storeAirQualityReading({
    aqi: reading.aqi,
    category: reading.category,
    primaryPollutant: reading.primaryPollutant,
    pm25: reading.pm25,
    source: reading.source,
    observedAt: new Date(reading.timestamp),
  })
  return { aqi: reading.aqi, source: reading.source }
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date()

  const results = await Promise.allSettled([
    snapshotWeather(),
    snapshotRivers(),
    snapshotAirQuality(),
  ])

  const summary = {
    weather: results[0].status === 'fulfilled' ? results[0].value : { error: String((results[0] as PromiseRejectedResult).reason) },
    rivers: results[1].status === 'fulfilled' ? results[1].value : { error: String((results[1] as PromiseRejectedResult).reason) },
    airQuality: results[2].status === 'fulfilled' ? results[2].value : { error: String((results[2] as PromiseRejectedResult).reason) },
  }

  const allSucceeded = results.every((r) => r.status === 'fulfilled')
  await logCronRun(
    'historical-snapshot',
    allSucceeded ? 'success' : 'error',
    startedAt,
    summary,
    allSucceeded ? undefined : 'One or more snapshots failed'
  )

  return NextResponse.json({ success: allSucceeded, ...summary, timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
