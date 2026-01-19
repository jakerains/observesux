import { Waves, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { RiverGaugeReading, FloodStage, ApiResponse } from '@/types'

type RiversToolOutput = ApiResponse<RiverGaugeReading[]> | { error: string }

function getStageColor(stage: FloodStage): string {
  switch (stage) {
    case 'major': return 'bg-red-500/10 border-red-500/30 text-red-600'
    case 'moderate': return 'bg-orange-500/10 border-orange-500/30 text-orange-600'
    case 'minor': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'
    case 'action': return 'bg-blue-500/10 border-blue-500/30 text-blue-600'
    default: return 'bg-green-500/10 border-green-500/30 text-green-600'
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
    case 'rising':
      return <TrendingUp className="h-3.5 w-3.5 text-red-500" />
    case 'falling':
      return <TrendingDown className="h-3.5 w-3.5 text-green-500" />
    default:
      return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function getSimpleName(siteName: string): string {
  if (siteName.includes('Missouri')) return 'Missouri River'
  if (siteName.includes('Sioux')) return 'Big Sioux River'
  if (siteName.includes('Floyd')) return 'Floyd River'
  return siteName
}

interface GaugeRowProps {
  reading: RiverGaugeReading
}

function GaugeRow({ reading }: GaugeRowProps) {
  const displayName = getSimpleName(reading.siteName)

  return (
    <div className={cn(
      'p-2 rounded-lg border flex items-center justify-between',
      getStageColor(reading.floodStage)
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <Waves className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium text-sm truncate">{displayName}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-sm">
          {getTrendIcon(reading.trend)}
          <span className="font-medium">
            {reading.gaugeHeight?.toFixed(1) || '--'} ft
          </span>
        </div>
        <Badge
          variant={getStageBadgeVariant(reading.floodStage) as "default" | "secondary" | "destructive" | "outline"}
          className="text-xs"
        >
          {reading.floodStage.charAt(0).toUpperCase() + reading.floodStage.slice(1)}
        </Badge>
      </div>
    </div>
  )
}

export function RiverLevelsCard({ data, error, state }: ToolCardProps<RiversToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="River Levels"
        icon={<Waves className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const riversData = data as ApiResponse<RiverGaugeReading[]>
  const rivers = riversData?.data || []

  if (rivers.length === 0) {
    return (
      <ToolCardWrapper
        title="River Levels"
        icon={<Waves className="h-3.5 w-3.5" />}
        error="No river data available"
      />
    )
  }

  const hasFloodCondition = rivers.some(r => r.floodStage !== 'normal')
  const hasAlert = rivers.some(r => ['major', 'moderate'].includes(r.floodStage))

  return (
    <ToolCardWrapper
      title="River Levels"
      icon={<Waves className="h-3.5 w-3.5" />}
      status={hasAlert ? 'alert' : hasFloodCondition ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Warning banner if flood conditions */}
      {hasFloodCondition && (
        <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
          <span className="text-yellow-700 dark:text-yellow-400">Elevated water levels detected</span>
        </div>
      )}

      {/* River gauges list */}
      <div className="space-y-2">
        {rivers.map((reading) => (
          <GaugeRow key={reading.siteId} reading={reading} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 text-xs text-muted-foreground">
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
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Major</span>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
