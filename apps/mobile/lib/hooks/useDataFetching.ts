import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import { API_ENDPOINTS, REFRESH_INTERVALS } from '@/constants';
import type {
  ApiResponse,
  WeatherObservation,
  WeatherAlert,
  WeatherForecast,
  HourlyWeatherForecast,
  AviationWeather,
  RiverGaugeReading,
  AirQualityReading,
  TransitData,
  TrafficCamera,
  TrafficEvent,
  OutageSummary,
  Flight,
  Earthquake,
  GasPriceData,
  Snowplow,
  Aircraft,
} from '@observesux/shared/types';

// ============================================
// Weather
// ============================================

export function useWeather(options?: Partial<UseQueryOptions<ApiResponse<WeatherObservation>>>) {
  return useQuery({
    queryKey: ['weather'],
    queryFn: () => fetcher<ApiResponse<WeatherObservation>>(API_ENDPOINTS.weather),
    refetchInterval: REFRESH_INTERVALS.weather,
    ...options,
  });
}

export function useWeatherAlerts(options?: Partial<UseQueryOptions<ApiResponse<WeatherAlert[]>>>) {
  return useQuery({
    queryKey: ['weatherAlerts'],
    queryFn: () => fetcher<ApiResponse<WeatherAlert[]>>(API_ENDPOINTS.weatherAlerts),
    refetchInterval: REFRESH_INTERVALS.weatherAlerts,
    ...options,
  });
}

export function useWeatherForecast(
  options?: Partial<
    UseQueryOptions<ApiResponse<{ forecast: WeatherForecast; hourly: HourlyWeatherForecast }>>
  >
) {
  return useQuery({
    queryKey: ['weatherForecast'],
    queryFn: () =>
      fetcher<ApiResponse<{ forecast: WeatherForecast; hourly: HourlyWeatherForecast }>>(
        API_ENDPOINTS.weatherForecast
      ),
    refetchInterval: REFRESH_INTERVALS.weatherForecast,
    ...options,
  });
}

// ============================================
// Aviation Weather
// ============================================

export function useAviationWeather(options?: Partial<UseQueryOptions<ApiResponse<AviationWeather>>>) {
  return useQuery({
    queryKey: ['aviationWeather'],
    queryFn: () => fetcher<ApiResponse<AviationWeather>>(API_ENDPOINTS.aviation),
    refetchInterval: REFRESH_INTERVALS.aviation,
    ...options,
  });
}

// ============================================
// Rivers
// ============================================

export function useRivers(options?: Partial<UseQueryOptions<ApiResponse<RiverGaugeReading[]>>>) {
  return useQuery({
    queryKey: ['rivers'],
    queryFn: () => fetcher<ApiResponse<RiverGaugeReading[]>>(API_ENDPOINTS.rivers),
    refetchInterval: REFRESH_INTERVALS.rivers,
    ...options,
  });
}

// ============================================
// Air Quality
// ============================================

export function useAirQuality(options?: Partial<UseQueryOptions<ApiResponse<AirQualityReading>>>) {
  return useQuery({
    queryKey: ['airQuality'],
    queryFn: () => fetcher<ApiResponse<AirQualityReading>>(API_ENDPOINTS.airQuality),
    refetchInterval: REFRESH_INTERVALS.airQuality,
    ...options,
  });
}

// ============================================
// Transit
// ============================================

export function useTransit(options?: Partial<UseQueryOptions<TransitData>>) {
  return useQuery({
    queryKey: ['transit'],
    queryFn: () => fetcher<TransitData>(API_ENDPOINTS.transit),
    refetchInterval: REFRESH_INTERVALS.transit,
    ...options,
  });
}

// ============================================
// Cameras
// ============================================

export function useCameras(options?: Partial<UseQueryOptions<ApiResponse<TrafficCamera[]>>>) {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: () => fetcher<ApiResponse<TrafficCamera[]>>(API_ENDPOINTS.cameras),
    refetchInterval: REFRESH_INTERVALS.cameras,
    ...options,
  });
}

