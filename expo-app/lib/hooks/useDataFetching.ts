/**
 * Data fetching hooks using React Query
 * Mirrors the web app's SWR-based hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher, authenticatedFetcher, authenticatedMutator, endpoints, refreshIntervals, userEndpoints } from '../api';
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
  AlertSubscriptionsResponse,
  PreferencesResponse,
  WatchlistResponse,
  WatchlistItemType,
  AirQualityHistoryResponse,
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
 * Air quality 24h history hook
 */
export function useAirQualityHistory() {
  return useQuery({
    queryKey: ['air-quality', 'history'],
    queryFn: () => fetcher<AirQualityHistoryResponse>(endpoints.airQualityHistory),
    staleTime: 5 * 60 * 1000,  // history data changes slowly
    refetchInterval: 5 * 60 * 1000,
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

/**
 * Alert subscriptions hook (requires auth)
 */
export function useAlertSubscriptions(token: string | null) {
  return useQuery({
    queryKey: ['user', 'alerts'],
    queryFn: () => authenticatedFetcher<AlertSubscriptionsResponse>(userEndpoints.alertSubscriptions, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * User preferences hook (requires auth)
 */
export function useUserPreferences(token: string | null) {
  return useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: () => authenticatedFetcher<PreferencesResponse>(userEndpoints.preferences, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Watchlist hook (requires auth)
 */
export function useWatchlist(token: string | null, type?: WatchlistItemType) {
  const endpoint = type
    ? `${userEndpoints.watchlist}?type=${type}`
    : userEndpoints.watchlist;
  return useQuery({
    queryKey: ['user', 'watchlist', type],
    queryFn: () => authenticatedFetcher<WatchlistResponse>(endpoint, token!),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Upsert alert subscription mutation
 */
export function useUpsertAlertSubscription(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { alertType: string; config: Record<string, unknown>; enabled?: boolean }) =>
      authenticatedMutator(userEndpoints.alertSubscriptions, token!, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'alerts'] });
    },
  });
}

/**
 * Toggle alert subscription mutation
 */
export function useToggleAlertSubscription(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { alertType: string; enabled: boolean }) =>
      authenticatedMutator(userEndpoints.alertSubscriptions, token!, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'alerts'] });
    },
  });
}

/**
 * Update user preferences mutation
 */
export function useUpdatePreferences(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { theme?: string; widgetSettings?: Record<string, unknown> }) =>
      authenticatedMutator(userEndpoints.preferences, token!, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });
}

/**
 * Add watchlist item mutation
 */
export function useAddWatchlistItem(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { itemType: string; itemId: string; itemName: string; itemMetadata?: Record<string, unknown> }) =>
      authenticatedMutator(userEndpoints.watchlist, token!, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'watchlist'] });
    },
  });
}

/**
 * Remove watchlist item mutation
 */
export function useRemoveWatchlistItem(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { itemType: string; itemId: string }) =>
      authenticatedMutator(userEndpoints.watchlist, token!, 'DELETE', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'watchlist'] });
    },
  });
}
