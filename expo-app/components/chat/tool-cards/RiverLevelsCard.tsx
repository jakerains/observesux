import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData, formatCount, type ToolStatus } from './utils'

interface RiverReading {
  siteId: string
  siteName: string
  gaugeHeight: number | null
  floodStage: 'normal' | 'action' | 'minor' | 'moderate' | 'major'
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

function stageStatus(stage: RiverReading['floodStage']): ToolStatus {
  if (stage === 'major' || stage === 'moderate') return 'alert'
  if (stage === 'minor' || stage === 'action') return 'attention'
  return 'normal'
}

export function RiverLevelsCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<RiverReading[]> | RiverReading[]>(output)
  const readings = ((data as ApiResponse<RiverReading[]>)?.data ?? data ?? []) as RiverReading[]

  if (error) {
    return <ToolCardBase title="Rivers" icon="drop.fill" status="alert" error={error} />
  }

  if (!readings || readings.length === 0) {
    return <ToolCardBase title="Rivers" icon="drop.fill" status="attention" error="No river data available." />
  }

  const worstStage = readings.reduce((status: ToolStatus, reading) => {
    const next = stageStatus(reading.floodStage)
    if (next === 'alert') return 'alert'
    if (next === 'attention' && status !== 'alert') return 'attention'
    return status
  }, 'normal')

  return (
    <ToolCardBase title="River Levels" icon="drop.fill" status={worstStage}>
      <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
        {formatCount(readings.length, 'gauge')} reporting
      </Text>
      <View style={{ gap: 6, marginTop: 6 }}>
        {readings.slice(0, 3).map((reading) => (
          <View key={reading.siteId} style={{ gap: 2 }}>
            <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
              {reading.siteName}
            </Text>
            <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
              Stage {reading.gaugeHeight !== null ? `${reading.gaugeHeight.toFixed(2)} ft` : '--'} · {reading.floodStage}
            </Text>
          </View>
        ))}
      </View>
    </ToolCardBase>
  )
}
