import type { ComponentType } from 'react'
import type { ToolCardProps } from './types'

// Core cards
import { WeatherCard } from './WeatherCard'
import { RiverLevelsCard } from './RiverLevelsCard'
import { TrafficEventsCard } from './TrafficEventsCard'
import { AirQualityCard } from './AirQualityCard'

// Alerts & Forecast cards
import { WeatherAlertsCard } from './WeatherAlertsCard'
import { WeatherForecastCard } from './WeatherForecastCard'
import { CitySummaryCard } from './CitySummaryCard'

// Utility cards
import { GasPricesCard } from './GasPricesCard'

// Export types
export type { ToolCardProps, ToolCardComponent, StatusLevel } from './types'
export { getStatusLevel } from './types'

// Export individual cards for direct usage
export { WeatherCard } from './WeatherCard'
export { RiverLevelsCard } from './RiverLevelsCard'
export { TrafficEventsCard } from './TrafficEventsCard'
export { AirQualityCard } from './AirQualityCard'
export { WeatherAlertsCard } from './WeatherAlertsCard'
export { WeatherForecastCard } from './WeatherForecastCard'
export { CitySummaryCard } from './CitySummaryCard'
export { GasPricesCard } from './GasPricesCard'
export { ToolCardWrapper } from './ToolCardWrapper'

/**
 * Registry mapping tool names to their card components.
 * Tool names must match those defined in src/lib/ai/tools.ts
 */
export const TOOL_CARD_REGISTRY: Record<string, ComponentType<ToolCardProps<unknown>>> = {
  // Core
  getCurrentWeather: WeatherCard as ComponentType<ToolCardProps<unknown>>,
  getRiverLevels: RiverLevelsCard as ComponentType<ToolCardProps<unknown>>,
  getTrafficEvents: TrafficEventsCard as ComponentType<ToolCardProps<unknown>>,
  getAirQuality: AirQualityCard as ComponentType<ToolCardProps<unknown>>,

  // Alerts & Forecast
  getWeatherAlerts: WeatherAlertsCard as ComponentType<ToolCardProps<unknown>>,
  getWeatherForecast: WeatherForecastCard as ComponentType<ToolCardProps<unknown>>,
  getCitySummary: CitySummaryCard as ComponentType<ToolCardProps<unknown>>,

  // Utility
  getGasPrices: GasPricesCard as ComponentType<ToolCardProps<unknown>>,

  // Future cards (TODO)
  // getNews: NewsCard,
  // getTransit: TransitCard,
  // getFlights: FlightsCard,
  // getOutages: OutagesCard,
  // getEarthquakes: EarthquakesCard,
  // getSystemStatus: SystemStatusCard,
  // getAviationWeather: AviationWeatherCard,
}

/**
 * Get the tool card component for a given tool name.
 * Returns undefined if no card is registered for the tool.
 */
export function getToolCardComponent(
  toolName: string
): ComponentType<ToolCardProps<unknown>> | undefined {
  return TOOL_CARD_REGISTRY[toolName]
}

/**
 * Check if a tool has a registered card component.
 */
export function hasToolCard(toolName: string): boolean {
  return toolName in TOOL_CARD_REGISTRY
}
