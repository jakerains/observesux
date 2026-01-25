/**
 * Workflow Step Functions for Digest Data Fetching
 *
 * Each function is designed to be used as a step in a Vercel Workflow.
 * They use the "use step" directive for automatic retries and durability.
 *
 * Key changes from the original data-aggregator.ts:
 * 1. Direct function calls instead of HTTP self-calls
 * 2. Retryable errors for transient failures
 * 3. Fatal errors for configuration issues
 */

import { RetryableError } from 'workflow'
import type {
  DigestData,
  WeatherForecastSummary,
  GasPriceSummary,
  FlightDelaySummary,
  NewsArticle,
  LocalEvent,
} from './types'
import type {
  WeatherObservation,
  WeatherAlert,
  RiverGaugeReading,
  AirQualityReading,
  TrafficEvent,
} from '@/types'

// Import fetchers directly (no HTTP)
import { fetchNWSObservations, fetchNWSForecast, fetchNWSAlerts } from '@/lib/fetchers/nws'
import { fetchRiverGauges } from '@/lib/fetchers/usgs'
import { fetchAirQuality } from '@/lib/fetchers/airnow'
import { fetch511Events } from '@/lib/fetchers/iowa-dot'
import { fetchCommunityEvents } from '@/lib/fetchers/events'
import { fetchLocalNews, type NewsItem } from '@/lib/fetchers/news'
import { sql, isDatabaseConfigured } from '@/lib/db'

/**
 * Fetch current weather observations
 */
export async function fetchWeatherStep(): Promise<WeatherObservation | null> {
  "use step"

  console.log('[fetchWeatherStep] Starting NWS observations fetch...')
  const startTime = Date.now()

  try {
    const data = await fetchNWSObservations()
    const duration = Date.now() - startTime

    console.log(`[fetchWeatherStep] Completed in ${duration}ms`)
    console.log(`[fetchWeatherStep] Result: conditions="${data.conditions}", temp=${data.temperature}°F`)

    // Check if we got real data or a fallback
    if (data.conditions === 'Data unavailable') {
      console.warn('[fetchWeatherStep] Got fallback data, will retry...')
      throw new RetryableError('NWS observations unavailable', { retryAfter: 30_000 })
    }

    return data
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchWeatherStep] Failed after ${duration}ms:`, error)

    if (error instanceof RetryableError) throw error

    // Network/timeout errors are retryable
    if (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')
    )) {
      throw new RetryableError(`Weather fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    return null
  }
}

/**
 * Fetch weather forecast
 */
export async function fetchForecastStep(): Promise<WeatherForecastSummary | null> {
  "use step"

  console.log('[fetchForecastStep] Starting NWS forecast fetch...')
  const startTime = Date.now()

  try {
    const forecast = await fetchNWSForecast()
    const duration = Date.now() - startTime

    console.log(`[fetchForecastStep] Completed in ${duration}ms`)
    console.log(`[fetchForecastStep] Got ${forecast.periods?.length || 0} forecast periods`)

    if (!forecast.periods || forecast.periods.length === 0) {
      console.warn('[fetchForecastStep] No forecast periods returned, will retry...')
      throw new RetryableError('No forecast periods returned', { retryAfter: 30_000 })
    }

    const result = {
      periods: forecast.periods.slice(0, 4).map(p => ({
        name: p.name,
        temperature: p.temperature,
        temperatureUnit: p.temperatureUnit,
        shortForecast: p.shortForecast,
        detailedForecast: p.detailedForecast
      }))
    }

    console.log(`[fetchForecastStep] Returning ${result.periods.length} periods:`,
      result.periods.map(p => `${p.name}: ${p.temperature}°${p.temperatureUnit}`).join(', '))

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchForecastStep] Failed after ${duration}ms:`, error)

    if (error instanceof RetryableError) throw error

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Forecast fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    return null
  }
}

/**
 * Fetch weather alerts
 */
export async function fetchAlertsStep(): Promise<WeatherAlert[]> {
  "use step"

  console.log('[fetchAlertsStep] Starting NWS alerts fetch...')
  const startTime = Date.now()

  try {
    const alerts = await fetchNWSAlerts()
    const duration = Date.now() - startTime

    console.log(`[fetchAlertsStep] Completed in ${duration}ms`)
    console.log(`[fetchAlertsStep] Got ${alerts.length} active alerts`)
    if (alerts.length > 0) {
      console.log(`[fetchAlertsStep] Alerts:`, alerts.map(a => `${a.event} (${a.severity})`).join(', '))
    }

    return alerts
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchAlertsStep] Failed after ${duration}ms:`, error)

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Alerts fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    return []
  }
}

/**
 * Fetch river gauge readings
 */
