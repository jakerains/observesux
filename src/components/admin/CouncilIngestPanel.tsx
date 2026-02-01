'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CouncilMeeting, CouncilIngestStats } from '@/types/council-meetings'

interface WorkflowOutput {
  success: boolean
  processed: number
  skipped: number
  failed: number
  noCaptions: number
  error?: string
}

const statusColors: Record<string, string> = {
  completed: 'text-green-500',
  failed: 'text-red-500',
  no_captions: 'text-yellow-500',
  processing: 'text-blue-500',
  pending: 'text-muted-foreground',
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  failed: 'destructive',
  no_captions: 'outline',
  processing: 'secondary',
  pending: 'outline',
}

export function CouncilIngestPanel() {
  const [stats, setStats] = useState<CouncilIngestStats | null>(null)
  const [meetings, setMeetings] = useState<CouncilMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [ingesting, setIngesting] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [forceReprocess, setForceReprocess] = useState(false)
  const [result, setResult] = useState<WorkflowOutput | null>(null)
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Poll for workflow status
  const pollStatus = useCallback(async (workflowRunId: string) => {
    try {
      const res = await fetch(`/api/workflow/council-ingest?runId=${workflowRunId}`)
      const data = await res.json()

      if (data.status === 'completed') {
        setIngesting(false)
        setRunId(null)
        if (data.output) {
          setResult(data.output)
        }
        fetchData() // Refresh stats
      } else if (data.status === 'failed') {
        setIngesting(false)
        setRunId(null)
        setResult({
          success: false,
          processed: 0,
          skipped: 0,
          failed: 0,
          noCaptions: 0,
          error: 'Workflow failed',
        })
      }
    } catch (error) {
      console.error('Failed to poll status:', error)
    }
  }, [fetchData])

  useEffect(() => {
    if (ingesting && runId) {
      const interval = setInterval(() => pollStatus(runId), 3000)
      return () => clearInterval(interval)
    }
  }, [ingesting, runId, pollStatus])

  const startIngestion = async () => {
    setIngesting(true)
    setResult(null)

    try {
      const res = await fetch('/api/workflow/council-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceReprocess }),
      })

      const data = await res.json()

      if (res.ok && data.workflowRunId) {
        setRunId(data.workflowRunId)
      } else {
        setIngesting(false)
        setResult({
          success: false,
          processed: 0,
          skipped: 0,
          failed: 0,
          noCaptions: 0,
          error: data.error || 'Failed to start workflow',
        })
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
                <p className="text-2xl font-bold">{stats.latestMeetingDate || '—'}</p>
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
            disabled={ingesting}
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

          {/* Progress indicator */}
          {ingesting && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="font-medium text-blue-700">Processing council meetings...</span>
              </div>
              <div className="text-xs text-blue-600 space-y-1 ml-8">
                <p className="flex items-center gap-2"><Globe className="h-3 w-3" /> Fetching YouTube RSS feed...</p>
                <p className="flex items-center gap-2"><FileText className="h-3 w-3" /> Downloading transcripts...</p>
                <p className="flex items-center gap-2"><Scissors className="h-3 w-3" /> Chunking into segments...</p>
                <p className="flex items-center gap-2"><Sparkles className="h-3 w-3" /> Generating AI recaps...</p>
                <p className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Creating embeddings...</p>
              </div>
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

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Meetings</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {meetings.map((meeting) => (
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
                            {meeting.meetingDate || 'No date'}
                          </span>
                          <Badge variant={statusBadgeVariant[meeting.status] || 'outline'} className="text-xs">
                            {meeting.status}
                          </Badge>
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
                            <p className="text-sm">{meeting.recap.summary}</p>

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

                        {meeting.videoUrl && (
                          <a
                            href={meeting.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Watch on YouTube
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