// ============================================
// Traffic Events
// ============================================

export function useTrafficEvents(options?: Partial<UseQueryOptions<ApiResponse<TrafficEvent[]>>>) {
  return useQuery({
    queryKey: ['trafficEvents'],
    queryFn: () => fetcher<ApiResponse<TrafficEvent[]>>(API_ENDPOINTS.trafficEvents),
    refetchInterval: REFRESH_INTERVALS.trafficEvents,
    ...options,
  });
}

// ============================================
// Outages
// ============================================

export function useOutages(options?: Partial<UseQueryOptions<ApiResponse<OutageSummary[]>>>) {
  return useQuery({
    queryKey: ['outages'],
    queryFn: () => fetcher<ApiResponse<OutageSummary[]>>(API_ENDPOINTS.outages),
    refetchInterval: REFRESH_INTERVALS.outages,
    ...options,
  });
}

// ============================================
// Flights
// ============================================

export function useFlights(
  options?: Partial<UseQueryOptions<ApiResponse<{ arrivals: Flight[]; departures: Flight[] }>>>
) {
  return useQuery({
    queryKey: ['flights'],
    queryFn: () =>
      fetcher<ApiResponse<{ arrivals: Flight[]; departures: Flight[] }>>(API_ENDPOINTS.flights),
    refetchInterval: REFRESH_INTERVALS.flights,
    ...options,
  });
}

// ============================================
// Earthquakes
// ============================================

export function useEarthquakes(options?: Partial<UseQueryOptions<ApiResponse<Earthquake[]>>>) {
  return useQuery({
    queryKey: ['earthquakes'],
    queryFn: () => fetcher<ApiResponse<Earthquake[]>>(API_ENDPOINTS.earthquakes),
    refetchInterval: REFRESH_INTERVALS.earthquakes,
    ...options,
  });
}

// ============================================
// Gas Prices
// ============================================

export function useGasPrices(options?: Partial<UseQueryOptions<ApiResponse<GasPriceData>>>) {
  return useQuery({
    queryKey: ['gasPrices'],
    queryFn: () => fetcher<ApiResponse<GasPriceData>>(API_ENDPOINTS.gasPrices),
    refetchInterval: REFRESH_INTERVALS.gasPrices,
    ...options,
  });
}

// ============================================
// Snowplows
// ============================================

export function useSnowplows(options?: Partial<UseQueryOptions<ApiResponse<Snowplow[]>>>) {
  return useQuery({
    queryKey: ['snowplows'],
    queryFn: () => fetcher<ApiResponse<Snowplow[]>>(API_ENDPOINTS.snowplows),
    refetchInterval: REFRESH_INTERVALS.snowplows,
    ...options,
  });
}

// ============================================
// Aircraft
// ============================================

interface AircraftApiResponse {
  data: Aircraft[];
  timestamp: string;
  source: string;
  suxArrivals: number;
  suxDepartures: number;
  nearSux: number;
  total: number;
}

export function useAircraft(options?: Partial<UseQueryOptions<AircraftApiResponse>>) {
  return useQuery({
    queryKey: ['aircraft'],
    queryFn: () => fetcher<AircraftApiResponse>(API_ENDPOINTS.aircraft),
    refetchInterval: REFRESH_INTERVALS.aircraft,
    ...options,
  });
}

// ============================================
// Dashboard Status
// ============================================

interface DashboardStatus {
  cameras: boolean;
  weather: boolean;
  rivers: boolean;
  airQuality: boolean;
  transit: boolean;
  outages: boolean;
  flights: boolean;
  earthquakes: boolean;
  gasPrices: boolean;
}

export function useDashboardStatus(options?: Partial<UseQueryOptions<DashboardStatus>>) {
  return useQuery({
    queryKey: ['dashboardStatus'],
    queryFn: () => fetcher<DashboardStatus>(API_ENDPOINTS.status),
    refetchInterval: REFRESH_INTERVALS.status,
    ...options,
  });
}