export async function fetchRiversStep(): Promise<RiverGaugeReading[]> {
  "use step"

  console.log('[fetchRiversStep] Starting USGS river gauge fetch...')
  const startTime = Date.now()

  try {
    const data = await fetchRiverGauges()
    const duration = Date.now() - startTime

    console.log(`[fetchRiversStep] Completed in ${duration}ms`)
    console.log(`[fetchRiversStep] Got ${data.length} river gauges`)
    if (data.length > 0) {
      console.log(`[fetchRiversStep] Rivers:`, data.map(r => `${r.siteName}: ${r.gaugeHeight}ft`).join(', '))
    }

    if (data.length === 0) {
      console.warn('[fetchRiversStep] No river data returned, will retry...')
      throw new RetryableError('No river data returned', { retryAfter: 30_000 })
    }

    return data
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchRiversStep] Failed after ${duration}ms:`, error)

    if (error instanceof RetryableError) throw error

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Rivers fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    return []
  }
}

/**
 * Fetch air quality data
 */
export async function fetchAirQualityStep(): Promise<AirQualityReading | null> {
  "use step"

  console.log('[fetchAirQualityStep] Starting AirNow fetch...')
  const startTime = Date.now()

  try {
    const data = await fetchAirQuality()
    const duration = Date.now() - startTime

    console.log(`[fetchAirQualityStep] Completed in ${duration}ms`)
    if (data) {
      console.log(`[fetchAirQualityStep] AQI: ${data.aqi} (${data.category})`)
    } else {
      console.log(`[fetchAirQualityStep] No air quality data returned`)
    }

    return data
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchAirQualityStep] Failed after ${duration}ms:`, error)

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Air quality fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    return null
  }
}

/**
 * Fetch traffic events
 */
export async function fetchTrafficStep(): Promise<TrafficEvent[]> {
  "use step"

  console.log('[fetchTrafficStep] Starting Iowa DOT 511 fetch...')
  const startTime = Date.now()

  try {
    const events = await fetch511Events()
    const duration = Date.now() - startTime

    console.log(`[fetchTrafficStep] Completed in ${duration}ms`)
    console.log(`[fetchTrafficStep] Got ${events.length} traffic events`)
    if (events.length > 0) {
      console.log(`[fetchTrafficStep] Events:`, events.slice(0, 3).map(e => e.headline).join('; '))
    }

    return events.slice(0, 5) // Limit to 5 events for digest
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchTrafficStep] Failed after ${duration}ms:`, error)

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Traffic fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    return []
  }
}

/**
 * Fetch local news
 */
export async function fetchNewsStep(): Promise<NewsArticle[]> {
  "use step"

  console.log('[fetchNewsStep] Starting RSS news fetch...')
  const startTime = Date.now()

  try {
    const news = await fetchLocalNews()
    const duration = Date.now() - startTime

    console.log(`[fetchNewsStep] Completed in ${duration}ms`)
    console.log(`[fetchNewsStep] Got ${news.length} news articles`)
    if (news.length > 0) {
      console.log(`[fetchNewsStep] Headlines:`, news.slice(0, 3).map(n => n.title.slice(0, 50)).join('; '))
    }

    // Convert NewsItem to NewsArticle format expected by digest
    return news.slice(0, 5).map((item: NewsItem): NewsArticle => ({
      id: item.id,
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
      source: item.source,
      isBreaking: item.isBreaking
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchNewsStep] Failed after ${duration}ms:`, error)

    if (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    )) {
      throw new RetryableError(`News fetch failed: ${error.message}`, { retryAfter: 20_000 })
    }

    return []
  }
}

/**
 * Fetch community events
 */
export async function fetchEventsStep(): Promise<LocalEvent[]> {
  "use step"

  console.log('[fetchEventsStep] Starting community events fetch...')
  const startTime = Date.now()

  try {
    const data = await fetchCommunityEvents()
    const duration = Date.now() - startTime

    console.log(`[fetchEventsStep] Completed in ${duration}ms`)
    console.log(`[fetchEventsStep] Got ${data.events.length} community events`)
    if (data.events.length > 0) {
      console.log(`[fetchEventsStep] Events:`, data.events.slice(0, 3).map(e => e.title).join('; '))
    }

    return data.events.slice(0, 5).map(e => ({
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      url: e.url,
      source: e.source
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchEventsStep] Failed after ${duration}ms:`, error)

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Events fetch failed: ${error.message}`, { retryAfter: 20_000 })
    }

    return []
  }
}

/**
 * Fetch gas prices from database
 */
