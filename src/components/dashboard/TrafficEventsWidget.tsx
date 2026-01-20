'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTrafficEvents } from '@/lib/hooks/useDataFetching'
import { AlertTriangle, Construction, Car, Cone, CheckCircle, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TrafficEvent } from '@/types'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import { useMapFocus } from '@/lib/contexts/MapFocusContext'

function getEventIcon(type: TrafficEvent['type']) {
  switch (type) {
    case 'incident': return <AlertTriangle className="h-4 w-4" />
    case 'construction': return <Construction className="h-4 w-4" />
    case 'closure': return <Cone className="h-4 w-4" />
    default: return <Car className="h-4 w-4" />
  }
}

function getSeverityColor(severity: TrafficEvent['severity']) {
  switch (severity) {
    case 'critical': return 'destructive'
    case 'major': return 'destructive'
    case 'moderate': return 'default'
    default: return 'secondary'
  }
}

function getSeverityBgColor(severity: TrafficEvent['severity']) {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 border-red-500/20'
    case 'major': return 'bg-orange-500/10 border-orange-500/20'
    case 'moderate': return 'bg-yellow-500/10 border-yellow-500/20'
    default: return 'bg-blue-500/10 border-blue-500/20'
  }
}

interface EventRowProps {
  event: TrafficEvent
  onClick?: () => void
}

function EventRow({ event, onClick }: EventRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border w-full text-left transition-all",
        "hover:ring-2 hover:ring-primary/50 cursor-pointer",
        getSeverityBgColor(event.severity)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            {getEventIcon(event.type)}
          </div>
          <div>
            <h4 className="font-medium text-sm">{event.headline}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{event.roadway}</span>
              {event.direction && <span>({event.direction})</span>}
            </div>
          </div>
        </div>
        <Badge variant={getSeverityColor(event.severity) as "default" | "secondary" | "destructive" | "outline"}>
          {event.severity}
        </Badge>
      </div>

      {event.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Started {formatDistanceToNow(new Date(event.startTime), { addSuffix: true })}</span>
        <Badge variant="outline" className="text-xs">
          {event.type}
        </Badge>
      </div>
    </button>
  )
}

export function TrafficEventsWidget() {
  const refreshInterval = 300000
  const { data: eventsData, error, isLoading, isValidating, mutate: refreshEvents } = useTrafficEvents(refreshInterval)
  const { focusOnLocation } = useMapFocus()

  const events = eventsData?.data || []
  const lastUpdated = eventsData?.timestamp ? new Date(eventsData.timestamp) : undefined
  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })
  const refreshAction = (
    <RefreshAction
      onRefresh={() => refreshEvents()}
      isLoading={isLoading}
      isValidating={isValidating}
    />
  )

  // Count by type
  const incidents = events.filter(e => e.type === 'incident').length
  const construction = events.filter(e => e.type === 'construction').length
  const closures = events.filter(e => e.type === 'closure').length

  if (isLoading) {
    return (
      <DashboardCard title="Traffic Events" icon={<AlertTriangle className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Traffic Events"
      icon={<AlertTriangle className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Summary */}
        {events.length > 0 ? (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b shrink-0">
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
        ) : (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 mb-3 shrink-0">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-medium text-sm text-green-600 dark:text-green-400">
                Clear Roads
              </div>
              <div className="text-xs text-muted-foreground">
                No active incidents in the area
              </div>
            </div>
          </div>
        )}

        {/* Events List - fills available space */}
        <ScrollArea className="flex-1 min-h-[100px]">
          {events.length > 0 ? (
            <div className="space-y-2 pr-3">
              {events.slice(0, 10).map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onClick={() => focusOnLocation({
                    lat: event.latitude,
                    lon: event.longitude,
                    label: event.headline,
                    zoom: 14
                  })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Car className="h-8 w-8 mx-auto mb-2" />
              <p>Traffic is flowing normally</p>
            </div>
          )}
        </ScrollArea>

      </div>
    </DashboardCard>
  )
}
