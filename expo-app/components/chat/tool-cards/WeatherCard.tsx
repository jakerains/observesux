import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData, formatMaybeNumber } from './utils'

interface WeatherObservation {
  temperature: number | null
  temperatureUnit?: string
  conditions: string
  windSpeed: number | null
  windDirection: string | null
  humidity: number | null
  visibility: number | null
  heatIndex?: number | null
  windChill?: number | null
  windGust?: number | null
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

export function WeatherCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<WeatherObservation> | WeatherObservation>(output)

  const weather = (data as ApiResponse<WeatherObservation>)?.data ?? (data as WeatherObservation | null)

  if (error) {
    return <ToolCardBase title="Weather" icon="cloud.sun.fill" status="alert" error={error} />
  }

  if (!weather) {
    return <ToolCardBase title="Weather" icon="cloud.sun.fill" status="attention" error="No weather data available." />
  }

  const feelsLike = weather.windChill ?? weather.heatIndex ?? weather.temperature
  const unit = weather.temperatureUnit || 'F'
  const hasWindGustWarning = typeof weather.windGust === 'number' && weather.windGust > 25

  return (
    <ToolCardBase title="Weather" icon="cloud.sun.fill" status={hasWindGustWarning ? 'attention' : 'normal'}>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: '600', color: PlatformColor('label') }}>
          {formatMaybeNumber(weather.temperature, '°')}
          {unit} · {weather.conditions || 'Unknown'}
        </Text>
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          Feels like {formatMaybeNumber(feelsLike, '°')}
          {unit}
        </Text>
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          Wind {formatMaybeNumber(weather.windSpeed, ' mph')}
          {weather.windDirection ? ` ${weather.windDirection}` : ''} · Humidity {formatMaybeNumber(weather.humidity, '%')}
        </Text>
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          Visibility {formatMaybeNumber(weather.visibility, ' mi')}
        </Text>
      </View>
      {hasWindGustWarning ? (
        <View
          style={{
            marginTop: 6,
            padding: 8,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
          }}
        >
          <Text selectable style={{ fontSize: 11, color: '#f59e0b' }}>
            Wind gusts up to {Math.round(weather.windGust || 0)} mph
          </Text>
        </View>
      ) : null}
    </ToolCardBase>
  )
}