export async function fetchGasPricesStep(): Promise<GasPriceSummary | null> {
  "use step"

  console.log('[fetchGasPricesStep] Starting gas prices DB query...')
  const startTime = Date.now()

  if (!isDatabaseConfigured()) {
    console.warn('[fetchGasPricesStep] Database not configured, skipping')
    return null
  }

  try {
    // Query database directly instead of HTTP call
    const pricesResult = await sql`
      SELECT DISTINCT ON (station_id)
        station_id, price
      FROM gas_prices
      WHERE fuel_type = 'Regular'
        AND scraped_at > NOW() - INTERVAL '48 hours'
      ORDER BY station_id, scraped_at DESC
    ` as { station_id: number; price: string }[]

    const duration = Date.now() - startTime
    console.log(`[fetchGasPricesStep] Completed in ${duration}ms`)
    console.log(`[fetchGasPricesStep] Got ${pricesResult.length} gas prices`)

    if (pricesResult.length === 0) {
      console.log(`[fetchGasPricesStep] No recent gas prices found`)
      return null
    }

    const prices = pricesResult.map(p => parseFloat(p.price))
    const result = {
      averageRegular: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 1000) / 1000,
      lowestRegular: Math.min(...prices),
      highestRegular: Math.max(...prices),
      stationCount: prices.length
    }

    console.log(`[fetchGasPricesStep] Average: $${result.averageRegular}, Low: $${result.lowestRegular}, High: $${result.highestRegular}`)

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchGasPricesStep] Failed after ${duration}ms:`, error)

    if (error instanceof Error && (
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      throw new RetryableError(`Gas prices DB query failed: ${error.message}`, { retryAfter: 10_000 })
    }

    return null
  }
}

/**
 * Fetch flight information
 * Note: Currently returns demo data as no real API is configured
 */
export async function fetchFlightsStep(): Promise<FlightDelaySummary | null> {
  "use step"

  console.log('[fetchFlightsStep] Starting flights fetch (demo data)...')
  const startTime = Date.now()

  try {
    // Since /api/flights returns demo data, we'll generate it directly here
    // In production, this would call a real flight API (FlightAware, etc.)

    const result = {
      totalDelays: 0,
      totalCancellations: 0,
      delayedFlights: []
    }

    const duration = Date.now() - startTime
    console.log(`[fetchFlightsStep] Completed in ${duration}ms`)
    console.log(`[fetchFlightsStep] Delays: ${result.totalDelays}, Cancellations: ${result.totalCancellations}`)

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[fetchFlightsStep] Failed after ${duration}ms:`, error)
    return null
  }
}

/**
 * Aggregates all data from direct fetcher calls
 * This is the main entry point for workflow data collection
 */
export async function aggregateAllData(): Promise<DigestData> {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         DIGEST DATA AGGREGATION STARTING                   ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  const startTime = Date.now()

  // Fetch all data sources in parallel
  // Each step function handles its own retries
  console.log('[aggregateAllData] Fetching all data sources in parallel...')

  const [
    weather,
    forecast,
    alerts,
    rivers,
    airQuality,
    traffic,
    news,
    events,
    gasPrices,
    flights
  ] = await Promise.all([
    fetchWeatherStep(),
    fetchForecastStep(),
    fetchAlertsStep(),
    fetchRiversStep(),
    fetchAirQualityStep(),
    fetchTrafficStep(),
    fetchNewsStep(),
    fetchEventsStep(),
    fetchGasPricesStep(),
    fetchFlightsStep()
  ])

  const duration = Date.now() - startTime

  // Summary logging
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         DATA AGGREGATION SUMMARY                           ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║ Weather:     ${weather ? `✓ ${weather.conditions}, ${weather.temperature}°F` : '✗ NULL'}`)
  console.log(`║ Forecast:    ${forecast ? `✓ ${forecast.periods.length} periods` : '✗ NULL'}`)
  console.log(`║ Alerts:      ${alerts.length > 0 ? `✓ ${alerts.length} alerts` : '○ 0 alerts'}`)
  console.log(`║ Rivers:      ${rivers.length > 0 ? `✓ ${rivers.length} gauges` : '✗ 0 gauges'}`)
  console.log(`║ Air Quality: ${airQuality ? `✓ AQI ${airQuality.aqi}` : '✗ NULL'}`)
  console.log(`║ Traffic:     ${traffic.length > 0 ? `✓ ${traffic.length} events` : '○ 0 events'}`)
  console.log(`║ News:        ${news.length > 0 ? `✓ ${news.length} articles` : '✗ 0 articles'}`)
  console.log(`║ Events:      ${events.length > 0 ? `✓ ${events.length} events` : '○ 0 events'}`)
  console.log(`║ Gas Prices:  ${gasPrices ? `✓ $${gasPrices.averageRegular} avg` : '✗ NULL'}`)
  console.log(`║ Flights:     ${flights ? `✓ ${flights.totalDelays} delays` : '✗ NULL'}`)
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║ Total time: ${duration}ms                                  `)
  console.log('╚════════════════════════════════════════════════════════════╝')

  return {
    weather: {
      current: weather,
      forecast,
      alerts
    },
    rivers,
    airQuality,
    traffic,
    news,
    events,
    gasPrices,
    flights,
    timestamp: new Date().toISOString()
  }
}
