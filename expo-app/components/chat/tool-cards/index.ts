import type { ComponentType } from 'react'
import { AirQualityCard } from './AirQualityCard'
import { CitySummaryCard } from './CitySummaryCard'
import { GasPricesCard } from './GasPricesCard'
import { NewsCard } from './NewsCard'
import { RiverLevelsCard } from './RiverLevelsCard'
import { TrafficEventsCard } from './TrafficEventsCard'
import { WeatherAlertsCard } from './WeatherAlertsCard'
import { WeatherCard } from './WeatherCard'
import { WeatherForecastCard } from './WeatherForecastCard'

export type ToolCardComponent = ComponentType<{ output: unknown }>

const toolCardMap: Record<string, ToolCardComponent> = {
  getCitySummary: CitySummaryCard,
  getCurrentWeather: WeatherCard,
  getWeatherAlerts: WeatherAlertsCard,
  getWeatherForecast: WeatherForecastCard,
  getRiverLevels: RiverLevelsCard,
  getAirQuality: AirQualityCard,
  getTrafficEvents: TrafficEventsCard,
  getNews: NewsCard,
  getGasPrices: GasPricesCard,
}

export function getToolCardComponent(toolName: string): ToolCardComponent | null {
  return toolCardMap[toolName] || null
}
