/**
 * Data fetching hooks using React Query
 * Mirrors the web app's SWR-based hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher, endpoints, refreshIntervals } from '../api';
import type {
  ApiResponse,
  WeatherObservation,
  WeatherForecastDay,
  WeatherAlert,
  Bus,
  TransitRoute,
  TrafficCamera,
  TrafficEvent,
  NewsItem,
  AirQuality,
  RiverReading,
  GasStation,
  Flight,
  PowerOutage,
} from '../types';

/**
 * Weather data hook
 */
export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: () => fetcher<ApiResponse<WeatherObservation>>(endpoints.weather),
    refetchInterval: refreshIntervals.weather,
    staleTime: refreshIntervals.weather / 2,
  });
}

/**
 * Weather forecast hook
 */
export function useWeatherForecast() {
  return useQuery({
    queryKey: ['weather', 'forecast'],
    queryFn: () => fetcher<ApiResponse<WeatherForecastDay[]>>(endpoints.weatherForecast),
    refetchInterval: refreshIntervals.weather * 5, // Less frequent for forecast
    staleTime: refreshIntervals.weather * 2,
  });
}

/**
 * Weather alerts hook
 */
export function useWeatherAlerts() {
  return useQuery({
    queryKey: ['weather', 'alerts'],
    queryFn: () => fetcher<ApiResponse<WeatherAlert[]>>(endpoints.weatherAlerts),
    refetchInterval: refreshIntervals.weather,
    staleTime: refreshIntervals.weather / 2,
  });
}

/**
 * Transit buses hook
 */
export function useTransit() {
  return useQuery({
    queryKey: ['transit'],
    queryFn: () => fetcher<ApiResponse<Bus[]>>(endpoints.transit),
    refetchInterval: refreshIntervals.transit,
    staleTime: refreshIntervals.transit / 2,
  });
}

/**
 * Transit routes hook
 */
export function useTransitRoutes() {
  return useQuery({
    queryKey: ['transit', 'routes'],
    queryFn: () => fetcher<ApiResponse<TransitRoute[]>>(endpoints.transitRoutes),
    staleTime: 5 * 60 * 1000, // Routes don't change often
  });
}

/**
 * Traffic cameras hook
 */
export function useCameras() {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: () => fetcher<ApiResponse<TrafficCamera[]>>(endpoints.cameras),
    refetchInterval: refreshIntervals.cameras,
    staleTime: refreshIntervals.cameras / 2,
  });
}

/**
 * Traffic events hook
 */
export function useTrafficEvents() {
  return useQuery({
    queryKey: ['traffic-events'],
    queryFn: () => fetcher<ApiResponse<TrafficEvent[]>>(endpoints.trafficEvents),
    refetchInterval: refreshIntervals.trafficEvents,
    staleTime: refreshIntervals.trafficEvents / 2,
  });
}

/**
 * News hook
 */
export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: () => fetcher<ApiResponse<NewsItem[]>>(endpoints.news),
    refetchInterval: refreshIntervals.news,
    staleTime: refreshIntervals.news / 2,
  });
}

/**
 * Air quality hook
 */
export function useAirQuality() {
  return useQuery({
    queryKey: ['air-quality'],
    queryFn: () => fetcher<ApiResponse<AirQuality>>(endpoints.airQuality),
    refetchInterval: refreshIntervals.airQuality,
    staleTime: refreshIntervals.airQuality / 2,
  });
}

/**
 * River levels hook
 */
export function useRivers() {
  return useQuery({
    queryKey: ['rivers'],
    queryFn: () => fetcher<ApiResponse<RiverReading[]>>(endpoints.rivers),
    refetchInterval: refreshIntervals.rivers,
    staleTime: refreshIntervals.rivers / 2,
  });
}

/**
 * Gas prices hook
 */
export function useGasPrices() {
  return useQuery({
    queryKey: ['gas-prices'],
    queryFn: () => fetcher<ApiResponse<GasStation[]>>(endpoints.gasPrices),
    refetchInterval: refreshIntervals.gasPrices,
    staleTime: refreshIntervals.gasPrices / 2,
  });
}

/**
 * Flights hook
 */
export function useFlights() {
  return useQuery({
    queryKey: ['flights'],
    queryFn: () => fetcher<ApiResponse<Flight[]>>(endpoints.flights),
    refetchInterval: refreshIntervals.flights,
    staleTime: refreshIntervals.flights / 2,
  });
}

/**
 * Power outages hook
 */
export function useOutages() {
  return useQuery({
    queryKey: ['outages'],
    queryFn: () => fetcher<ApiResponse<PowerOutage[]>>(endpoints.outages),
    refetchInterval: refreshIntervals.outages,
    staleTime: refreshIntervals.outages / 2,
  });
}

/**
 * Hook to manually refresh all data
 */
export function useRefreshAll() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries();
  };
}

/**
 * Calculate data freshness status
 */
export function getDataStatus(
  timestamp: string | undefined,
  refreshInterval: number,
  isLoading: boolean,
  isError: boolean
): 'live' | 'stale' | 'error' | 'loading' {
  if (isLoading) return 'loading';
  if (isError) return 'error';
  if (!timestamp) return 'stale';

  const lastUpdated = new Date(timestamp);
  const now = new Date();
  const age = now.getTime() - lastUpdated.getTime();

  // Show stale if data is older than 3x the refresh interval
  return age > refreshInterval * 3 ? 'stale' : 'live';
}
