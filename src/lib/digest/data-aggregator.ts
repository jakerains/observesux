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

// Base URL for internal API calls
const getBaseUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Fetch from internal API with error handling
 */
async function fetchFromApi<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      cache: 'no-store' // Get fresh data from our cached APIs
    })
    if (!response.ok) {
      console.warn(`[Digest] ${endpoint} returned:`, response.status)
      return fallback
    }
    return await response.json()
  } catch (error) {
    console.error(`[Digest] Failed to fetch ${endpoint}:`, error)
    return fallback
  }
}

/**
 * Fetch weather data from dashboard API
 */
async function fetchWeather(): Promise<WeatherObservation | null> {
  const data = await fetchFromApi<{ data?: WeatherObservation }>('/api/weather', {})
  return data.data || null
}

/**
 * Fetch weather forecast from dashboard API
 */
async function fetchForecast(): Promise<WeatherForecastSummary | null> {
  const data = await fetchFromApi<{ data?: { forecast?: { periods: Array<{
    name: string
    temperature: number
    temperatureUnit: string
    shortForecast: string
    detailedForecast: string
  }> } } }>('/api/weather/forecast', {})

  const periods = data.data?.forecast?.periods
  if (!periods) return null

  return {
    periods: periods.slice(0, 4).map(p => ({
      name: p.name,
      temperature: p.temperature,
      temperatureUnit: p.temperatureUnit,
      shortForecast: p.shortForecast,
      detailedForecast: p.detailedForecast
    }))
  }
}

/**
 * Fetch weather alerts from dashboard API
 */
async function fetchAlerts(): Promise<WeatherAlert[]> {
  const data = await fetchFromApi<{ data?: WeatherAlert[] }>('/api/weather/alerts', {})
  return data.data || []
}

/**
 * Fetch river data from dashboard API
 */
async function fetchRivers(): Promise<RiverGaugeReading[]> {
  const data = await fetchFromApi<{ data?: RiverGaugeReading[] }>('/api/rivers', {})
  return data.data || []
}

/**
 * Fetch air quality from dashboard API
 */
async function fetchAirQuality(): Promise<AirQualityReading | null> {
  const data = await fetchFromApi<{ data?: AirQualityReading }>('/api/air-quality', {})
  return data.data || null
}

/**
 * Fetch traffic events from dashboard API
 */
async function fetchTraffic(): Promise<TrafficEvent[]> {
  const data = await fetchFromApi<{ data?: TrafficEvent[] }>('/api/traffic-events', {})
  return (data.data || []).slice(0, 5)
}

/**
 * Fetch news from dashboard API
 */
async function fetchNews(): Promise<NewsArticle[]> {
  const data = await fetchFromApi<{ data?: Array<{
    id: string
    title: string
    link: string
    description?: string
    pubDate: string | Date
    source: string
    isBreaking?: boolean
  }> }>('/api/news', {})

  return (data.data || []).slice(0, 5).map(item => ({
    id: item.id,
    title: item.title,
    link: item.link,
    description: item.description,
    pubDate: new Date(item.pubDate),
    source: item.source,
    isBreaking: item.isBreaking
  }))
}

/**
 * Fetch events from dashboard API
 */
async function fetchEvents(): Promise<LocalEvent[]> {
  const data = await fetchFromApi<{ data?: { events?: Array<{
    title: string
    date: string
    time?: string
    location?: string
    url?: string
    source?: string
  }> } }>('/api/events', {})

  const events = data.data?.events || []
  return events.slice(0, 5).map(e => ({
    title: e.title,
    date: e.date,
    time: e.time,
    location: e.location,
    url: e.url,
    source: e.source
  }))
}

/**
 * Fetch gas prices from dashboard API
 */
async function fetchGasPrices(): Promise<GasPriceSummary | null> {
  const data = await fetchFromApi<{ data?: { stats?: {
    averageRegular: number
    lowestRegular: number
    highestRegular: number
    stationCount: number
  } } }>('/api/gas-prices', {})

  const stats = data.data?.stats
  if (!stats) return null

  return {
    averageRegular: stats.averageRegular,
    lowestRegular: stats.lowestRegular,
    highestRegular: stats.highestRegular,
    stationCount: stats.stationCount
  }
}

/**
 * Fetch flight data from dashboard API
 */
async function fetchFlights(): Promise<FlightDelaySummary | null> {
  interface FlightData {
    airline: string
    flightNumber: string
    destination?: string
    destinationCity?: string
    origin?: string
    originCity?: string
    scheduledTime: string | Date
    status: string
    type?: string
  }

  const data = await fetchFromApi<{ data?: {
    arrivals?: FlightData[]
    departures?: FlightData[]
  } }>('/api/flights', {})

  if (!data.data) return null

  // Combine arrivals and departures into a single list
  const arrivals = data.data.arrivals || []
  const departures = data.data.departures || []
  const allFlights = [...arrivals, ...departures]

  const delayedFlights = allFlights.filter(f =>
    f.status === 'delayed' || f.status === 'cancelled'
  )

  return {
    totalDelays: delayedFlights.filter(f => f.status === 'delayed').length,
    totalCancellations: delayedFlights.filter(f => f.status === 'cancelled').length,
    delayedFlights: delayedFlights.slice(0, 5).map(f => ({
      airline: f.airline,
      flightNumber: f.flightNumber,
      // For arrivals, show origin; for departures, show destination
      destination: f.type === 'arrival'
        ? (f.origin || f.originCity || 'Unknown')
        : (f.destination || f.destinationCity || 'Unknown'),
      scheduledTime: new Date(f.scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }),
      status: f.status
    }))
  }
}

/**
 * Aggregates all data from dashboard APIs for digest generation
 * Uses the same data that's already cached/displayed on the dashboard
 */
export async function aggregateDigestData(): Promise<DigestData> {
  console.log('[Digest] Fetching data from dashboard APIs...')
  const startTime = Date.now()

  // Fetch all data sources in parallel from internal APIs
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
    fetchWeather(),
    fetchForecast(),
    fetchAlerts(),
    fetchRivers(),
    fetchAirQuality(),
    fetchTraffic(),
    fetchNews(),
    fetchEvents(),
    fetchGasPrices(),
    fetchFlights()
  ])

  const duration = Date.now() - startTime
  console.log(`[Digest] Data aggregation complete in ${duration}ms`)

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
