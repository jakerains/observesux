/**
 * API configuration and base fetcher
 */

// Configure this to point to your web app's API (override via EXPO_PUBLIC_API_URL)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://siouxland.online';

/**
 * Base fetcher with error handling
 */
export async function fetcher<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Authenticated fetcher with Bearer token
 */
export async function authenticatedFetcher<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Authenticated mutator with Bearer token (for POST/PUT/PATCH/DELETE)
 */
export async function authenticatedMutator<T>(
  endpoint: string,
  token: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * User-related API endpoints
 */
export const userEndpoints = {
  profile: '/api/user/profile',
  preferences: '/api/user/preferences',
  alertSubscriptions: '/api/user/alerts',
  watchlist: '/api/user/watchlist',
  mobilePush: '/api/user/mobile-push',
} as const;

/**
 * API endpoints
 */
export const endpoints = {
  weather: '/api/weather',
  weatherForecast: '/api/weather/forecast',
  weatherAlerts: '/api/weather/alerts',
  transit: '/api/transit',
  transitRoutes: '/api/transit/routes',
  cameras: '/api/cameras',
  trafficEvents: '/api/traffic-events',
  news: '/api/news',
  airQuality: '/api/air-quality',
  airQualityHistory: '/api/history?type=air&hours=24',
  rivers: '/api/rivers',
  gasPrices: '/api/gas-prices',
  flights: '/api/flights',
  outages: '/api/outages',
  status: '/api/status',
  digest: '/api/user/digest',
  council: '/api/council-meetings/recaps?all=true',
} as const;

/**
 * Refresh intervals (in milliseconds)
 */
export const refreshIntervals = {
  weather: 60 * 1000, // 1 minute
  transit: 30 * 1000, // 30 seconds
  cameras: 2 * 60 * 1000, // 2 minutes
  trafficEvents: 5 * 60 * 1000, // 5 minutes
  news: 60 * 1000, // 1 minute
  airQuality: 60 * 1000, // 1 minute
  rivers: 30 * 60 * 1000, // 30 minutes
  gasPrices: 60 * 1000, // 1 minute
  flights: 5 * 60 * 1000, // 5 minutes
  outages: 5 * 60 * 1000, // 5 minutes
  digest: 60 * 1000, // 1 minute
  council: 30 * 60 * 1000, // 30 minutes — meetings happen every 2 weeks
} as const;
