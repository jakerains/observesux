import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface WeatherHistoryPoint {
  time: string
  temperature: number
  humidity: number
  windSpeed: number
}

export interface RiverHistoryPoint {
  time: string
  gaugeHeight: number
  siteId: string
}

export interface AirQualityHistoryPoint {
  time: string
  aqi: number
}

export interface HistoryResponse {
  configured: boolean
  hours?: number
  weather?: WeatherHistoryPoint[]
  rivers?: {
    bigSioux: RiverHistoryPoint[]
    missouri: RiverHistoryPoint[]
  }
  airQuality?: AirQualityHistoryPoint[]
  message?: string
}

export function useWeatherHistory(hours: number = 24) {
  return useSWR<HistoryResponse>(
    `/api/history?type=weather&hours=${hours}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  )
}

export function useRiverHistory(hours: number = 24) {
  return useSWR<HistoryResponse>(
    `/api/history?type=rivers&hours=${hours}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    }
  )
}

export function useAirQualityHistory(hours: number = 24) {
  return useSWR<HistoryResponse>(
    `/api/history?type=air&hours=${hours}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    }
  )
}

export function useAllHistory(hours: number = 24) {
  return useSWR<HistoryResponse>(
    `/api/history?type=all&hours=${hours}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    }
  )
}
