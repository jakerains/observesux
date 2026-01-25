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

import { RetryableError, FatalError } from 'workflow'
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

  try {
    const data = await fetchNWSObservations()

    // Check if we got real data or a fallback
    if (data.conditions === 'Data unavailable') {
      throw new RetryableError('NWS observations unavailable', { retryAfter: 30_000 })
    }

    return data
  } catch (error) {
    if (error instanceof RetryableError) throw error

    // Network/timeout errors are retryable
    if (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')
    )) {
      throw new RetryableError(`Weather fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    console.error('[fetchWeatherStep] Error:', error)
    return null
  }
}

/**
 * Fetch weather forecast
 */
export async function fetchForecastStep(): Promise<WeatherForecastSummary | null> {
  "use step"

  try {
    const forecast = await fetchNWSForecast()

    if (!forecast.periods || forecast.periods.length === 0) {
      throw new RetryableError('No forecast periods returned', { retryAfter: 30_000 })
    }

    return {
      periods: forecast.periods.slice(0, 4).map(p => ({
        name: p.name,
        temperature: p.temperature,
        temperatureUnit: p.temperatureUnit,
        shortForecast: p.shortForecast,
        detailedForecast: p.detailedForecast
      }))
    }
  } catch (error) {
    if (error instanceof RetryableError) throw error

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Forecast fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    console.error('[fetchForecastStep] Error:', error)
    return null
  }
}

/**
 * Fetch weather alerts
 */
export async function fetchAlertsStep(): Promise<WeatherAlert[]> {
  "use step"

  try {
    return await fetchNWSAlerts()
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Alerts fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    console.error('[fetchAlertsStep] Error:', error)
    return []
  }
}

/**
 * Fetch river gauge readings
 */
export async function fetchRiversStep(): Promise<RiverGaugeReading[]> {
  "use step"

  try {
    const data = await fetchRiverGauges()

    if (data.length === 0) {
      throw new RetryableError('No river data returned', { retryAfter: 30_000 })
    }

    return data
  } catch (error) {
    if (error instanceof RetryableError) throw error

    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Rivers fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    console.error('[fetchRiversStep] Error:', error)
    return []
  }
}

/**
 * Fetch air quality data
 */
export async function fetchAirQualityStep(): Promise<AirQualityReading | null> {
  "use step"

  try {
    return await fetchAirQuality()
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Air quality fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    console.error('[fetchAirQualityStep] Error:', error)
    return null
  }
}

/**
 * Fetch traffic events
 */
export async function fetchTrafficStep(): Promise<TrafficEvent[]> {
  "use step"

  try {
    const events = await fetch511Events()
    return events.slice(0, 5) // Limit to 5 events for digest
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Traffic fetch failed: ${error.message}`, { retryAfter: 15_000 })
    }

    console.error('[fetchTrafficStep] Error:', error)
    return []
  }
}

/**
 * Fetch local news
 */
export async function fetchNewsStep(): Promise<NewsArticle[]> {
  "use step"

  try {
    const news = await fetchLocalNews()

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
    if (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    )) {
      throw new RetryableError(`News fetch failed: ${error.message}`, { retryAfter: 20_000 })
    }

    console.error('[fetchNewsStep] Error:', error)
    return []
  }
}

/**
 * Fetch community events
 */
export async function fetchEventsStep(): Promise<LocalEvent[]> {
  "use step"

  try {
    const data = await fetchCommunityEvents()

    return data.events.slice(0, 5).map(e => ({
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      url: e.url,
      source: e.source
    }))
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new RetryableError(`Events fetch failed: ${error.message}`, { retryAfter: 20_000 })
    }

    console.error('[fetchEventsStep] Error:', error)
    return []
  }
}

/**
 * Fetch gas prices from database
 */
export async function fetchGasPricesStep(): Promise<GasPriceSummary | null> {
  "use step"

  if (!isDatabaseConfigured()) {
    console.warn('[fetchGasPricesStep] Database not configured')
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

    if (pricesResult.length === 0) {
      return null
    }

    const prices = pricesResult.map(p => parseFloat(p.price))

    return {
      averageRegular: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 1000) / 1000,
      lowestRegular: Math.min(...prices),
      highestRegular: Math.max(...prices),
      stationCount: prices.length
    }
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      throw new RetryableError(`Gas prices DB query failed: ${error.message}`, { retryAfter: 10_000 })
    }

    console.error('[fetchGasPricesStep] Error:', error)
    return null
  }
}

/**
 * Fetch flight information
 * Note: Currently returns demo data as no real API is configured
 */
export async function fetchFlightsStep(): Promise<FlightDelaySummary | null> {
  "use step"

  try {
    // Since /api/flights returns demo data, we'll generate it directly here
    // In production, this would call a real flight API (FlightAware, etc.)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Demo flight data for SUX airport
    const demoFlights = [
      {
        airline: 'United Express',
        flightNumber: 'UA 5432',
        destination: "Chicago O'Hare",
        scheduledTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        status: 'scheduled' as const
      },
      {
        airline: 'American Eagle',
        flightNumber: 'AA 3892',
        destination: 'Dallas/Fort Worth',
        scheduledTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        status: 'scheduled' as const
      }
    ]

    // No delays in demo data
    return {
      totalDelays: 0,
      totalCancellations: 0,
      delayedFlights: []
    }
  } catch (error) {
    console.error('[fetchFlightsStep] Error:', error)
    return null
  }
}

/**
 * Aggregates all data from direct fetcher calls
 * This is the main entry point for workflow data collection
 */
export async function aggregateAllData(): Promise<DigestData> {
  console.log('[Digest Workflow] Starting data aggregation...')
  const startTime = Date.now()

  // Fetch all data sources in parallel
  // Each step function handles its own retries
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
  console.log(`[Digest Workflow] Data aggregation complete in ${duration}ms`)

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
