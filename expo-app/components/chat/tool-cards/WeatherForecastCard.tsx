import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData } from './utils'

interface ForecastPeriod {
  name: string
  temperature: number
  temperatureUnit: string
  shortForecast: string
}

interface ForecastResponse {
  forecast?: { periods: ForecastPeriod[] }
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

export function WeatherForecastCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<ForecastResponse> | ForecastResponse>(output)
  const forecast = (data as ApiResponse<ForecastResponse>)?.data ?? (data as ForecastResponse | null)
  const periods = forecast?.forecast?.periods || []

  if (error) {
    return <ToolCardBase title="Forecast" icon="calendar" status="alert" error={error} />
  }

  if (!periods || periods.length === 0) {
    return <ToolCardBase title="Forecast" icon="calendar" status="attention" error="No forecast data available." />
  }

  return (
    <ToolCardBase title="Forecast" icon="calendar" status="normal">
      <View style={{ gap: 8 }}>
        {periods.slice(0, 3).map((period) => (
          <View key={period.name} style={{ gap: 2 }}>
            <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
              {period.name} · {Math.round(period.temperature)}°{period.temperatureUnit}
            </Text>
            <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
              {period.shortForecast}
            </Text>
          </View>
        ))}
      </View>
    </ToolCardBase>
  )
}
