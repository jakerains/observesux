/**
 * Data fetching hooks using React Query
 * Mirrors the web app's SWR-based hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher, endpoints, refreshIntervals } from '../api';
import { useSettings } from '../contexts/SettingsContext';
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
  DigestResponse,
  CouncilResponse,
} from '../types';

/**
 * Hook to get the effective refresh interval with user's multiplier applied
 */
function useRefreshInterval(baseInterval: number): number {
  try {
    const { settings } = useSettings();
    return baseInterval * settings.refreshMultiplier;
  } catch {
    // If settings context is not available, use base interval
    return baseInterval;
  }
}

/**
 * Weather data hook
 */
export function useWeather() {
  const interval = useRefreshInterval(refreshIntervals.weather);
  return useQuery({
    queryKey: ['weather'],
    queryFn: () => fetcher<ApiResponse<WeatherObservation>>(endpoints.weather),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Weather forecast hook
 */
export function useWeatherForecast() {
  const interval = useRefreshInterval(refreshIntervals.weather * 5);
  return useQuery({
    queryKey: ['weather', 'forecast'],
    queryFn: () => fetcher<ApiResponse<WeatherForecastDay[]>>(endpoints.weatherForecast),
    refetchInterval: interval, // Less frequent for forecast
    staleTime: interval / 2,
  });
}

/**
 * Weather alerts hook
 */
export function useWeatherAlerts() {
  const interval = useRefreshInterval(refreshIntervals.weather);
  return useQuery({
    queryKey: ['weather', 'alerts'],
    queryFn: () => fetcher<ApiResponse<WeatherAlert[]>>(endpoints.weatherAlerts),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Transit buses hook
 */
export function useTransit() {
  const interval = useRefreshInterval(refreshIntervals.transit);
  return useQuery({
    queryKey: ['transit'],
    queryFn: () => fetcher<ApiResponse<Bus[]>>(endpoints.transit),
    refetchInterval: interval,
    staleTime: interval / 2,
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
  const interval = useRefreshInterval(refreshIntervals.cameras);
  return useQuery({
    queryKey: ['cameras'],
    queryFn: () => fetcher<ApiResponse<TrafficCamera[]>>(endpoints.cameras),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Traffic events hook
 */
export function useTrafficEvents() {
  const interval = useRefreshInterval(refreshIntervals.trafficEvents);
  return useQuery({
    queryKey: ['traffic-events'],
    queryFn: () => fetcher<ApiResponse<TrafficEvent[]>>(endpoints.trafficEvents),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * News hook
 */
export function useNews() {
  const interval = useRefreshInterval(refreshIntervals.news);
  return useQuery({
    queryKey: ['news'],
    queryFn: () => fetcher<ApiResponse<NewsItem[]>>(endpoints.news),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Air quality hook
 */
export function useAirQuality() {
  const interval = useRefreshInterval(refreshIntervals.airQuality);
  return useQuery({
    queryKey: ['air-quality'],
    queryFn: () => fetcher<ApiResponse<AirQuality>>(endpoints.airQuality),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * River levels hook
 */
export function useRivers() {
  const interval = useRefreshInterval(refreshIntervals.rivers);
  return useQuery({
    queryKey: ['rivers'],
    queryFn: () => fetcher<ApiResponse<RiverReading[]>>(endpoints.rivers),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Gas prices hook
 */
export function useGasPrices() {
  const interval = useRefreshInterval(refreshIntervals.gasPrices);
  return useQuery({
    queryKey: ['gas-prices'],
    queryFn: () => fetcher<ApiResponse<GasStation[]>>(endpoints.gasPrices),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Flights hook
 */
export function useFlights() {
  const interval = useRefreshInterval(refreshIntervals.flights);
  return useQuery({
    queryKey: ['flights'],
    queryFn: () => fetcher<ApiResponse<Flight[]>>(endpoints.flights),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Power outages hook
 */
export function useOutages() {
  const interval = useRefreshInterval(refreshIntervals.outages);
  return useQuery({
    queryKey: ['outages'],
    queryFn: () => fetcher<ApiResponse<PowerOutage[]>>(endpoints.outages),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Digest hook
 * Note: This endpoint returns { digest, available } directly (not wrapped in data/timestamp)
 */
export function useDigest() {
  const interval = useRefreshInterval(refreshIntervals.digest);
  return useQuery({
    queryKey: ['digest'],
    queryFn: () => fetcher<DigestResponse>(endpoints.digest),
    refetchInterval: interval,
    staleTime: interval / 2,
  });
}

/**
 * Council meetings hook
 * Note: Returns { meetings: [...] } directly (not wrapped in ApiResponse)
 */
export function useCouncilMeetings() {
  const interval = useRefreshInterval(refreshIntervals.council);
  return useQuery({
    queryKey: ['council'],
    queryFn: () => fetcher<CouncilResponse>(endpoints.council),
    refetchInterval: interval,
    staleTime: interval / 2,
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
