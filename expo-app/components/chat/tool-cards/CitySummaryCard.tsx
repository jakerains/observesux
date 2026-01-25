import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { formatCount, unwrapData, type ToolStatus } from './utils'

type CitySummaryAnomaly = { severity: 'info' | 'attention' | 'alert' }

interface CitySummary {
  overall_status: 'normal' | 'attention' | 'alert'
  weather: { anomalies: CitySummaryAnomaly[]; alerts: unknown[] }
  rivers: { anomalies: CitySummaryAnomaly[]; readings: unknown[] }
  airQuality: { anomalies: CitySummaryAnomaly[] }
  traffic: { anomalies: CitySummaryAnomaly[]; incidents: unknown[] }
  narrative_summary?: string
}

function getStatus(anomalies: CitySummaryAnomaly[]): ToolStatus {
  if (anomalies.some((a) => a.severity === 'alert')) return 'alert'
  if (anomalies.some((a) => a.severity === 'attention')) return 'attention'
  return 'normal'
}

function statusLabel(status: CitySummary['overall_status']) {
  if (status === 'alert') return 'Alerts Active'
  if (status === 'attention') return 'Some Concerns'
  return 'All Normal'
}

interface ServiceRowProps {
  label: string
  status: ToolStatus
  detail?: string
}

function ServiceRow({ label, status, detail }: ServiceRowProps) {
  const colorMap: Record<ToolStatus, string> = {
    normal: '#22c55e',
    attention: '#f59e0b',
    alert: '#ef4444',
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colorMap[status] }} />
      <Text style={{ fontSize: 12, fontWeight: '500', color: PlatformColor('label'), flex: 1 }}>{label}</Text>
      {detail && (
        <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>{detail}</Text>
      )}
    </View>
  )
}

export function CitySummaryCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<CitySummary>(output)

  if (error) {
    return <ToolCardBase title="City Status" icon="sparkles" status="alert" error={error} />
  }

  if (!data) {
    return <ToolCardBase title="City Status" icon="sparkles" status="attention" error="No city summary available." />
  }

  const overallStatus = data.overall_status
  const weatherStatus = getStatus(data.weather?.anomalies || [])
  const riverStatus = getStatus(data.rivers?.anomalies || [])
  const airStatus = getStatus(data.airQuality?.anomalies || [])
  const trafficStatus = getStatus(data.traffic?.anomalies || [])

  return (
    <ToolCardBase
      title="City Status"
      icon="sparkles"
      status={overallStatus === 'alert' ? 'alert' : overallStatus === 'attention' ? 'attention' : 'normal'}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
        {statusLabel(overallStatus)}
      </Text>

      <View style={{ gap: 6 }}>
        <ServiceRow
          label="Weather"
          status={weatherStatus}
          detail={formatCount(data.weather?.alerts?.length || 0, 'alert')}
        />
        <ServiceRow label="Rivers" status={riverStatus} detail={formatCount(data.rivers?.readings?.length || 0, 'gauge')} />
        <ServiceRow label="Air Quality" status={airStatus} />
        <ServiceRow
          label="Traffic"
          status={trafficStatus}
          detail={formatCount(data.traffic?.incidents?.length || 0, 'event')}
        />
      </View>

      {data.narrative_summary ? (
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel'), lineHeight: 18 }}>
          {data.narrative_summary}
        </Text>
      ) : null}
    </ToolCardBase>
  )
}
