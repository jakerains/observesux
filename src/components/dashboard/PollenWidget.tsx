'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePollen } from '@/lib/hooks/useDataFetching'
import { Flower2, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'

const LEVEL_CONFIG = {
  none: { label: 'None', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', barColor: 'bg-gray-500' },
  low: { label: 'Low', color: 'bg-green-500/10 text-green-500 border-green-500/20', barColor: 'bg-green-500' },
  moderate: { label: 'Moderate', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', barColor: 'bg-yellow-500' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', barColor: 'bg-orange-500' },
  very_high: { label: 'Very High', color: 'bg-red-500/10 text-red-500 border-red-500/20', barColor: 'bg-red-500' },
}

function getLevel(value: number | null): keyof typeof LEVEL_CONFIG {
  if (value === null || value === 0) return 'none'
  if (value < 20) return 'low'
  if (value < 50) return 'moderate'
  if (value < 100) return 'high'
  return 'very_high'
}

function PollenBar({ label, value }: { label: string; value: number | null }) {
  const level = getLevel(value)
  const config = LEVEL_CONFIG[level]
  const barWidth = value === null ? 0 : Math.min((value / 120) * 100, 100)

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', config.barColor)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right text-muted-foreground">
        {value !== null ? Math.round(value) : '—'}
      </span>
    </div>
  )
}

export function PollenWidget() {
  const refreshInterval = 300000
  const { data: pollenData, error, isLoading, isValidating, mutate: refresh } = usePollen(refreshInterval)

  const pollen = pollenData?.data
  const lastUpdated = pollenData?.timestamp ? new Date(pollenData.timestamp) : undefined
  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })

  const refreshAction = (
    <RefreshAction onRefresh={() => refresh()} isLoading={isLoading} isValidating={isValidating} />
  )

  if (isLoading) {
    return (
      <DashboardCard title="Pollen & Allergy" icon={<Flower2 className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </DashboardCard>
    )
  }

  const overallConfig = pollen ? LEVEL_CONFIG[pollen.overallLevel] : LEVEL_CONFIG.none

  return (
    <DashboardCard
      title="Pollen & Allergy"
      icon={<Flower2 className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Overall Status */}
      <div className={cn('p-3 rounded-lg mb-3 flex items-center justify-between', overallConfig.color)}>
        <div className="flex items-center gap-2">
          <Flower2 className="h-5 w-5" />
          <div>
            <div className="font-medium text-sm">{overallConfig.label} Pollen</div>
            {pollen?.dominantType && (
              <div className="text-xs opacity-75">
                Dominant: {pollen.dominantType}
              </div>
            )}
          </div>
        </div>
        {pollen?.uvIndex !== null && pollen?.uvIndex !== undefined && (
          <Badge variant="outline" className="gap-1">
            <Sun className="h-3 w-3" />
            UV {Math.round(pollen.uvIndex)}
          </Badge>
        )}
      </div>

      {/* Pollen Type Bars */}
      <div className="space-y-2">
        <PollenBar label="Ragweed" value={pollen?.current.ragweed ?? null} />
        <PollenBar label="Grass" value={pollen?.current.grass ?? null} />
        <PollenBar label="Birch" value={pollen?.current.birch ?? null} />
        <PollenBar label="Alder" value={pollen?.current.alder ?? null} />
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t flex flex-wrap gap-1.5 text-xs">
        <span className="text-muted-foreground">grains/m³:</span>
        {(['low', 'moderate', 'high', 'very_high'] as const).map(level => (
          <Badge key={level} variant="outline" className={cn('text-[10px] px-1.5 py-0', LEVEL_CONFIG[level].color)}>
            {LEVEL_CONFIG[level].label}
          </Badge>
        ))}
      </div>
    </DashboardCard>
  )
}
