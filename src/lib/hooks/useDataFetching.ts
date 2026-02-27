'use client'

import useSWR from 'swr'
import type {
  TrafficCamera,
  TrafficEvent,
  WeatherObservation,
  WeatherAlert,
  WeatherForecast,
  HourlyWeatherForecast,
  AviationWeather,
  RiverGaugeReading,
  AirQualityReading,
  TransitData,
  OutageSummary,
  Flight,
  Earthquake,
  Snowplow,
  Aircraft,
  ApiResponse,
  GasPriceData,
  CommunityEventsData,
} from '@/types'

// Generic fetcher with error handling
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  return res.json()
}

// ============================================
// Traffic Cameras
// ============================================
export function useCameras(refreshInterval = 120000) {
  return useSWR<ApiResponse<TrafficCamera[]>>(
    '/api/cameras',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Traffic Events (511)
// ============================================
export function useTrafficEvents(refreshInterval = 300000) {
  return useSWR<ApiResponse<TrafficEvent[]>>(
    '/api/traffic-events',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Weather
// ============================================
export function useWeather(refreshInterval = 60000) {
  return useSWR<ApiResponse<WeatherObservation> & { airportTemp?: number | null }>(
    '/api/weather',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )
}

export function useWeatherAlerts(refreshInterval = 60000) {
  return useSWR<ApiResponse<WeatherAlert[]>>(
    '/api/weather/alerts',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )
}

export function useWeatherForecast(refreshInterval = 300000) {
  return useSWR<ApiResponse<{ forecast: WeatherForecast; hourly: HourlyWeatherForecast }>>(
    '/api/weather/forecast',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Aviation Weather (METAR/TAF)
// ============================================
export function useAviationWeather(refreshInterval = 120000) {
  return useSWR<ApiResponse<AviationWeather>>(
    '/api/aviation',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Rivers
// ============================================
export function useRivers(refreshInterval = 300000) {
  return useSWR<ApiResponse<RiverGaugeReading[]>>(
    '/api/rivers',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Air Quality
// ============================================
export function useAirQuality(refreshInterval = 600000) {
  return useSWR<ApiResponse<AirQualityReading>>(
    '/api/air-quality',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 120000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Transit
// ============================================
export function useTransit(refreshInterval = 30000) {
  return useSWR<TransitData>(
    '/api/transit',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 15000,
      revalidateOnFocus: false,
    }
  )
}

// GTFS Static Data (routes, shapes, stops)
export interface GtfsApiResponse {
  stops?: Record<string, {
    stopId: string
    stopName: string
    latitude: number
    longitude: number
    wheelchairBoarding?: boolean
  }>
  routes?: Array<{
    id: string
    shortName: string
    longName: string
    color: string
    textColor: string
  }>
  shapes?: Array<{
    routeId: string
    shapeId: string
    coordinates: [number, number][]
    color: string
  }>
  routeStops?: Record<string, string[]>
  timestamp: string
}

export function useGtfsData(refreshInterval = 3600000) { // 1 hour
  return useSWR<GtfsApiResponse>(
    '/api/transit/gtfs',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  )
}

// Route shapes for a specific route
export interface RouteShapeResponse {
  shapes: Array<{
    routeId: string
    shapeId: string
    coordinates: [number, number][]
    color: string
  }>
  routeId: string
  timestamp: string
}

export function useRouteShape(routeId: string | null) {
  return useSWR<RouteShapeResponse>(
    routeId ? `/api/transit/gtfs?type=shapes&routeId=${routeId}` : null,
    fetcher,
    {
      refreshInterval: 3600000, // 1 hour
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// Stops for a specific route
export interface RouteStopsResponse {
  stops: Array<{
    stopId: string
    stopName: string
    latitude: number
    longitude: number
    wheelchairBoarding?: boolean
  }>
  routeId: string
  timestamp: string
}

export function useRouteStops(routeId: string | null) {
  return useSWR<RouteStopsResponse>(
    routeId ? `/api/transit/gtfs?type=stops&routeId=${routeId}` : null,
    fetcher,
    {
      refreshInterval: 3600000, // 1 hour
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Power Outages
// ============================================
export function useOutages(refreshInterval = 300000) {
  return useSWR<ApiResponse<OutageSummary[]>>(
    '/api/outages',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Flights
// ============================================
export function useFlights(refreshInterval = 300000) {
  return useSWR<ApiResponse<{ arrivals: Flight[]; departures: Flight[] }>>(
    '/api/flights',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Earthquakes
// ============================================
export function useEarthquakes(refreshInterval = 600000) {
  return useSWR<ApiResponse<Earthquake[]>>(
    '/api/earthquakes',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 120000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Snowplows (Winter)
// ============================================
export function useSnowplows(refreshInterval = 60000) {
  return useSWR<ApiResponse<Snowplow[]>>(
    '/api/snowplows',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Aircraft (OpenSky Network)
// ============================================
interface AircraftApiResponse {
  data: Aircraft[]
  timestamp: string
  source: string
  suxArrivals: number
  suxDepartures: number
  nearSux: number
  total: number
}

export function useAircraft(refreshInterval = 60000) {
  return useSWR<AircraftApiResponse>(
    '/api/aircraft',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Gas Prices
// ============================================
export function useGasPrices(refreshInterval = 3600000) {
  // Default: refresh every hour (data is updated daily)
  return useSWR<ApiResponse<GasPriceData>>(
    '/api/gas-prices',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Community Events
// ============================================
export function useEvents(refreshInterval = 1800000) {
  return useSWR<ApiResponse<CommunityEventsData>>(
    '/api/events',
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  )
}

// ============================================
// Dashboard Status
// ============================================
export function useDashboardStatus() {
  return useSWR<{
    cameras: boolean
    weather: boolean
    rivers: boolean
    airQuality: boolean
    transit: boolean
    outages: boolean
    flights: boolean
    earthquakes: boolean
    gasPrices: boolean
  }>(
    '/api/status',
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 15000,
      revalidateOnFocus: true,
    }
  )
}
