import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData, type ToolStatus } from './utils'

interface AirQualityReading {
  aqi: number
  category: string
  primaryPollutant?: string
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

function categoryStatus(category: string): ToolStatus {
  const lower = category.toLowerCase()
  if (lower.includes('hazard') || lower.includes('very unhealthy')) return 'alert'
  if (lower.includes('unhealthy') || lower.includes('moderate')) return 'attention'
  return 'normal'
}

export function AirQualityCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<AirQualityReading> | AirQualityReading>(output)
  const reading = (data as ApiResponse<AirQualityReading>)?.data ?? (data as AirQualityReading | null)

  if (error) {
    return <ToolCardBase title="Air Quality" icon="leaf.fill" status="alert" error={error} />
  }

  if (!reading) {
    return <ToolCardBase title="Air Quality" icon="leaf.fill" status="attention" error="No air quality data available." />
  }

  return (
    <ToolCardBase title="Air Quality" icon="leaf.fill" status={categoryStatus(reading.category)}>
      <Text selectable style={{ fontSize: 16, fontWeight: '600', color: PlatformColor('label') }}>
        AQI {reading.aqi} · {reading.category}
      </Text>
      {reading.primaryPollutant ? (
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          Primary pollutant: {reading.primaryPollutant}
        </Text>
      ) : null}
    </ToolCardBase>
  )
}
