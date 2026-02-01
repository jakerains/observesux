'use client'

import Link from 'next/link'
import { DashboardCard } from './DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Landmark, ArrowRight } from 'lucide-react'
import useSWR from 'swr'
import type { CouncilMeeting } from '@/types/council-meetings'

interface RecapsResponse {
  meetings: CouncilMeeting[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function formatMeetingDate(dateStr: string | null): string {
  if (!dateStr) return 'Recent Meeting'
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
  })
}

export function CouncilWidget() {
  const { data, error, isLoading } = useSWR<RecapsResponse>(
    '/api/council-meetings/recaps',
    fetcher,
    { refreshInterval: 1800000 } // 30 minutes
  )

  const meeting = data?.meetings?.[0]
  const recap = meeting?.recap

  if (error) {
    return (
      <DashboardCard
        title="City Council"
        icon={<Landmark className="h-4 w-4 text-primary" />}
        status="error"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-muted-foreground">Unable to load council recaps</p>
        </div>
      </DashboardCard>
    )
  }

  if (isLoading) {
    return (
      <DashboardCard
        title="City Council"
        icon={<Landmark className="h-4 w-4 text-primary" />}
        status="loading"
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-8 w-32 mt-4" />
        </div>
      </DashboardCard>
    )
  }

  if (!meeting || !recap) {
    return (
      <DashboardCard
        title="City Council"
        icon={<Landmark className="h-4 w-4 text-primary" />}
        status="live"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Landmark className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No meetings yet</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="City Council"
      icon={<Landmark className="h-4 w-4 text-primary" />}
      status="live"
      lastUpdated={new Date(meeting.updatedAt)}
    >
      <div className="flex flex-col h-full">
        {/* Meeting date + title */}
        <div className="mb-3">
          <Badge variant="secondary" className="text-xs mb-2">
            {formatMeetingDate(meeting.meetingDate)}
          </Badge>
          <h3 className="text-sm font-medium leading-snug line-clamp-1">
            {meeting.title}
          </h3>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
          {recap.summary}
        </p>

        {/* Top decisions */}
        {recap.decisions.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              Key Decisions
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {recap.decisions.slice(0, 2).map((decision, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span className="line-clamp-2">{decision}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View all link */}
        <div className="mt-auto pt-3">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={meeting.meetingDate ? `/council/${meeting.meetingDate}` : '/council'}>
              Read Latest Recap
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </DashboardCard>
  )
}
