'use client'

import { DashboardCard } from './DashboardCard'
import { MiniTrendChart } from './MiniTrendChart'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRivers } from '@/lib/hooks/useDataFetching'
import { useRiverHistory } from '@/lib/hooks/useHistory'
import { Waves, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RiverGaugeReading, FloodStage } from '@/types'

interface DataPoint {
  time: string
  value: number
}

function getStageColor(stage: FloodStage): string {
  switch (stage) {
    case 'major': return 'bg-red-600'
    case 'moderate': return 'bg-orange-500'
    case 'minor': return 'bg-yellow-500'
    case 'action': return 'bg-blue-500'
    default: return 'bg-green-500'
  }
}

function getStageBadgeVariant(stage: FloodStage) {
  switch (stage) {
    case 'major': return 'destructive'
    case 'moderate': return 'destructive'
    case 'minor': return 'default'
    case 'action': return 'secondary'
    default: return 'outline'
  }
}

function getTrendIcon(trend?: string) {
  switch (trend) {
    case 'rising': return <TrendingUp className="h-4 w-4 text-red-500" />
    case 'falling': return <TrendingDown className="h-4 w-4 text-green-500" />
    default: return <Minus className="h-4 w-4 text-muted-foreground" />
  }
}

function GaugeDisplay({ reading, trendData }: { reading: RiverGaugeReading, trendData?: DataPoint[] }) {
  // Calculate progress percentage based on major flood stage
  const maxStage = reading.majorFloodStage || 40
  const currentHeight = reading.gaugeHeight || 0
  const percentage = Math.min((currentHeight / maxStage) * 100, 100)

  // Simplified name
  const displayName = reading.siteName.includes('Missouri')
    ? 'Missouri River'
    : reading.siteName.includes('Sioux')
      ? 'Big Sioux River'
      : reading.siteName

  return (
    <div className="space-y-2 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm">{displayName}</span>
        </div>
        <Badge variant={getStageBadgeVariant(reading.floodStage) as "default" | "secondary" | "destructive" | "outline"}>
          {reading.floodStage.charAt(0).toUpperCase() + reading.floodStage.slice(1)}
        </Badge>
      </div>

      {/* Gauge Visualization */}
      <div className="relative pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>0 ft</span>
          <span className="font-medium text-foreground text-sm">
            {currentHeight.toFixed(1)} ft
          </span>
          <span>{maxStage} ft</span>
        </div>
        <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
          {/* Flood stage markers */}
          {reading.actionStage && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10"
              style={{ left: `${(reading.actionStage / maxStage) * 100}%` }}
            />
          )}
          {reading.floodStageLevel && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
              style={{ left: `${(reading.floodStageLevel / maxStage) * 100}%` }}
            />
          )}
          {reading.moderateFloodStage && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10"
              style={{ left: `${(reading.moderateFloodStage / maxStage) * 100}%` }}
            />
          )}
          {/* Current level bar */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getStageColor(reading.floodStage)
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {getTrendIcon(reading.trend)}
          <span>{reading.trend || 'Steady'}</span>
        </div>
        {reading.discharge && (
          <span>{reading.discharge.toLocaleString()} cfs</span>
        )}
        {reading.waterTemp && (
          <span>{reading.waterTemp}°F</span>
        )}
      </div>

      {/* 24h Trend Chart */}
      {trendData && trendData.length > 1 && (
        <div className="mt-2 pt-2 border-t border-dashed">
          <span className="text-xs text-muted-foreground">24h Level</span>
          <MiniTrendChart
            data={trendData}
            color="#3b82f6"
            gradientId={`river-${reading.siteId}`}
            unit=" ft"
            height={35}
          />
        </div>
      )}
    </div>
  )
}

export function RiverGauge() {
  const { data: riversData, error, isLoading } = useRivers()
  const { data: historyData } = useRiverHistory(24)

  const rivers = riversData?.data || []
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  // Check for any flood conditions
  const hasFloodCondition = rivers.some(r => r.floodStage !== 'normal')

  // Get trend data for a specific river
  const getTrendData = (siteId: string): DataPoint[] => {
    if (!historyData?.rivers) return []
    // Big Sioux site ID starts with 06485950, Missouri starts with 06486000
    if (siteId.includes('06485950') && historyData.rivers.bigSioux) {
      return historyData.rivers.bigSioux.map(p => ({ time: p.time, value: p.gaugeHeight }))
    }
    if (siteId.includes('06486000') && historyData.rivers.missouri) {
      return historyData.rivers.missouri.map(p => ({ time: p.time, value: p.gaugeHeight }))
    }
    return []
  }

  if (isLoading) {
    return (
      <DashboardCard title="River Levels" icon={<Waves className="h-4 w-4" />} status="loading">
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="River Levels"
      icon={<Waves className="h-4 w-4" />}
      status={status}
      lastUpdated={rivers[0]?.timestamp ? new Date(rivers[0].timestamp) : undefined}
    >
      {/* Flood Warning Banner */}
      {hasFloodCondition && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>Elevated water levels detected</span>
        </div>
      )}

      {/* River Gauges */}
      <div className="space-y-3">
        {rivers.length > 0 ? (
          rivers.map((reading) => (
            <GaugeDisplay key={reading.siteId} reading={reading} trendData={getTrendData(reading.siteId)} />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-4">
            No river data available
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Action</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Minor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          <span>Major</span>
        </div>
      </div>
    </DashboardCard>
  )
}
