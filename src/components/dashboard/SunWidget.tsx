'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Skeleton } from '@/components/ui/skeleton'
import { useSunTimes } from '@/lib/hooks/useDataFetching'
import { Sunrise, Sunset, Clock, Sun } from 'lucide-react'
import { getDataFreshness } from '@/lib/utils/dataFreshness'

function TimeRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function SunWidget() {
  const refreshInterval = 3600000
  const { data: sunData, error, isLoading, isValidating, mutate: refresh } = useSunTimes(refreshInterval)

  const sun = sunData?.data
  const lastUpdated = sunData?.timestamp ? new Date(sunData.timestamp) : undefined
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
      <DashboardCard title="Sun & Daylight" icon={<Sun className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Sun & Daylight"
      icon={<Sun className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Day Length Banner */}
      {sun?.dayLength && (
        <div className="p-3 rounded-lg mb-3 bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <div>
            <div className="font-medium text-sm text-amber-500">
              {sun.dayLength} of daylight
            </div>
          </div>
        </div>
      )}

      {/* Times */}
      <div className="divide-y divide-border">
        <TimeRow
          icon={<Sunrise className="h-4 w-4 text-orange-400" />}
          label="Sunrise"
          value={sun?.sunrise ?? '—'}
        />
        <TimeRow
          icon={<Sun className="h-4 w-4 text-amber-400" />}
          label="Solar Noon"
          value={sun?.solarNoon ?? '—'}
        />
        <TimeRow
          icon={<Sunset className="h-4 w-4 text-rose-400" />}
          label="Sunset"
          value={sun?.sunset ?? '—'}
        />
        <TimeRow
          icon={<Sun className="h-4 w-4 text-yellow-300" />}
          label="Golden Hour"
          value={sun?.goldenHour ?? '—'}
        />
        <TimeRow
          icon={<Clock className="h-4 w-4 text-indigo-400" />}
          label="Last Light"
          value={sun?.lastLight ?? '—'}
        />
      </div>
    </DashboardCard>
  )
}
