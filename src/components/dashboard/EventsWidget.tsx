'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvents } from '@/lib/hooks/useDataFetching'
import { CalendarDays, MapPin, ExternalLink } from 'lucide-react'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import Link from 'next/link'
import type { CommunityEvent } from '@/types'

const SOURCE_COLORS: Record<string, string> = {
  'Explore Siouxland': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Hard Rock Casino': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'Tyson Events Center': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Community': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
}

function EventRow({ event }: { event: CommunityEvent }) {
  const sourceColor = SOURCE_COLORS[event.source || ''] || 'bg-muted text-muted-foreground'

  return (
    <div className="flex items-start gap-3 py-2.5 px-1">
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{event.date}</span>
          {event.source && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sourceColor}`}>
              {event.source}
            </Badge>
          )}
        </div>
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function EventsWidget() {
  const refreshInterval = 1800000 // 30 minutes
  const { data: eventsData, error, isLoading, isValidating, mutate: refreshEvents } = useEvents(refreshInterval)

  const events = eventsData?.data?.events || []
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

  // Show first 5 upcoming events
  const displayEvents = events.slice(0, 5)

  return (
    <DashboardCard
      title="Community Events"
      icon={<CalendarDays className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {isLoading ? (
        <div className="space-y-3 p-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No upcoming events</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {displayEvents.map((event, i) => (
            <EventRow key={`${event.title}-${i}`} event={event} />
          ))}
        </div>
      )}

      <Link
        href="/events"
        className="block mt-3 pt-3 border-t text-center text-sm text-primary hover:underline"
      >
        View All Events
      </Link>
    </DashboardCard>
  )
}
