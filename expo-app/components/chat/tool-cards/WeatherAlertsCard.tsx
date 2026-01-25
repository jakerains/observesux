import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData, formatCount } from './utils'

interface WeatherAlert {
  id: string
  event: string
  headline: string
  severity: string
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

export function WeatherAlertsCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<WeatherAlert[]> | WeatherAlert[]>(output)
  const alerts = ((data as ApiResponse<WeatherAlert[]>)?.data ?? data ?? []) as WeatherAlert[]

  if (error) {
    return <ToolCardBase title="Weather Alerts" icon="exclamationmark.triangle.fill" status="alert" error={error} />
  }

  if (!alerts || alerts.length === 0) {
    return (
      <ToolCardBase title="Weather Alerts" icon="exclamationmark.triangle.fill" status="normal">
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          No active alerts right now.
        </Text>
      </ToolCardBase>
    )
  }

  return (
    <ToolCardBase title="Weather Alerts" icon="exclamationmark.triangle.fill" status="alert">
      <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
        {formatCount(alerts.length, 'alert')} active
      </Text>
      <View style={{ gap: 6 }}>
        {alerts.slice(0, 2).map((alert) => (
          <View key={alert.id} style={{ gap: 2 }}>
            <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
              {alert.event}
            </Text>
            <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
              {alert.headline}
            </Text>
          </View>
        ))}
      </View>
    </ToolCardBase>
  )
}
