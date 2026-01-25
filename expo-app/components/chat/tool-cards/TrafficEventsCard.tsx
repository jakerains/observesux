import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData, formatCount, type ToolStatus } from './utils'

interface TrafficEvent {
  id: string
  type: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  headline?: string
  description?: string
  roadway?: string
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

function severityStatus(events: TrafficEvent[]): ToolStatus {
  if (events.some((event) => event.severity === 'critical' || event.severity === 'major')) return 'alert'
  if (events.length > 0) return 'attention'
  return 'normal'
}

export function TrafficEventsCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<TrafficEvent[]> | TrafficEvent[]>(output)
  const events = ((data as ApiResponse<TrafficEvent[]>)?.data ?? data ?? []) as TrafficEvent[]

  if (error) {
    return <ToolCardBase title="Traffic" icon="car.fill" status="alert" error={error} />
  }

  if (!events || events.length === 0) {
    return (
      <ToolCardBase title="Traffic" icon="car.fill" status="normal">
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          Clear roads — no active incidents.
        </Text>
      </ToolCardBase>
    )
  }

  const incidents = events.filter((event) => event.type === 'incident').length
  const construction = events.filter((event) => event.type === 'construction').length
  const closures = events.filter((event) => event.type === 'closure').length

  return (
    <ToolCardBase title="Traffic" icon="car.fill" status={severityStatus(events)}>
      <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
        {formatCount(events.length, 'event')} active
      </Text>
      <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
        {incidents > 0 ? `${formatCount(incidents, 'incident')}` : 'No incidents'}
        {construction > 0 ? ` · ${formatCount(construction, 'construction')}` : ''}
        {closures > 0 ? ` · ${formatCount(closures, 'closure')}` : ''}
      </Text>
      <View style={{ gap: 6, marginTop: 6 }}>
        {events.slice(0, 3).map((event) => (
          <View key={event.id} style={{ gap: 2 }}>
            <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
              {event.headline || event.description || 'Traffic event'}
            </Text>
            {event.roadway ? (
              <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
                {event.roadway}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ToolCardBase>
  )
}
