import type {
  WeatherObservation,
  WeatherAlert,
  RiverGaugeReading,
  AirQualityReading,
  TrafficEvent,
  NewsItem,
  CommunityEvent,
} from '@/types'

// Re-export with digest-friendly names
export type NewsArticle = NewsItem
export type LocalEvent = CommunityEvent

/**
 * Edition types for scheduled digests
 */
export type DigestEdition = 'morning' | 'midday' | 'evening'

/**
 * Get the current edition based on time of day (Central Time)
 * - Morning: 6 AM - 11 AM
 * - Midday: 11 AM - 5 PM
 * - Evening: 5 PM - 6 AM
 */
export function getCurrentEdition(): DigestEdition {
  // Get current hour in Central Time
  const now = new Date()
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }))
  const hour = centralTime.getHours()

  if (hour >= 6 && hour < 11) {
    return 'morning'
  } else if (hour >= 11 && hour < 17) {
    return 'midday'
  } else {
    return 'evening'
  }
}

/**
 * Get human-readable label for an edition
 */
export const editionLabels: Record<DigestEdition, string> = {
  morning: 'Morning Edition',
  midday: 'Midday Update',
  evening: 'Evening Edition'
}

/**
 * Stored digest record in the database
 */
export interface Digest {
  id: string
  edition: DigestEdition
  date: string // YYYY-MM-DD format
  summary: string // Short 2-3 sentence summary for widget display
  content: string
  dataSnapshot: DigestData | null
  generationTimeMs: number
  createdAt: string
  isActive: boolean // Whether this is the active version for display
  version: number // Version number (1, 2, 3...) within same edition/date
}

/**
 * Aggregated data used to generate a digest
 */
export interface DigestData {
  weather: {
    current: WeatherObservation | null
    forecast: WeatherForecastSummary | null
    alerts: WeatherAlert[]
  }
  rivers: RiverGaugeReading[]
  airQuality: AirQualityReading | null
  traffic: TrafficEvent[]
  news: NewsArticle[]
  events: LocalEvent[]
  gasPrices: GasPriceSummary | null
  flights: FlightDelaySummary | null
  schools: SchoolUpdate[] // School closings, delays, and announcements from Firecrawl
  councilRecap: CouncilRecapDigest | null // Monday night council meeting recap (Tuesday morning only)
  timestamp: string
}

/**
 * Simplified forecast data for digest
 */
export interface WeatherForecastSummary {
  periods: Array<{
    name: string
    temperature: number
    temperatureUnit: string
    shortForecast: string
    detailedForecast: string
  }>
}

/**
 * Summary of gas prices for the area
 */
export interface GasPriceSummary {
  averageRegular: number
  lowestRegular: number
  highestRegular: number
  stationCount: number
  cheapestStation: string | null // Name of station with lowest price
  cheapestAddress: string | null // Address of cheapest station
}

/**
 * Summary of flight delays
 */
export interface FlightDelaySummary {
  totalDelays: number
  totalCancellations: number
  delayedFlights: Array<{
    airline: string
    flightNumber: string
    destination: string
    scheduledTime: string
    status: string
  }>
}

/**
 * Flattened council meeting recap for digest inclusion (Tuesday morning only)
 */
export interface CouncilRecapDigest {
  summary: string
  decisions: string[]
  topics: string[]
  publicComments: string[]
  videoId: string
  title: string
  meetingDate: string | null
}

/**
 * School update from Firecrawl search
 */
export interface SchoolUpdate {
  title: string
  snippet: string
  url: string
  source: string
  isClosing?: boolean // Detected as a closing/delay announcement
  isDelay?: boolean
  hoursAgo?: number // How many hours ago this was posted
}

/**
 * API response for digest generation
 */
export interface DigestGenerateResponse {
  digest: Digest
  success: true
}

/**
 * API response for digest history
 */
export interface DigestHistoryResponse {
  digests: Digest[]
  hasMore: boolean
}
