/**
 * Canonical tool name display mapping.
 * Single source of truth — import this instead of duplicating the map.
 */
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  getCitySummary: 'city conditions',
  getCurrentWeather: 'weather',
  getWeatherAlerts: 'weather alerts',
  getWeatherForecast: 'forecast',
  getRiverLevels: 'river levels',
  getAirQuality: 'air quality',
  getTrafficEvents: 'traffic',
  getNews: 'news',
  getGasPrices: 'gas prices',
  getFlights: 'flights',
  getAviationWeather: 'aviation weather',
  getTransit: 'transit',
  getOutages: 'power outages',
  getEarthquakes: 'earthquakes',
  getSystemStatus: 'system status',
  searchKnowledgeBase: 'local info',
  getCouncilRecaps: 'council recaps',
  getEvents: 'events',
  searchLocalEats: 'restaurants',
  getRestaurantDetails: 'restaurant details',
  findDelivery: 'delivery options',
  searchCouncilMeetings: 'council meetings',
  searchLocalNews: 'local news',
  webSearch: 'realtime info',
  writeToCanvas: 'canvas',
}

/**
 * Get a human-friendly display name for a tool.
 * Falls back to converting camelCase to spaced lowercase.
 */
export function formatToolName(toolName: string): string {
  return (
    TOOL_DISPLAY_NAMES[toolName] ||
    toolName.replace(/^get/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()
  )
}
