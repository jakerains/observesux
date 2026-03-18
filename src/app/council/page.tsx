'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Landmark,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { track } from '@vercel/analytics'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'
import useSWR from 'swr'
import type { CouncilMeeting, MeetingType } from '@/types/council-meetings'
import { MEETING_TYPE_LABELS } from '@/types/council-meetings'

interface RecapsResponse {
  meetings: CouncilMeeting[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function formatMeetingDate(dateStr: string | null): string {
  if (!dateStr) return 'Date unknown'
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  })
}

function getMeetingSlug(meeting: CouncilMeeting): string {
  const base = meeting.meetingDate || meeting.id
  if (!meeting.meetingType || meeting.meetingType === 'city_council') return base
  return `${base}-${meeting.meetingType}`
}

function MeetingListItem({ meeting }: { meeting: CouncilMeeting }) {
  const recap = meeting.recap
  if (!recap) return null

  const slug = getMeetingSlug(meeting)
  const showTypeBadge = meeting.meetingType && meeting.meetingType !== 'city_council'

  return (
    <Link
      href={`/council/${slug}`}
      className="block group"
      onClick={() => track('council_recap_clicked', {
        source: 'list',
        meetingDate: meeting.meetingDate,
        videoId: meeting.videoId,
        meetingType: meeting.meetingType,
      })}
    >
      <Card className="overflow-hidden transition-colors group-hover:border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <time className="text-xs font-medium text-primary">
                  {formatMeetingDate(meeting.meetingDate)}
                </time>
                {showTypeBadge && (
                  <Badge variant="secondary" className="text-[10px]">
                    {MEETING_TYPE_LABELS[meeting.meetingType]}
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-sm leading-snug mt-1 line-clamp-2">
                {meeting.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {recap.summary}
              </p>
              {recap.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {recap.topics.slice(0, 4).map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {topic}
                    </Badge>
                  ))}
                  {recap.topics.length > 4 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{recap.topics.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function CouncilPage() {
  const { data, error, isLoading } = useSWR<RecapsResponse>(
    '/api/council-meetings/recaps?all=true',
    fetcher
  )

  const meetings = data?.meetings ?? []
  const [activeFilter, setActiveFilter] = useState<MeetingType | 'all'>('all')

  // Compute which types have meetings — only show filter when multiple types exist
  const availableTypes = useMemo(() => {
    const types = new Set(meetings.map(m => m.meetingType || 'city_council'))
    return Array.from(types) as MeetingType[]
  }, [meetings])

  const showFilters = availableTypes.length > 1

  const filteredMeetings = useMemo(() => {
    if (activeFilter === 'all') return meetings
    return meetings.filter(m => (m.meetingType || 'city_council') === activeFilter)
  }, [meetings, activeFilter])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Meeting Recaps</h1>
              <p className="text-sm text-muted-foreground">
                Council meetings, budget sessions, and more — recapped by SUX
              </p>
            </div>
          </div>
        </div>

        {/* Type filter tabs — only shown when multiple types exist */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {MEETING_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}

        {/* Meeting list */}
        {error ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Landmark className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Unable to load meeting recaps
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Landmark className="h-12 w-12 text-muted-foreground/30" />
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    {activeFilter !== 'all' ? `No ${MEETING_TYPE_LABELS[activeFilter]} meetings yet` : 'No meetings yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Meeting recaps will appear here once videos are processed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => (
              <MeetingListItem key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      <MobileNavigation />
    </main>
  )
}
