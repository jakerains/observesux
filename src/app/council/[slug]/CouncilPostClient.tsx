'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Landmark,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Vote,
  ListChecks,
} from 'lucide-react'
import { track } from '@vercel/analytics'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'
import { ShareButton } from '@/components/ui/share-button'
import { markdownToHtml } from '@/lib/utils'
import type { CouncilMeeting } from '@/types/council-meetings'

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

interface CouncilPostClientProps {
  meeting: CouncilMeeting | null
}

export function CouncilPostClient({ meeting }: CouncilPostClientProps) {
  const recap = meeting?.recap

  if (!meeting || !recap) {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container mx-auto py-6 px-4 max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/council">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Meeting not found</h1>
          </div>
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Landmark className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  This council meeting recap could not be found.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/council">Back to all meetings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <MobileNavigation />
      </main>
    )
  }

  const youtubeUrl = meeting.videoUrl || `https://www.youtube.com/watch?v=${meeting.videoId}`

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/council"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Council Meetings
          </Link>
        </div>

        {/* Hero header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <time className="text-sm font-medium text-primary">
                {formatMeetingDate(meeting.meetingDate)}
              </time>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2 leading-tight">
                {meeting.title}
              </h1>
            </div>
            <ShareButton
              url={`https://siouxland.online/council/${meeting.meetingDate}`}
              title={meeting.title}
              text={recap.summary}
              className="shrink-0 mt-1"
            />
          </div>
        </header>

        {/* Summary */}
        <section className="mb-8">
          <p className="text-base leading-relaxed text-foreground">
            {recap.summary}
          </p>
        </section>

        {/* Collapsible sections */}
        <div className="mb-10 space-y-3">
          {recap.decisions.length > 0 && (
            <details className="group rounded-xl border bg-card overflow-hidden">
              <summary className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-accent/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                <Vote className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">Key Decisions</span>
                <Badge variant="secondary" className="ml-auto text-xs">{recap.decisions.length}</Badge>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <ul className="space-y-2">
                  {recap.decisions.map((decision, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {recap.topics.length > 0 && (
            <details className="group rounded-xl border bg-card overflow-hidden">
              <summary className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-accent/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                <ListChecks className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">Topics Discussed</span>
                <Badge variant="secondary" className="ml-auto text-xs">{recap.topics.length}</Badge>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <div className="flex flex-wrap gap-2">
                  {recap.topics.map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </details>
          )}

          {recap.publicComments.length > 0 && (
            <details className="group rounded-xl border bg-card overflow-hidden">
              <summary className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-accent/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">Public Comments</span>
                <Badge variant="secondary" className="ml-auto text-xs">{recap.publicComments.length}</Badge>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <ul className="space-y-2">
                  {recap.publicComments.map((comment, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0">&mdash;</span>
                      <span>{comment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>

        {/* Full recap article */}
        {recap.article && (
          <article className="mb-10">
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(recap.article) }} />
            </div>
          </article>
        )}

        {/* Footer: YouTube link + attribution */}
        <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('council_youtube_clicked', {
                meetingDate: meeting.meetingDate,
                videoId: meeting.videoId
              })}
            >
              Watch the full meeting
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <div className="text-right space-y-1">
            <p className="text-[11px] text-muted-foreground/60 italic">
              Recap generated by SUX, the Siouxland AI Assistant.
            </p>
            <p className="text-[10px] text-muted-foreground/40 max-w-xs ml-auto">
              This recap is AI-generated from the official meeting transcript. While we strive for accuracy, please verify important details before acting on them.
            </p>
            {meeting.version > 1 && (
              <p className="text-[10px] text-muted-foreground/40">
                Version {meeting.version}
              </p>
            )}
          </div>
        </footer>
      </div>

      <MobileNavigation />
    </main>
  )
}
