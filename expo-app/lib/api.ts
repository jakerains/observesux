/**
 * API configuration and base fetcher
 */

// Configure this to point to your web app's API
// In production, use your actual domain
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000' // Development
  : 'https://siouxland.online'; // Production

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
  rivers: '/api/rivers',
  gasPrices: '/api/gas-prices',
  flights: '/api/flights',
  outages: '/api/outages',
  status: '/api/status',
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
} as const;
