import { View, Text, PlatformColor } from 'react-native'
import { ToolCardBase } from './ToolCardBase'
import { unwrapData } from './utils'

interface GasPriceStats {
  lowestRegular: number | null
  averageRegular: number | null
  highestRegular: number | null
  stationCount: number
  cheapestStation: string | null
}

interface GasPriceData {
  stations: Array<{ brandName: string }>
  stats: GasPriceStats
}

interface ApiResponse<T> {
  data: T | null
  error?: string
}

export function GasPricesCard({ output }: { output: unknown }) {
  const { data, error } = unwrapData<ApiResponse<GasPriceData> | GasPriceData>(output)
  const payload = (data as ApiResponse<GasPriceData>)?.data ?? (data as GasPriceData | null)

  if (error) {
    return <ToolCardBase title="Gas Prices" icon="fuelpump.fill" status="alert" error={error} />
  }

  if (!payload) {
    return <ToolCardBase title="Gas Prices" icon="fuelpump.fill" status="attention" error="No gas price data available." />
  }

  const stats = payload.stats

  return (
    <ToolCardBase title="Gas Prices" icon="fuelpump.fill" status="normal">
      <Text selectable style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
        Regular (avg) {stats.averageRegular ? `$${stats.averageRegular.toFixed(2)}` : '--'}
      </Text>
      <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
        Low {stats.lowestRegular ? `$${stats.lowestRegular.toFixed(2)}` : '--'} · High{' '}
        {stats.highestRegular ? `$${stats.highestRegular.toFixed(2)}` : '--'}
      </Text>
      {stats.cheapestStation ? (
        <Text selectable style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
          Cheapest: {stats.cheapestStation}
        </Text>
      ) : null}
      <Text selectable style={{ fontSize: 11, color: PlatformColor('tertiaryLabel') }}>
        {stats.stationCount} stations reporting
      </Text>
    </ToolCardBase>
  )
}
