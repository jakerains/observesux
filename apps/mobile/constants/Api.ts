/**
 * API configuration constants
 */

// Base URL for the ObserveSUX API
// Using production URL for both dev and prod since the simulator can't access localhost
// To use local dev server, replace with your Mac's IP: http://192.168.x.x:3000
export const API_BASE_URL = 'https://observesux.vercel.app';

// Refresh intervals for different data types (in milliseconds)
export const REFRESH_INTERVALS = {
  weather: 60000,        // 1 minute
  weatherAlerts: 60000,  // 1 minute
  weatherForecast: 300000, // 5 minutes
  rivers: 300000,        // 5 minutes
  airQuality: 600000,    // 10 minutes
  transit: 30000,        // 30 seconds
  cameras: 120000,       // 2 minutes
  trafficEvents: 300000, // 5 minutes
  flights: 300000,       // 5 minutes
  aviation: 120000,      // 2 minutes
  earthquakes: 600000,   // 10 minutes
  outages: 300000,       // 5 minutes
  gasPrices: 3600000,    // 1 hour
  aircraft: 60000,       // 1 minute
  snowplows: 60000,      // 1 minute
  status: 30000,         // 30 seconds
};

// Stale time multiplier (data is considered stale after this many intervals)
export const STALE_MULTIPLIER = 3;

// API endpoints
export const API_ENDPOINTS = {
  weather: '/api/weather',
  weatherAlerts: '/api/weather/alerts',
  weatherForecast: '/api/weather/forecast',
  rivers: '/api/rivers',
  airQuality: '/api/air-quality',
  transit: '/api/transit',
  cameras: '/api/cameras',
  trafficEvents: '/api/traffic-events',
  flights: '/api/flights',
  aviation: '/api/aviation',
  earthquakes: '/api/earthquakes',
  outages: '/api/outages',
  gasPrices: '/api/gas-prices',
  aircraft: '/api/aircraft',
  snowplows: '/api/snowplows',
  status: '/api/status',
  // Auth endpoints
  signIn: '/api/auth/sign-in',
  signUp: '/api/auth/sign-up',
  signOut: '/api/auth/sign-out',
  session: '/api/auth/session',
  // User endpoints
  pushSubscription: '/api/user/push-subscription',
  alertSubscriptions: '/api/user/alerts',
  watchlist: '/api/user/watchlist',
  preferences: '/api/user/preferences',
};
