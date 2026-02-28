import { View, Text, PlatformColor } from 'react-native'
import { Image } from 'expo-image'
import type { ToolStatus } from './utils'

interface ToolCardBaseProps {
  title: string
  icon: string
  status?: ToolStatus
  error?: string
  children?: React.ReactNode
}

const STATUS_COLORS: Record<ToolStatus, string> = {
  normal: '#22c55e',
  attention: '#f59e0b',
  alert: '#ef4444',
}

export function ToolCardBase({ title, icon, status = 'normal', error, children }: ToolCardBaseProps) {
  const statusColor = STATUS_COLORS[status]

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: 'continuous',
        padding: 12,
        backgroundColor: '#1f130c',
        borderWidth: 0.5,
        borderColor: PlatformColor('separator'),
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Image source={`sf:${icon}`} style={{ width: 18, height: 18 }} tintColor={'#e69c3a'} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: PlatformColor('label'), flex: 1 }}>
          {title}
        </Text>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
      </View>
      {error ? (
        <Text selectable style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
          {error}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}
