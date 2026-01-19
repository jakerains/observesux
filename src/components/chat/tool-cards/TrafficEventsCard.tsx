import {
  AlertTriangle,
  Construction,
  Car,
  Cone,
  CheckCircle,
  MapPin,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { TrafficEvent, ApiResponse } from '@/types'

type TrafficToolOutput = ApiResponse<TrafficEvent[]> | { error: string }

function getEventIcon(type: TrafficEvent['type']) {
  switch (type) {
    case 'incident': return <AlertTriangle className="h-3.5 w-3.5" />
    case 'construction': return <Construction className="h-3.5 w-3.5" />
    case 'closure': return <Cone className="h-3.5 w-3.5" />
    default: return <Car className="h-3.5 w-3.5" />
  }
}

function getSeverityColor(severity: TrafficEvent['severity']) {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-600'
    case 'major': return 'bg-orange-500/10 border-orange-500/30 text-orange-600'
    case 'moderate': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'
    default: return 'bg-blue-500/10 border-blue-500/30 text-blue-600'
  }
}

function getSeverityBadgeVariant(severity: TrafficEvent['severity']) {
  switch (severity) {
    case 'critical': return 'destructive'
    case 'major': return 'destructive'
    default: return 'secondary'
  }
}

interface EventRowProps {
  event: TrafficEvent
}

function EventRow({ event }: EventRowProps) {
  return (
    <div className={cn(
      'p-2 rounded-lg border',
      getSeverityColor(event.severity)
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5 shrink-0">
            {getEventIcon(event.type)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm line-clamp-1">{event.headline}</p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.roadway}</span>
            </div>
          </div>
        </div>
        <Badge
          variant={getSeverityBadgeVariant(event.severity) as "default" | "secondary" | "destructive" | "outline"}
          className="text-xs shrink-0"
        >
          {event.severity}
        </Badge>
      </div>
    </div>
  )
}

export function TrafficEventsCard({ data, error, state }: ToolCardProps<TrafficToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Traffic"
        icon={<Car className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const trafficData = data as ApiResponse<TrafficEvent[]>
  const events = trafficData?.data || []

  // Count by type
  const incidents = events.filter(e => e.type === 'incident').length
  const construction = events.filter(e => e.type === 'construction').length
  const closures = events.filter(e => e.type === 'closure').length

  const hasIssues = events.length > 0
  const hasSevereIssues = events.some(e => ['critical', 'major'].includes(e.severity))

  return (
    <ToolCardWrapper
      title="Traffic"
      icon={<Car className="h-3.5 w-3.5" />}
      status={hasSevereIssues ? 'alert' : hasIssues ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Clear roads message or summary badges */}
      {events.length === 0 ? (
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <div className="font-medium text-sm text-green-600 dark:text-green-400">
              Clear Roads
            </div>
            <div className="text-xs text-muted-foreground">
              No active incidents in the area
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {incidents > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {incidents} Incident{incidents !== 1 ? 's' : ''}
              </Badge>
            )}
            {construction > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Construction className="h-3 w-3 mr-1" />
                {construction} Construction
              </Badge>
            )}
            {closures > 0 && (
              <Badge variant="outline" className="text-xs">
                <Cone className="h-3 w-3 mr-1" />
                {closures} Closure{closures !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Events list - show top 3 */}
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>

          {events.length > 3 && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              +{events.length - 3} more event{events.length - 3 !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </ToolCardWrapper>
  )
}
