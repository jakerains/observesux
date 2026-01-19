import { tool } from 'ai';
import { z } from 'zod';

// Get the base URL for API calls (works on server side)
function getBaseUrl(): string {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const isLocalhost =
      vercelUrl.startsWith('localhost') ||
      vercelUrl.startsWith('127.0.0.1') ||
      vercelUrl.startsWith('0.0.0.0') ||
      vercelUrl.startsWith('[::1]');
    return `${isLocalhost ? 'http' : 'https'}://${vercelUrl}`;
  }

  return 'http://localhost:3000';
}

// Helper to fetch from internal API routes
async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    console.log(`[AI Tools] Fetching: ${url}`);
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error(`API error for ${endpoint}:`, response.status);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

export const chatTools = {
  getCitySummary: tool({
    description: 'Get a comprehensive summary of current conditions in Sioux City including weather, river levels, air quality, traffic incidents, and any anomalies or alerts. Use this for general "what\'s happening" questions.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/city-summary');
      if (!data) {
        return { error: 'Unable to fetch city summary at this time' };
      }
      return data;
    },
  }),

  getCurrentWeather: tool({
    description: 'Get current weather conditions in Sioux City including temperature, humidity, wind, visibility, and conditions.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/weather');
      if (!data) {
        return { error: 'Unable to fetch weather data at this time' };
      }
      return data;
    },
  }),

  getWeatherAlerts: tool({
    description: 'Get active weather alerts and warnings for the Sioux City area from the National Weather Service.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/weather/alerts');
      if (!data) {
        return { error: 'Unable to fetch weather alerts at this time' };
      }
      return data;
    },
  }),

  getWeatherForecast: tool({
    description: 'Get the weather forecast for Sioux City for the next several days.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/weather/forecast');
      if (!data) {
        return { error: 'Unable to fetch weather forecast at this time' };
      }
      return data;
    },
  }),

  getRiverLevels: tool({
    description: 'Get current river gauge readings and flood stages for the Missouri River, Big Sioux River, and Floyd River near Sioux City.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/rivers');
      if (!data) {
        return { error: 'Unable to fetch river data at this time' };
      }
      return data;
    },
  }),

  getAirQuality: tool({
    description: 'Get current air quality index (AQI) and pollutant levels for Sioux City.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/air-quality');
      if (!data) {
        return { error: 'Unable to fetch air quality data at this time' };
      }
      return data;
    },
  }),

  getTrafficEvents: tool({
    description: 'Get active traffic incidents, road closures, and construction on major roads including I-29, I-129, US-20, and US-75 in the Sioux City area.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/traffic-events');
      if (!data) {
        return { error: 'Unable to fetch traffic data at this time' };
      }
      return data;
    },
  }),

  getNews: tool({
    description: 'Get local news headlines from Sioux City area news sources.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/news');
      if (!data) {
        return { error: 'Unable to fetch news at this time' };
      }
      return data;
    },
  }),

  getGasPrices: tool({
    description: 'Get current gas prices at stations in the Sioux City area.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/gas-prices');
      if (!data) {
        return { error: 'Unable to fetch gas prices at this time' };
      }
      return data;
    },
  }),

  getFlights: tool({
    description: 'Get arrival and departure information for Sioux Gateway Airport (SUX).',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/flights');
      if (!data) {
        return { error: 'Unable to fetch flight data at this time' };
      }
      return data;
    },
  }),

  getAviationWeather: tool({
    description: 'Get aviation weather data (METAR observations and TAF forecasts) for Sioux Gateway Airport.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/aviation');
      if (!data) {
        return { error: 'Unable to fetch aviation weather at this time' };
      }
      return data;
    },
  }),

  getTransit: tool({
    description: 'Get real-time Sioux City Transit bus positions and route information.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/transit');
      if (!data) {
        return { error: 'Unable to fetch transit data at this time' };
      }
      return data;
    },
  }),

  getOutages: tool({
    description: 'Get current power outage information for the Sioux City area from MidAmerican Energy.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/outages');
      if (!data) {
        return { error: 'Unable to fetch outage data at this time' };
      }
      return data;
    },
  }),

  getEarthquakes: tool({
    description: 'Get recent earthquake activity in the region from USGS.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/earthquakes');
      if (!data) {
        return { error: 'Unable to fetch earthquake data at this time' };
      }
      return data;
    },
  }),

  getSystemStatus: tool({
    description: 'Get the health status of all data sources and services powering the dashboard.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/status');
      if (!data) {
        return { error: 'Unable to fetch system status at this time' };
      }
      return data;
    },
  }),
};
