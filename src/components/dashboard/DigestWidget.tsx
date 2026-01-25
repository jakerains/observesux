'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Newspaper, ArrowRight, Sun, Sunset, Moon } from 'lucide-react'
import useSWR from 'swr'
import { editionLabels, type DigestEdition } from '@/lib/digest/types'

interface DigestResponse {
  digest: {
    id: string
    edition: DigestEdition
    date: string
    summary: string
    content: string
    createdAt: string
  } | null
  available: boolean
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const editionIcons: Record<DigestEdition, typeof Sun> = {
  morning: Sun,
  midday: Sunset,
  evening: Moon
}

function formatDigestDate(dateStr: string, createdAt: string): string {
  const date = new Date(dateStr)
  const created = new Date(createdAt)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return `Today at ${created.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })}`
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago'
  })
}

export function DigestWidget() {
  const { data, error, isLoading } = useSWR<DigestResponse>(
    '/api/user/digest',
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  )

  const digest = data?.digest
  const EditionIcon = digest ? editionIcons[digest.edition] : Newspaper

  if (error) {
    return (
      <DashboardCard
        title="Siouxland Digest"
        icon={<Newspaper className="h-4 w-4 text-primary" />}
        status="error"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to load digest
          </p>
        </div>
      </DashboardCard>
    )
  }

  if (isLoading) {
    return (
      <DashboardCard
        title="Siouxland Digest"
        icon={<Newspaper className="h-4 w-4 text-primary" />}
        status="loading"
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-8 w-32 mt-4" />
        </div>
      </DashboardCard>
    )
  }

  if (!digest) {
    return (
      <DashboardCard
        title="Siouxland Digest"
        icon={<Newspaper className="h-4 w-4 text-primary" />}
        status="live"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No digest available yet
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/account/digest">
              Generate First Digest
            </Link>
          </Button>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Siouxland Digest"
      icon={<Newspaper className="h-4 w-4 text-primary" />}
      status="live"
      lastUpdated={new Date(digest.createdAt)}
    >
      <div className="flex flex-col h-full">
        {/* Edition badge and date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Badge variant="secondary" className="gap-1 text-xs">
            <EditionIcon className="h-3 w-3" />
            {editionLabels[digest.edition]}
          </Badge>
          <span>{formatDigestDate(digest.date, digest.createdAt)}</span>
        </div>

        {/* Summary - rendered as markdown */}
        <div className="flex-1 prose prose-sm dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold max-w-none">
          <ReactMarkdown>
            {digest.summary || 'Check out today\'s community digest for weather, news, events, and more.'}
          </ReactMarkdown>
        </div>

        {/* Read more link - pinned to bottom */}
        <div className="mt-auto pt-3">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/account/digest">
              Read Full Digest
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </DashboardCard>
  )
}
