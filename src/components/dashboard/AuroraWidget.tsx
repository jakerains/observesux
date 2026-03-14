'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAurora } from '@/lib/hooks/useDataFetching'
import { Sparkles, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'

const VISIBILITY_CONFIG = {
  none: {
    color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    gaugeColor: 'bg-gray-500',
    label: 'Quiet',
  },
  unlikely: {
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gaugeColor: 'bg-blue-500',
    label: 'Elevated',
  },
  possible: {
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gaugeColor: 'bg-purple-500',
    label: 'Minor Storm',
  },
  likely: {
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    gaugeColor: 'bg-green-500',
    label: 'Possible!',
  },
  strong: {
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    gaugeColor: 'bg-emerald-400',
    label: 'Look North!',
  },
}

function KpGauge({ kp }: { kp: number }) {
  // Kp ranges 0-9, map to percentage
  const percent = Math.min((kp / 9) * 100, 100)
  const segments = Array.from({ length: 9 }, (_, i) => i + 1)

  return (
    <div className="flex gap-0.5">
      {segments.map(i => (
        <div
          key={i}
          className={cn(
            'h-3 flex-1 rounded-sm transition-colors',
            i <= kp
              ? i >= 7
                ? 'bg-emerald-400'
                : i >= 5
                  ? 'bg-purple-500'
                  : i >= 4
                    ? 'bg-blue-500'
                    : 'bg-gray-500'
              : 'bg-muted'
          )}
        />
      ))}
    </div>
  )
}

export function AuroraWidget() {
  const refreshInterval = 300000
  const { data: auroraData, error, isLoading, isValidating, mutate: refresh } = useAurora(refreshInterval)

  const aurora = auroraData?.data
  const lastUpdated = auroraData?.timestamp ? new Date(auroraData.timestamp) : undefined
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
      <DashboardCard title="Aurora Watch" icon={<Sparkles className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </DashboardCard>
    )
  }

  const visibility = aurora?.visibility ?? 'none'
  const config = VISIBILITY_CONFIG[visibility]

  return (
    <DashboardCard
      title="Aurora Watch"
      icon={<Sparkles className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Status Banner */}
      <div className={cn('p-3 rounded-lg mb-3 flex items-center justify-between', config.color)}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <div className="font-medium text-sm">{config.label}</div>
            <div className="text-xs opacity-75">
              Kp Index: {aurora?.kpIndex ?? '—'}
            </div>
          </div>
        </div>
        {aurora?.lookNorth && (
          <Badge variant="outline" className="gap-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse">
            <Eye className="h-3 w-3" />
            Look North!
          </Badge>
        )}
      </div>

      {/* Kp Gauge */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Quiet</span>
          <span>Storm</span>
        </div>
        <KpGauge kp={aurora?.kpIndex ?? 0} />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1</span>
          <span>5 — visible at 42°N</span>
          <span>9</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mt-3">
        {aurora?.visibilityLabel ?? 'No data available'}
      </p>
    </DashboardCard>
  )
}
