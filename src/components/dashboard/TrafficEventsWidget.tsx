'use client'

import { useState } from 'react'
import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTrafficEvents } from '@/lib/hooks/useDataFetching'
import { AlertTriangle, Construction, Car, Cone, CheckCircle, MapPin, Clock, Navigation, ExternalLink } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TrafficEvent } from '@/types'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import { useMapFocus } from '@/lib/contexts/MapFocusContext'

function getEventIcon(type: TrafficEvent['type'], className = "h-4 w-4") {
  switch (type) {
    case 'incident': return <AlertTriangle className={className} />
    case 'construction': return <Construction className={className} />
    case 'closure': return <Cone className={className} />
    default: return <Car className={className} />
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

function getEventTypeLabel(type: TrafficEvent['type']) {
  switch (type) {
    case 'incident': return 'Incident'
    case 'construction': return 'Construction'
    case 'closure': return 'Road Closure'
    case 'road_condition': return 'Road Condition'
    default: return type
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

interface EventDetailModalProps {
  event: TrafficEvent | null
  open: boolean
  onClose: () => void
  onFocusMap: (event: TrafficEvent) => void
}

function EventDetailModal({ event, open, onClose, onFocusMap }: EventDetailModalProps) {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              getSeverityBgColor(event.severity)
            )}>
              {getEventIcon(event.type, "h-5 w-5")}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base leading-snug">
                {event.headline}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant={getSeverityColor(event.severity) as "default" | "secondary" | "destructive" | "outline"}>
                  {event.severity}
                </Badge>
                <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <span className="font-medium">{event.roadway}</span>
              {event.direction && (
                <span className="text-muted-foreground"> ({event.direction})</span>
              )}
            </div>
          </div>

          {/* Times */}
          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">Started: </span>
                <span>{format(new Date(event.startTime), 'MMM d, yyyy h:mm a')}</span>
                <span className="text-muted-foreground"> ({formatDistanceToNow(new Date(event.startTime), { addSuffix: true })})</span>
              </div>
              {event.endTime && (
                <div>
                  <span className="text-muted-foreground">Expected end: </span>
                  <span>{format(new Date(event.endTime), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Full Description */}
          {event.description && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onFocusMap(event)
                onClose()
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Navigation className="h-4 w-4" />
              Focus on Map
            </button>
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <ExternalLink className="h-4 w-4" />
                View on 511
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TrafficEventsWidget() {
  const refreshInterval = 300000
  const { data: eventsData, error, isLoading, isValidating, mutate: refreshEvents } = useTrafficEvents(refreshInterval)
  const { focusOnLocation } = useMapFocus()
  const [selectedEvent, setSelectedEvent] = useState<TrafficEvent | null>(null)

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

  const handleFocusMap = (event: TrafficEvent) => {
    focusOnLocation({
      lat: event.latitude,
      lon: event.longitude,
      label: event.headline,
      zoom: 14
    })
  }

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
                  onClick={() => setSelectedEvent(event)}
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

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        onFocusMap={handleFocusMap}
      />
    </DashboardCard>
  )
}
