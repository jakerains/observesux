'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  FileText,
  Scissors,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  ArrowUpDown,
  RotateCcw,
  History,
  Rss,
  Youtube,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn, markdownToHtml } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import type { CouncilMeeting, CouncilIngestStats, MeetingVersion } from '@/types/council-meetings'

interface WorkflowOutput {
  success: boolean
  processed: number
  skipped: number
  failed: number
  noCaptions: number
  error?: string
}

interface ProgressEvent {
  step: string
  message: string
  videoId?: string
  current?: number
  total?: number
  [key: string]: unknown
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  failed: 'destructive',
  no_captions: 'outline',
  processing: 'secondary',
  pending: 'outline',
}

const stepIcons: Record<string, typeof Globe> = {
  rss: Globe,
  filter: FileText,
  upsert: Database,
  transcript: FileText,
  chunk: Scissors,
  recap: Sparkles,
  embeddings: Loader2,
  store: Database,
  done: CheckCircle2,
}

export function CouncilIngestPanel() {
  const [stats, setStats] = useState<CouncilIngestStats | null>(null)
  const [meetings, setMeetings] = useState<CouncilMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [ingesting, setIngesting] = useState(false)
  const [forceReprocess, setForceReprocess] = useState(false)
  const [result, setResult] = useState<WorkflowOutput | null>(null)
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([])
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(false)
  const [retryingVideoId, setRetryingVideoId] = useState<string | null>(null)
  const [versionHistory, setVersionHistory] = useState<Record<string, MeetingVersion[]>>({})
  const [loadingVersions, setLoadingVersions] = useState<string | null>(null)
  const [showVersions, setShowVersions] = useState<string | null>(null)
  const [restoringVersion, setRestoringVersion] = useState<{ meetingId: string; version: number } | null>(null)
  const [feedVideos, setFeedVideos] = useState<Array<{
    videoId: string
    title: string
    publishedAt: string
    videoUrl: string
    dbStatus: string | null
  }> | null>(null)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/workflow/council-ingest')
      const data = await res.json()
      if (data.stats) setStats(data.stats)
      if (data.recentMeetings) setMeetings(data.recentMeetings)
    } catch (error) {
      console.error('Failed to fetch council data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true)
    try {
      const res = await fetch('/api/workflow/council-ingest?feed=true')
      const data = await res.json()
      if (data.feedVideos) setFeedVideos(data.feedVideos)
      if (data.stats) setStats(data.stats)
      if (data.recentMeetings) setMeetings(data.recentMeetings)
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoadingFeed(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Poll when any meeting has 'processing' status (e.g. after page refresh mid-ingestion)
  const hasProcessing = meetings.some(m => m.status === 'processing')
  useEffect(() => {
    if (!hasProcessing || ingesting || retryingVideoId) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [hasProcessing, ingesting, retryingVideoId, fetchData])

  // Auto-scroll progress log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progressLog])

  const startIngestion = async () => {
    setIngesting(true)
    setResult(null)
    setProgressLog([])

    try {
      const res = await fetch('/api/workflow/council-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceReprocess }),
      })

      if (!res.ok) {
        const data = await res.json()
        setIngesting(false)
        setResult({
          success: false,
          processed: 0,
          skipped: 0,
          failed: 0,
          noCaptions: 0,
          error: data.error || `HTTP ${res.status}`,
        })
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setIngesting(false)
        setResult({
          success: false,
          processed: 0,
          skipped: 0,
          failed: 0,
          noCaptions: 0,
          error: 'No response stream',
        })
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6)
          } else if (line === '' && currentEvent && currentData) {
            // End of event
            try {
              const data = JSON.parse(currentData)

              if (currentEvent === 'progress') {
                setProgressLog(prev => [...prev, data as ProgressEvent])
              } else if (currentEvent === 'error') {
                setProgressLog(prev => [
                  ...prev,
                  { step: 'error', message: `Error: ${data.message}`, videoId: data.videoId },
                ])
              } else if (currentEvent === 'complete') {
                setResult(data as WorkflowOutput)
                setIngesting(false)
                fetchData() // Refresh stats
                if (feedVideos) fetchFeed() // Refresh feed statuses
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = ''
            currentData = ''
          }
        }
      }

      // Stream ended without complete event
      if (ingesting) {
        setIngesting(false)
      }
    } catch (error) {
      setIngesting(false)
      setResult({
        success: false,
        processed: 0,
        skipped: 0,
        failed: 0,
        noCaptions: 0,
        error: error instanceof Error ? error.message : 'Request failed',
      })
    }
  }

  const retryMeeting = async (
    videoId: string,
    mode: 'full' | 'recap_only' = 'full',
    meta?: { title?: string; publishedAt?: string }
  ) => {
    setRetryingVideoId(videoId)
    setResult(null)
    setProgressLog([])

    try {
      const res = await fetch('/api/workflow/council-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, mode, ...meta }),
      })

      if (!res.ok) {
        const data = await res.json()
        setRetryingVideoId(null)
        setResult({
          success: false,
          processed: 0,
          skipped: 0,
          failed: 1,
          noCaptions: 0,
          error: data.error || `HTTP ${res.status}`,
        })
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setRetryingVideoId(null)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6)
          } else if (line === '' && currentEvent && currentData) {
            try {
              const data = JSON.parse(currentData)
              if (currentEvent === 'progress') {
                setProgressLog(prev => [...prev, data as ProgressEvent])
              } else if (currentEvent === 'error') {
                setProgressLog(prev => [
                  ...prev,
                  { step: 'error', message: `Error: ${data.message}`, videoId: data.videoId },
                ])
              } else if (currentEvent === 'complete') {
                setResult(data as WorkflowOutput)
                setRetryingVideoId(null)
                fetchData()
                if (feedVideos) fetchFeed() // Refresh feed statuses
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = ''
            currentData = ''
          }
        }
      }

      if (retryingVideoId) {
        setRetryingVideoId(null)
      }
    } catch (error) {
      setRetryingVideoId(null)
      setResult({
        success: false,
        processed: 0,
        skipped: 0,
        failed: 1,
        noCaptions: 0,
        error: error instanceof Error ? error.message : 'Request failed',
      })
    }
  }

  const fetchVersions = async (meetingId: string) => {
    if (versionHistory[meetingId]) {
      setShowVersions(showVersions === meetingId ? null : meetingId)
      return
    }
    setLoadingVersions(meetingId)
    try {
      const res = await fetch(`/api/council-meetings/${meetingId}/versions`)
      const data = await res.json()
      setVersionHistory(prev => ({ ...prev, [meetingId]: data.versions || [] }))
      setShowVersions(meetingId)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoadingVersions(null)
    }
  }

  const restoreVersion = async (meetingId: string, version: number) => {
    setRestoringVersion({ meetingId, version })
    try {
      const res = await fetch(`/api/council-meetings/${meetingId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      })
      const data = await res.json()
      if (data.success) {
        // Clear cached versions so they reload next time
        setVersionHistory(prev => {
          const next = { ...prev }
          delete next[meetingId]
          return next
        })
        setShowVersions(null)
        fetchData() // Refresh meeting list
      }
    } catch (error) {
      console.error('Failed to restore version:', error)
    } finally {
      setRestoringVersion(null)
    }
  }

  const latestProgress = progressLog[progressLog.length - 1]

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return format(d, 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateA = a.meetingDate ? new Date(a.meetingDate).getTime() : 0
    const dateB = b.meetingDate ? new Date(b.meetingDate).getTime() : 0
    return sortAsc ? dateA - dateB : dateB - dateA
  })

  return (
    <div className="space-y-6">
      {/* Stats + Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Council Meeting Ingestion</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingest YouTube transcripts from Sioux City Council meetings
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading stats...</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats.totalMeetings}</p>
                <p className="text-xs text-muted-foreground">Total Meetings</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{stats.completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold truncate">{formatDate(stats.latestMeetingDate)}</p>
                <p className="text-xs text-muted-foreground">Latest Meeting</p>
              </div>
              {stats.failedCount > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              )}
              {stats.noCaptionsCount > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">{stats.noCaptionsCount}</p>
                  <p className="text-xs text-muted-foreground">No Captions</p>
                </div>
              )}
              {stats.pendingCount > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-600">{stats.pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Controls */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="force-reprocess" className="text-sm font-medium cursor-pointer">
                Force Reprocess
              </Label>
              <span className="text-xs text-muted-foreground">
                (Re-ingest already completed meetings)
              </span>
            </div>
            <Switch
              id="force-reprocess"
              checked={forceReprocess}
              onCheckedChange={setForceReprocess}
            />
          </div>

          <Button
            onClick={startIngestion}
            disabled={ingesting || retryingVideoId !== null}
            className="gap-2"
          >
            {ingesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingesting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Ingestion
              </>
            )}
          </Button>

          {/* Live progress log */}
          {(ingesting || retryingVideoId) && progressLog.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="font-medium text-blue-700">
                  {latestProgress?.message || 'Processing...'}
                </span>
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="text-xs text-blue-600 space-y-1 font-mono">
                  {progressLog.map((event, i) => {
                    const Icon = stepIcons[event.step] || FileText
                    return (
                      <p key={i} className={cn(
                        'flex items-center gap-2',
                        event.step === 'error' && 'text-red-500',
                        event.step === 'done' && 'text-green-500',
                      )}>
                        <Icon className={cn(
                          'h-3 w-3 shrink-0',
                          event.step === 'embeddings' && i === progressLog.length - 1 && 'animate-spin'
                        )} />
                        {event.message}
                      </p>
                    )
                  })}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Result */}
          {result && !ingesting && (
            <div className={cn(
              'p-4 rounded-lg text-sm',
              result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Ingestion Complete' : 'Ingestion Failed'}
                </span>
              </div>
              {result.error ? (
                <p className="text-red-600 ml-7">{result.error}</p>
              ) : (
                <div className="ml-7 space-y-1 text-muted-foreground">
                  <p>{result.processed} processed, {result.skipped} skipped</p>
                  {result.failed > 0 && <p className="text-red-500">{result.failed} failed</p>}
                  {result.noCaptions > 0 && <p className="text-yellow-500">{result.noCaptions} without captions</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* YouTube Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-lg">YouTube Feed</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Videos from the Sioux City Council channel
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchFeed}
              disabled={loadingFeed}
            >
              {loadingFeed ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Rss className="h-4 w-4" />
                  Check Feed
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {feedVideos === null ? (
            <div className="text-center py-6 text-muted-foreground">
              <Rss className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click &quot;Check Feed&quot; to load the latest videos from YouTube</p>
            </div>
          ) : feedVideos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No videos found in the RSS feed</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
              {feedVideos.map((video) => {
                const isNew = video.dbStatus === null
                const isProcessable = isNew || video.dbStatus === 'failed' || video.dbStatus === 'no_captions'
                const isProcessing = video.dbStatus === 'processing' || retryingVideoId === video.videoId

                return (
                  <div
                    key={video.videoId}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      isNew && 'bg-blue-500/5 border-blue-500/20',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(video.publishedAt)}
                        </span>
                        {isNew ? (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-500/30 bg-blue-500/10">
                            New
                          </Badge>
                        ) : (
                          <Badge variant={statusBadgeVariant[video.dbStatus!] || 'outline'} className="text-xs">
                            {video.dbStatus === 'processing' && (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            )}
                            {video.dbStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Watch on YouTube"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {isProcessable && !isProcessing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={ingesting || retryingVideoId !== null}
                          onClick={() => retryMeeting(video.videoId, 'full', {
                            title: video.title,
                            publishedAt: video.publishedAt,
                          })}
                        >
                          <Play className="h-3 w-3" />
                          Process
                        </Button>
                      )}
                      {isProcessing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processing...
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Meetings</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setSortAsc(!sortAsc)}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortAsc ? 'Oldest first' : 'Newest first'}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasProcessing && !ingesting && !retryingVideoId && (
            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>A meeting is being processed in the background. Auto-refreshing every 5s...</span>
            </div>
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No meetings ingested yet</p>
              <p className="text-xs mt-1">Run ingestion to get started</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                {sortedMeetings.map((meeting) => (
                  <div key={meeting.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedMeeting(
                        expandedMeeting === meeting.id ? null : meeting.id
                      )}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(meeting.meetingDate)}
                          </span>
                          <Badge variant={statusBadgeVariant[meeting.status] || 'outline'} className="text-xs">
                            {meeting.status === 'processing' && (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            )}
                            {meeting.status}
                          </Badge>
                          {meeting.version > 1 && (
                            <Badge variant="outline" className="text-xs font-mono">
                              v{meeting.version}
                            </Badge>
                          )}
                          {meeting.chunkCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {meeting.chunkCount} chunks
                            </span>
                          )}
                        </div>
                      </div>
                      {expandedMeeting === meeting.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {expandedMeeting === meeting.id && (
                      <div className="px-3 pb-3 border-t bg-muted/20">
                        {meeting.recap && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium">{meeting.recap.summary}</p>

                            {meeting.recap.article && (
                              <details className="text-sm">
                                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
                                  Full article ({meeting.recap.article.length.toLocaleString()} chars)
                                </summary>
                                <div
                                  className="mt-2 p-4 rounded-lg bg-background border prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-semibold prose-p:leading-relaxed prose-p:text-sm prose-ul:text-sm prose-li:text-sm"
                                  dangerouslySetInnerHTML={{ __html: markdownToHtml(meeting.recap.article) }}
                                />
                              </details>
                            )}

                            {meeting.recap.topics.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Topics</p>
                                <div className="flex flex-wrap gap-1">
                                  {meeting.recap.topics.map((topic, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {meeting.recap.decisions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Decisions</p>
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                  {meeting.recap.decisions.map((decision, i) => (
                                    <li key={i} className="flex gap-1">
                                      <span className="shrink-0">•</span>
                                      <span>{decision}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {meeting.recap.publicComments.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Public Comments</p>
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                  {meeting.recap.publicComments.map((comment, i) => (
                                    <li key={i} className="flex gap-1">
                                      <span className="shrink-0">•</span>
                                      <span>{comment}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {meeting.errorMessage && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{meeting.errorMessage}</span>
                          </div>
                        )}

                        {/* Version History */}
                        {meeting.status === 'completed' && (
                          <div className="mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                fetchVersions(meeting.id)
                              }}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {loadingVersions === meeting.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <History className="h-3 w-3" />
                              )}
                              Version History
                              {showVersions === meeting.id ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>

                            {showVersions === meeting.id && versionHistory[meeting.id] && (
                              <div className="mt-2 space-y-1.5">
                                {versionHistory[meeting.id].length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic pl-4">
                                    No previous versions
                                  </p>
                                ) : (
                                  versionHistory[meeting.id].map((ver) => (
                                    <div
                                      key={ver.id}
                                      className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs"
                                    >
                                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                                        v{ver.version}
                                      </Badge>
                                      <span className="text-muted-foreground shrink-0">
                                        {formatDate(ver.createdAt)}
                                      </span>
                                      <span className="flex-1 truncate text-muted-foreground">
                                        {ver.recap?.summary
                                          ? ver.recap.summary.slice(0, 80) + (ver.recap.summary.length > 80 ? '...' : '')
                                          : 'No recap'}
                                      </span>
                                      {ver.version !== meeting.version && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs gap-1"
                                          disabled={restoringVersion !== null}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(`Restore version ${ver.version}? This will save the current recap as v${meeting.version} and replace it with v${ver.version}'s content.`)) {
                                              restoreVersion(meeting.id, ver.version)
                                            }
                                          }}
                                        >
                                          {restoringVersion?.meetingId === meeting.id && restoringVersion?.version === ver.version ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <RotateCcw className="h-3 w-3" />
                                          )}
                                          Restore
                                        </Button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-3">
                          {meeting.videoUrl && (
                            <a
                              href={meeting.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Watch on YouTube
                            </a>
                          )}
                          {retryingVideoId === meeting.videoId || meeting.status === 'processing' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              disabled
                            >
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing...
                            </Button>
                          ) : (
                            <>
                              {meeting.status === 'completed' && meeting.transcriptRaw && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1.5 text-xs"
                                  disabled={ingesting || retryingVideoId !== null}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    retryMeeting(meeting.videoId, 'recap_only')
                                  }}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Regenerate Recap
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                disabled={ingesting || retryingVideoId !== null}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  retryMeeting(meeting.videoId, 'full')
                                }}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Full Reprocess
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
