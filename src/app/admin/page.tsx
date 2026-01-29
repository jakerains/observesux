'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Clock,
  Wrench,
  User,
  Bot,
  ChevronLeft,
  RefreshCw,
  Search,
  BarChart3,
  Calendar,
  Zap,
  TrendingUp,
  Lock,
  Loader2,
  Database,
  Settings,
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  Fuel,
  CheckCircle2,
  XCircle,
  Play,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ShieldX,
  Users,
  Newspaper,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { RagAdmin } from '@/components/rag/RagAdmin'
import { UsersPanel } from '@/components/admin/UsersPanel'
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_STATUSES,
  type Suggestion,
  type SuggestionStats,
  type SuggestionStatus,
} from '@/types'
import { useSession } from '@/lib/auth/client'
import {
  getCurrentEdition,
  editionLabels,
  type Digest,
  type DigestEdition
} from '@/lib/digest/types'

// Types for chat logs
interface ChatSession {
  id: string
  startedAt: string
  endedAt: string | null
  messageCount: number
  toolCallsCount: number
  userAgent: string | null
  metadata: Record<string, unknown>
  userId: string | null
  userEmail: string | null
}

interface ChatMessage {
  id: number
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  toolCalls: string[] | null
  tokensUsed: number | null
  responseTimeMs: number | null
  createdAt: string
}

interface SessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

interface Analytics {
  totalSessions: number
  totalMessages: number
  totalToolCalls: number
  avgMessagesPerSession: number
  topTools: { tool: string; count: number }[]
}

// Access denied component for non-admin users
function AccessDenied({ reason }: { reason: 'not-logged-in' | 'not-admin' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <p className="text-sm text-muted-foreground">
            {reason === 'not-logged-in'
              ? 'You must be signed in to access the admin panel.'
              : 'Your account does not have admin privileges.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {reason === 'not-logged-in' ? (
            <Button asChild className="w-full">
              <a href="/auth/sign-in">Sign In</a>
            </Button>
          ) : (
            <p className="text-xs text-center text-muted-foreground">
              Contact an administrator if you believe this is an error.
            </p>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Chat Logs Panel Component
function ChatLogsPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionWithMessages | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSession, setLoadingSession] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chat-logs?limit=100')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/chat-logs?analytics=true&days=30')
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }, [])

  const fetchSession = useCallback(async (sessionId: string) => {
    setLoadingSession(true)
    try {
      const res = await fetch(`/api/chat-logs/${sessionId}`)
      const data = await res.json()
      setSelectedSession(data)
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoadingSession(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    fetchAnalytics()
  }, [fetchSessions, fetchAnalytics])

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true
    return session.id.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getSessionPreview = (session: ChatSession) => {
    return `${session.messageCount} messages, ${session.toolCallsCount} tool calls`
  }

  const formatToolName = (toolName: string): string => {
    const names: Record<string, string> = {
      getCitySummary: 'City Summary',
      getCurrentWeather: 'Weather',
      getWeatherAlerts: 'Alerts',
      getWeatherForecast: 'Forecast',
      getRiverLevels: 'Rivers',
      getAirQuality: 'Air Quality',
      getTrafficEvents: 'Traffic',
      getNews: 'News',
      getGasPrices: 'Gas Prices',
      getFlights: 'Flights',
      getAviationWeather: 'Aviation',
      getTransit: 'Transit',
      getOutages: 'Outages',
      getEarthquakes: 'Earthquakes',
      getSystemStatus: 'System Status',
      searchKnowledgeBase: 'Knowledge Base',
    }
    return names[toolName] || toolName
  }

  // Get device type info from session metadata
  const getDeviceInfo = (session: ChatSession) => {
    const meta = session.metadata as { deviceType?: string; viewportWidth?: number; viewportHeight?: number }
    return {
      type: meta?.deviceType || null,
      width: meta?.viewportWidth,
      height: meta?.viewportHeight,
    }
  }

  // Get device icon component
  const DeviceIcon = ({ type }: { type: string | null }) => {
    if (type === 'mobile') return <Smartphone className="h-3 w-3" />
    if (type === 'tablet') return <Tablet className="h-3 w-3" />
    if (type === 'desktop') return <Monitor className="h-3 w-3" />
    return null
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden bg-background">
      {/* Sidebar - Session List */}
      <div
        className={cn(
          'flex flex-col border-r bg-muted/30 min-h-0',
          isMobile && selectedSession ? 'hidden' : 'flex',
          isMobile ? 'w-full' : 'w-80'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Sessions</h2>
            <div className="flex gap-1">
              <Button
                variant={showAnalytics ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAnalytics(!showAnalytics)}
                title="Toggle Analytics"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSessions} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <div className="p-3 border-b bg-background/50">
            <p className="text-xs text-muted-foreground mb-2">Last 30 Days</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{analytics.totalSessions}</span>
                <span className="text-muted-foreground text-xs">sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{analytics.totalMessages}</span>
                <span className="text-muted-foreground text-xs">msgs</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{analytics.totalToolCalls}</span>
                <span className="text-muted-foreground text-xs">tools</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{analytics.avgMessagesPerSession.toFixed(1)}</span>
                <span className="text-muted-foreground text-xs">avg</span>
              </div>
            </div>
          </div>
        )}

        {/* Session List */}
        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No sessions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSessions.map((session) => {
                const device = getDeviceInfo(session)
                return (
                  <button
                    key={session.id}
                    onClick={() => fetchSession(session.id)}
                    className={cn(
                      'w-full p-3 text-left hover:bg-muted/50 transition-colors',
                      selectedSession?.id === session.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {device.type && (
                          <span className="text-muted-foreground" title={`${device.type} (${device.width}×${device.height})`}>
                            <DeviceIcon type={device.type} />
                          </span>
                        )}
                        <span className="text-sm font-medium">
                          {format(new Date(session.startedAt), 'MMM d, h:mm a')}
                        </span>
                        {session.userEmail && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <User className="h-2.5 w-2.5 mr-1" />
                            {session.userEmail.split('@')[0]}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{getSessionPreview(session)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content - Conversation View */}
      <div className={cn('flex-1 flex flex-col min-h-0', isMobile && !selectedSession && 'hidden')}>
        {selectedSession ? (
          <>
            {/* Conversation Header */}
            <div className="p-3 border-b bg-background flex items-center gap-3">
              {isMobile && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSession(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {format(new Date(selectedSession.startedAt), 'MMMM d, yyyy at h:mm a')}
                  </p>
                  {selectedSession.userEmail && (
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {selectedSession.userEmail}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {selectedSession.messageCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    {selectedSession.toolCallsCount}
                  </span>
                  {(() => {
                    const device = getDeviceInfo(selectedSession)
                    if (!device.type) return null
                    return (
                      <span className="flex items-center gap-1" title={`${device.width}×${device.height}`}>
                        <DeviceIcon type={device.type} />
                        {device.type}
                        {device.width && device.height && (
                          <span className="text-muted-foreground/70">
                            ({device.width}×{device.height})
                          </span>
                        )}
                      </span>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0 p-4">
              {loadingSession ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                      <Skeleton className="h-16 w-64 rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {selectedSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <div
                        className={cn(
                          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}
                      >
                        {message.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>

                      <div className={cn('flex-1 max-w-[80%]', message.role === 'user' ? 'text-right' : 'text-left')}>
                        <div
                          className={cn(
                            'inline-block rounded-2xl px-4 py-2',
                            message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          )}
                        >
                          <ChatMarkdown
                            content={message.content}
                            variant={message.role === 'user' ? 'user' : 'assistant'}
                          />
                        </div>

                        <div
                          className={cn(
                            'flex items-center gap-2 mt-1 text-xs text-muted-foreground',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
                          {message.responseTimeMs && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {(message.responseTimeMs / 1000).toFixed(1)}s
                              </span>
                            </>
                          )}
                        </div>

                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div
                            className={cn(
                              'flex flex-wrap gap-1 mt-1',
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {message.toolCalls.map((tool) => (
                              <Badge key={tool} variant="secondary" className="text-xs">
                                {formatToolName(tool)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a session to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Digest Panel Component
function DigestPanel() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<DigestEdition | null>(null)
  const [generatedDigest, setGeneratedDigest] = useState<Digest | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [forceRegenerate, setForceRegenerate] = useState(false)
  const [editionFilter, setEditionFilter] = useState<DigestEdition | 'all'>('all')
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    edition?: DigestEdition
    message?: string
    workflowRunId?: string
    generationTimeMs?: number
  } | null>(null)

  const editions: DigestEdition[] = ['morning', 'midday', 'evening']
  const editionIcons: Record<DigestEdition, typeof Sun> = {
    morning: Sun,
    midday: Sunset,
    evening: Moon
  }

  // Get today's date in Chicago timezone
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
  const currentEdition = getCurrentEdition()

  const fetchDigests = useCallback(async () => {
    setLoading(true)
    try {
      const activeParam = showAllVersions ? '&activeOnly=0' : ''
      const res = await fetch(`/api/user/digest?history=1&limit=30${activeParam}`)
      const data = await res.json()
      setDigests(data.digests || [])
    } catch (error) {
      console.error('Failed to fetch digests:', error)
    } finally {
      setLoading(false)
    }
  }, [showAllVersions])

  useEffect(() => {
    fetchDigests()
  }, [fetchDigests])

  const generateDigest = async (edition: DigestEdition, force: boolean = false) => {
    setGenerating(edition)
    setLastResult(null)
    setGeneratedDigest(null)
    setShowPreview(false)
    try {
      // Always generate as draft for admin preview/approval flow
      const res = await fetch('/api/user/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edition, force, draft: true })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setLastResult({
          success: true,
          edition,
          message: data.skipped
            ? `${editionLabels[edition]} already exists for today`
            : `${editionLabels[edition]} draft generated - review and approve below`,
          workflowRunId: data.workflowRunId,
          generationTimeMs: data.generationTimeMs
        })
        if (data.digest && !data.skipped) {
          setGeneratedDigest(data.digest)
          setShowPreview(true)
        }
        fetchDigests() // Refresh the list
      } else {
        setLastResult({
          success: false,
          edition,
          message: data.error || 'Failed to generate digest',
          workflowRunId: data.workflowRunId
        })
      }
    } catch (error) {
      setLastResult({
        success: false,
        edition,
        message: error instanceof Error ? error.message : 'Request failed'
      })
    } finally {
      setGenerating(null)
    }
  }

  // Approve draft - make it active
  const approveDraft = async (digestId: string) => {
    setApproving(true)
    try {
      const res = await fetch('/api/user/digest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId })
      })
      if (res.ok) {
        setLastResult({
          success: true,
          message: 'Digest approved and published!'
        })
        setShowPreview(false)
        setGeneratedDigest(null)
        fetchDigests()
      } else {
        const data = await res.json()
        setLastResult({
          success: false,
          message: data.error || 'Failed to approve digest'
        })
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve'
      })
    } finally {
      setApproving(false)
    }
  }

  // Reject draft - delete it
  const rejectDraft = async (digestId: string) => {
    setRejecting(true)
    try {
      const res = await fetch(`/api/user/digest?id=${digestId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setLastResult({
          success: true,
          message: 'Draft rejected and discarded'
        })
        setShowPreview(false)
        setGeneratedDigest(null)
        fetchDigests()
      } else {
        const data = await res.json()
        setLastResult({
          success: false,
          message: data.error || 'Failed to reject digest'
        })
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject'
      })
    } finally {
      setRejecting(false)
    }
  }

  // Get data source counts from digest snapshot
  const getDataSourceStats = (digest: Digest) => {
    const snapshot = digest.dataSnapshot as Record<string, unknown> | null
    if (!snapshot) return null

    const weather = snapshot.weather as Record<string, unknown> | null
    const stats = {
      hasWeather: !!(weather?.current),
      hasForecast: !!(weather?.forecast),
      alertCount: Array.isArray(weather?.alerts) ? weather.alerts.length : 0,
      riverCount: Array.isArray(snapshot.rivers) ? snapshot.rivers.length : 0,
      hasAirQuality: !!snapshot.airQuality,
      trafficCount: Array.isArray(snapshot.traffic) ? snapshot.traffic.length : 0,
      newsCount: Array.isArray(snapshot.news) ? snapshot.news.length : 0,
      eventCount: Array.isArray(snapshot.events) ? snapshot.events.length : 0,
      hasGasPrices: !!snapshot.gasPrices,
      hasFlights: !!snapshot.flights
    }
    return stats
  }

  // Check if an ACTIVE edition exists for today
  const hasEditionToday = (edition: DigestEdition): boolean => {
    return digests.some(d => {
      // Normalize date - always convert to YYYY-MM-DD format for comparison
      const digestDate = new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
      return d.edition === edition && digestDate === todayDate && d.isActive
    })
  }

  // Count versions for an edition today
  const getVersionCount = (edition: DigestEdition): number => {
    return digests.filter(d => {
      const digestDate = new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
      return d.edition === edition && digestDate === todayDate
    }).length
  }

  // Set a digest as active
  const setActiveDigest = async (digestId: string) => {
    try {
      const res = await fetch('/api/user/digest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId })
      })
      if (res.ok) {
        fetchDigests() // Refresh list
      }
    } catch (error) {
      console.error('Failed to set active digest:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Generate Digest</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manually generate a community digest for any edition
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Force Regenerate Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="force-regenerate" className="text-sm font-medium cursor-pointer">
                Force Regenerate
              </Label>
              <span className="text-xs text-muted-foreground">
                (Replace existing digest even if one exists for today)
              </span>
            </div>
            <Switch
              id="force-regenerate"
              checked={forceRegenerate}
              onCheckedChange={setForceRegenerate}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {editions.map((edition) => {
              const Icon = editionIcons[edition]
              const hasToday = hasEditionToday(edition)
              const isCurrentEdition = edition === currentEdition
              const isGenerating = generating === edition

              return (
                <Card
                  key={edition}
                  className={cn(
                    'relative overflow-hidden',
                    isCurrentEdition && 'ring-2 ring-primary/50'
                  )}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        edition === 'morning' && 'bg-amber-500/10',
                        edition === 'midday' && 'bg-orange-500/10',
                        edition === 'evening' && 'bg-indigo-500/10'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          edition === 'morning' && 'text-amber-500',
                          edition === 'midday' && 'text-orange-500',
                          edition === 'evening' && 'text-indigo-500'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{editionLabels[edition]}</p>
                        <p className="text-xs text-muted-foreground">
                          {edition === 'morning' && '5am - 11am'}
                          {edition === 'midday' && '11am - 4pm'}
                          {edition === 'evening' && '4pm - 5am'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hasToday ? (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not active</Badge>
                        )}
                        {getVersionCount(edition) > 0 && (
                          <Badge variant="outline" className="text-xs">
                            v{getVersionCount(edition)}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={(hasToday || forceRegenerate) ? 'outline' : 'default'}
                        onClick={() => generateDigest(edition, hasToday || forceRegenerate)}
                        disabled={generating !== null}
                        className={cn("gap-2", forceRegenerate && "border-amber-500 text-amber-600 hover:bg-amber-50")}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {forceRegenerate ? 'Force Generating...' : 'Generating...'}
                          </>
                        ) : (
                          <>
                            {forceRegenerate ? <RefreshCw className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                            {forceRegenerate ? 'Force Generate' : (hasToday ? 'Regenerate' : 'Generate')}
                          </>
                        )}
                      </Button>
                    </div>

                    {isCurrentEdition && (
                      <Badge className="absolute top-2 right-2 text-xs">Current</Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Generation Progress */}
          {generating && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="font-medium text-blue-700">Generating {editionLabels[generating]}...</span>
              </div>
              <div className="text-xs text-blue-600 space-y-1 ml-8">
                <p>• Fetching weather, forecast, and alerts from NWS...</p>
                <p>• Fetching river levels from USGS...</p>
                <p>• Fetching air quality from AirNow...</p>
                <p>• Fetching traffic events from Iowa DOT...</p>
                <p>• Fetching local news from RSS feeds...</p>
                <p>• Fetching community events...</p>
                <p>• Fetching gas prices from database...</p>
                <p>• Generating content with AI...</p>
              </div>
            </div>
          )}

          {/* Result message */}
          {lastResult && !generating && (
            <div className={cn(
              'p-4 rounded-lg text-sm',
              lastResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {lastResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={cn('font-medium', lastResult.success ? 'text-green-700' : 'text-red-700')}>
                  {lastResult.message}
                </span>
              </div>
              {lastResult.generationTimeMs && (
                <p className="text-xs text-muted-foreground ml-7">
                  Generated in {(lastResult.generationTimeMs / 1000).toFixed(1)}s
                </p>
              )}
              {lastResult.workflowRunId && (
                <p className="text-xs text-muted-foreground ml-7 font-mono">
                  Workflow: {lastResult.workflowRunId}
                </p>
              )}
            </div>
          )}

          {/* Draft Review Modal */}
          <Dialog open={showPreview && !!generatedDigest} onOpenChange={(open) => !open && setShowPreview(false)}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Review Draft - {generatedDigest?.edition ? editionLabels[generatedDigest.edition] : 'Digest'}
                  <Badge variant="outline" className="text-amber-600 border-amber-500 ml-2">
                    Draft
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Review the generated content below. Approve to publish or reject to discard.
                </DialogDescription>
              </DialogHeader>

              {generatedDigest && (
                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                  {/* Data Source Stats */}
                  {(() => {
                    const stats = getDataSourceStats(generatedDigest)
                    if (!stats) return null
                    return (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Data Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={stats.hasWeather ? 'default' : 'destructive'} className="text-xs">
                            Weather {stats.hasWeather ? '✓' : '✗'}
                          </Badge>
                          <Badge variant={stats.hasForecast ? 'default' : 'destructive'} className="text-xs">
                            Forecast {stats.hasForecast ? '✓' : '✗'}
                          </Badge>
                          <Badge variant={stats.alertCount > 0 ? 'secondary' : 'outline'} className="text-xs">
                            {stats.alertCount} Alerts
                          </Badge>
                          <Badge variant={stats.riverCount > 0 ? 'default' : 'destructive'} className="text-xs">
                            {stats.riverCount} Rivers
                          </Badge>
                          <Badge variant={stats.hasAirQuality ? 'default' : 'destructive'} className="text-xs">
                            AQI {stats.hasAirQuality ? '✓' : '✗'}
                          </Badge>
                          <Badge variant={stats.trafficCount > 0 ? 'secondary' : 'outline'} className="text-xs">
                            {stats.trafficCount} Traffic
                          </Badge>
                          <Badge variant={stats.newsCount > 0 ? 'default' : 'destructive'} className="text-xs">
                            {stats.newsCount} News
                          </Badge>
                          <Badge variant={stats.eventCount > 0 ? 'default' : 'destructive'} className="text-xs">
                            {stats.eventCount} Events
                          </Badge>
                          <Badge variant={stats.hasGasPrices ? 'default' : 'destructive'} className="text-xs">
                            Gas {stats.hasGasPrices ? '✓' : '✗'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Summary */}
                  {generatedDigest.summary && (
                    <div className="p-3 rounded-lg bg-primary/5 border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Summary (shown on dashboard):</p>
                      <div className="prose prose-sm dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold max-w-none">
                        <ChatMarkdown content={generatedDigest.summary} />
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                    <div className="p-2 bg-muted/50 border-b">
                      <p className="text-xs font-medium text-muted-foreground">Full Content:</p>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
                        <ChatMarkdown content={generatedDigest.content || ''} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Approve/Reject Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t">
                    <Button
                      variant="outline"
                      className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                      onClick={() => rejectDraft(generatedDigest.id)}
                      disabled={rejecting || approving}
                    >
                      {rejecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Reject & Discard
                        </>
                      )}
                    </Button>
                    <Button
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => approveDraft(generatedDigest.id)}
                      disabled={approving || rejecting}
                    >
                      {approving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve & Publish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Digests are auto-generated at 6:15 AM, 12:00 PM, and 6:00 PM CST</p>
            <p>• Each edition aggregates weather, news, events, traffic, and more</p>
            <p>• The dashboard widget shows the most recent digest</p>
          </div>
        </CardContent>
      </Card>

      {/* Cron Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Automated Schedule</CardTitle>
              <p className="text-sm text-muted-foreground">
                Digest cron jobs configured for this project
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg divide-y">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Morning Edition</p>
                  <p className="text-xs text-muted-foreground">/api/cron/digest</p>
                </div>
              </div>
              <Badge variant="secondary">Daily 6:15 AM CST</Badge>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sunset className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Midday Edition</p>
                  <p className="text-xs text-muted-foreground">/api/cron/digest</p>
                </div>
              </div>
              <Badge variant="secondary">Daily 12:00 PM CST</Badge>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">Evening Edition</p>
                  <p className="text-xs text-muted-foreground">/api/cron/digest</p>
                </div>
              </div>
              <Badge variant="secondary">Daily 6:00 PM CST</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Digests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Digests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  History of generated digests
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchDigests}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={editionFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setEditionFilter('all')}
              >
                All
              </Button>
              {editions.map((ed) => {
                const Icon = editionIcons[ed]
                return (
                  <Button
                    key={ed}
                    variant={editionFilter === ed ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditionFilter(ed)}
                  >
                    <Icon className="h-3 w-3" />
                    {editionLabels[ed].split(' ')[0]}
                  </Button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-versions" className="text-xs text-muted-foreground cursor-pointer">
                Show all versions
              </Label>
              <Switch
                id="show-versions"
                checked={showAllVersions}
                onCheckedChange={setShowAllVersions}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : digests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No digests generated yet</p>
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {digests
                .filter(d => editionFilter === 'all' || d.edition === editionFilter)
                .map((digest) => {
                const Icon = editionIcons[digest.edition]
                // Normalize date - handle both ISO strings and Date objects
                const digestDate = new Date(digest.date).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
                const isToday = digestDate === todayDate
                return (
                  <div key={digest.id} className={cn(
                    "p-3 flex items-center gap-3",
                    digest.isActive && "bg-green-500/5"
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      digest.edition === 'morning' && 'text-amber-500',
                      digest.edition === 'midday' && 'text-orange-500',
                      digest.edition === 'evening' && 'text-indigo-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {editionLabels[digest.edition]}
                        </p>
                        {digest.isActive && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Active
                          </Badge>
                        )}
                        {digest.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{digest.version}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate prose prose-xs dark:prose-invert prose-p:m-0 prose-p:inline max-w-none">
                        {digest.summary ? (
                          <ChatMarkdown content={digest.summary} />
                        ) : (
                          <span>No summary</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-medium">{digestDate}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(digest.createdAt), 'h:mm a')}
                        </p>
                      </div>
                      {!digest.isActive && isToday && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setActiveDigest(digest.id)}
                          title="Set as active version"
                        >
                          Set Active
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
    </div>
  )
}

// Tools Panel Component
function ToolsPanel() {
  const [gasScrapeStatus, setGasScrapeStatus] = useState<'idle' | 'running' | 'polling' | 'success' | 'error'>('idle')
  const [runId, setRunId] = useState<string | null>(null)
  const [gasScrapeResult, setGasScrapeResult] = useState<{
    stationsScraped?: number
    stationsProcessed?: number
    pricesInserted?: number
    geocoded?: number
    message?: string
    timestamp?: string
  } | null>(null)

  // Events scraper state
  const [eventsScrapeStatus, setEventsScrapeStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [eventsScrapeResult, setEventsScrapeResult] = useState<{
    eventsScraped?: number
    durationMs?: number
    message?: string
    timestamp?: string
  } | null>(null)
  const [eventsStats, setEventsStats] = useState<{
    totalEvents: number
    sourceBreakdown: Record<string, number>
    oldestEvent: string | null
    newestEvent: string | null
  } | null>(null)

  // Fetch events cache stats on mount
  useEffect(() => {
    fetch('/api/admin/events-scrape')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setEventsStats(data.stats)
        }
      })
      .catch(console.error)
  }, [])

  // Poll for workflow status
  const pollStatus = useCallback(async (workflowRunId: string) => {
    try {
      const res = await fetch(`/api/admin/gas-scrape?runId=${workflowRunId}`)
      const data = await res.json()

      if (data.status === 'completed') {
        setGasScrapeStatus('success')
        setGasScrapeResult(data.result)
        setRunId(null)
      } else if (data.status === 'failed' || data.error) {
        setGasScrapeStatus('error')
        setGasScrapeResult({ message: data.error || 'Workflow failed' })
        setRunId(null)
      }
      // If still running, continue polling (handled by useEffect)
    } catch (error) {
      console.error('Failed to poll status:', error)
    }
  }, [])

  // Poll while workflow is running
  useEffect(() => {
    if (gasScrapeStatus === 'polling' && runId) {
      const interval = setInterval(() => pollStatus(runId), 3000)
      return () => clearInterval(interval)
    }
  }, [gasScrapeStatus, runId, pollStatus])

  const runGasScrape = async () => {
    setGasScrapeStatus('running')
    setGasScrapeResult(null)

    try {
      const res = await fetch('/api/admin/gas-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (res.ok && data.runId) {
        // Workflow started - begin polling
        setRunId(data.runId)
        setGasScrapeStatus('polling')
        setGasScrapeResult({ message: `Workflow started (${data.runId.slice(0, 8)}...)` })
      } else {
        setGasScrapeStatus('error')
        setGasScrapeResult({ message: data.message || data.error || 'Unknown error' })
      }
    } catch (error) {
      setGasScrapeStatus('error')
      setGasScrapeResult({ message: error instanceof Error ? error.message : 'Request failed' })
    }
  }

  const runEventsScrape = async () => {
    setEventsScrapeStatus('running')
    setEventsScrapeResult(null)

    try {
      const res = await fetch('/api/admin/events-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setEventsScrapeStatus('success')
        setEventsScrapeResult({
          eventsScraped: data.eventsScraped,
          durationMs: data.durationMs,
          message: data.message,
          timestamp: data.timestamp
        })
        // Refresh stats
        const statsRes = await fetch('/api/admin/events-scrape')
        const statsData = await statsRes.json()
        if (statsData.success && statsData.stats) {
          setEventsStats(statsData.stats)
        }
      } else {
        setEventsScrapeStatus('error')
        setEventsScrapeResult({ message: data.error || 'Unknown error' })
      }
    } catch (error) {
      setEventsScrapeStatus('error')
      setEventsScrapeResult({ message: error instanceof Error ? error.message : 'Request failed' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Gas Prices Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Fuel className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Gas Prices Scraper</CardTitle>
              <p className="text-sm text-muted-foreground">
                Scrape current gas prices from GasBuddy via Firecrawl
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={runGasScrape}
              disabled={gasScrapeStatus === 'running'}
              className="gap-2"
            >
              {gasScrapeStatus === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Scrape Now
                </>
              )}
            </Button>

            {gasScrapeStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Success</span>
              </div>
            )}

            {gasScrapeStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Failed</span>
              </div>
            )}
          </div>

          {gasScrapeResult && (
            <div className={cn(
              'p-3 rounded-lg text-sm',
              gasScrapeStatus === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
            )}>
              {gasScrapeStatus === 'success' ? (
                <div className="space-y-1">
                  <p><strong>{gasScrapeResult.stationsScraped}</strong> stations scraped</p>
                  <p><strong>{gasScrapeResult.pricesInserted}</strong> prices inserted</p>
                  <p className="text-xs text-muted-foreground">
                    {gasScrapeResult.timestamp && format(new Date(gasScrapeResult.timestamp), 'PPpp')}
                  </p>
                </div>
              ) : (
                <p className="text-red-600">{gasScrapeResult.message}</p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Automatic scrape runs daily at 6:00 AM CST</p>
            <p>• Uses Firecrawl to parse GasBuddy data</p>
            <p>• New stations are automatically geocoded</p>
          </div>
        </CardContent>
      </Card>

      {/* Community Events Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <CalendarDays className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Community Events Scraper</CardTitle>
              <p className="text-sm text-muted-foreground">
                Scrape events from Explore Siouxland and Hard Rock Casino via Firecrawl
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cache Stats */}
          {eventsStats && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{eventsStats.totalEvents} events cached</span>
                {eventsStats.newestEvent && (
                  <span className="text-xs text-muted-foreground">
                    Last scraped: {formatDistanceToNow(new Date(eventsStats.newestEvent), { addSuffix: true })}
                  </span>
                )}
              </div>
              {Object.keys(eventsStats.sourceBreakdown).length > 0 && (
                <div className="flex gap-2">
                  {Object.entries(eventsStats.sourceBreakdown).map(([source, count]) => (
                    <Badge key={source} variant="secondary" className="text-xs">
                      {source}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={runEventsScrape}
              disabled={eventsScrapeStatus === 'running'}
              className="gap-2"
            >
              {eventsScrapeStatus === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Scrape Events Now
                </>
              )}
            </Button>

            {eventsScrapeStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Success</span>
              </div>
            )}

            {eventsScrapeStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Failed</span>
              </div>
            )}
          </div>

          {eventsScrapeResult && (
            <div className={cn(
              'p-3 rounded-lg text-sm',
              eventsScrapeStatus === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
            )}>
              {eventsScrapeStatus === 'success' ? (
                <div className="space-y-1">
                  <p><strong>{eventsScrapeResult.eventsScraped}</strong> events scraped</p>
                  {eventsScrapeResult.durationMs && (
                    <p className="text-xs text-muted-foreground">
                      Completed in {(eventsScrapeResult.durationMs / 1000).toFixed(1)}s
                    </p>
                  )}
                  {eventsScrapeResult.message && (
                    <p className="text-xs text-muted-foreground">{eventsScrapeResult.message}</p>
                  )}
                </div>
              ) : (
                <p className="text-red-600">{eventsScrapeResult.message}</p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Events are cached for 7 days to reduce API calls</p>
            <p>• Uses Firecrawl v2 with JavaScript rendering</p>
            <p>• Sources: Explore Siouxland, Hard Rock Casino</p>
          </div>
        </CardContent>
      </Card>

      {/* Cron Schedule Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Scheduled Tasks</CardTitle>
              <p className="text-sm text-muted-foreground">
                Vercel Cron jobs configured for this project
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg divide-y">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Gas Price Scrape</p>
                  <p className="text-xs text-muted-foreground">/api/cron/gas-prices</p>
                </div>
              </div>
              <Badge variant="secondary">Daily 6:00 AM CST</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Suggestions Panel Component
function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<SuggestionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all'
        ? '/api/suggestions?limit=100'
        : `/api/suggestions?status=${statusFilter}&limit=100`

      const res = await fetch(url)

      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/suggestions?stats=true')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions()
    fetchStats()
  }, [fetchSuggestions, fetchStats])

  const handleStatusChange = async (id: string, newStatus: SuggestionStatus) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // Update local state
        setSuggestions(prev =>
          prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
        )
        // Refresh stats
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getCategoryInfo = (category: string) => {
    return SUGGESTION_CATEGORIES.find(c => c.value === category) || { label: category, icon: '💬' }
  }

  const getStatusInfo = (status: string) => {
    return SUGGESTION_STATUSES.find(s => s.value === status) || { label: status, color: 'bg-gray-500' }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'pending' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="text-2xl font-bold">{stats.pending}</div>
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'reviewed' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'reviewed' ? 'all' : 'reviewed')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="text-2xl font-bold">{stats.reviewed}</div>
              </div>
              <p className="text-xs text-muted-foreground">Reviewed</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'planned' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'planned' ? 'all' : 'planned')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <div className="text-2xl font-bold">{stats.planned}</div>
              </div>
              <p className="text-xs text-muted-foreground">Planned</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'implemented' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'implemented' ? 'all' : 'implemented')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="text-2xl font-bold">{stats.implemented}</div>
              </div>
              <p className="text-xs text-muted-foreground">Implemented</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'dismissed' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'dismissed' ? 'all' : 'dismissed')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <div className="text-2xl font-bold">{stats.dismissed}</div>
              </div>
              <p className="text-xs text-muted-foreground">Dismissed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">
            {statusFilter === 'all' ? 'All Suggestions' : `${getStatusInfo(statusFilter).label} Suggestions`}
          </h2>
          <Badge variant="secondary">{suggestions.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSuggestions}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No suggestions found</p>
          </div>
        ) : (
          <div className="divide-y">
            {suggestions.map((suggestion) => {
              const categoryInfo = getCategoryInfo(suggestion.category)
              const statusInfo = getStatusInfo(suggestion.status)
              const isExpanded = expandedId === suggestion.id

              return (
                <div key={suggestion.id} className="bg-background">
                  {/* Summary Row */}
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                  >
                    <span className="text-xl" title={categoryInfo.label}>
                      {categoryInfo.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{suggestion.title}</span>
                        <Badge variant="outline" className="shrink-0">
                          {categoryInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                        {suggestion.email && ` • ${suggestion.email}`}
                      </p>
                    </div>

                    {/* Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <div className={cn('w-2 h-2 rounded-full', statusInfo.color)} />
                          {statusInfo.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {SUGGESTION_STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status.value}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(suggestion.id, status.value)
                            }}
                            className="gap-2"
                          >
                            <div className={cn('w-2 h-2 rounded-full', status.color)} />
                            {status.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 pl-14">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">{suggestion.description}</p>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Created: {format(new Date(suggestion.createdAt), 'MMM d, yyyy at h:mm a')}
                          </span>
                          <span className="font-mono">{suggestion.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Events Panel Component
function EventsPanel() {
  const [events, setEvents] = useState<Array<{
    id: string
    title: string
    date: string
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    description?: string | null
    url?: string | null
    category: string
    status: string
    submittedBy: string
    submittedByEmail?: string | null
    adminNotes?: string | null
    createdAt: string
    updatedAt: string
  }>>([])
  const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all'
        ? '/api/events/submissions?limit=100'
        : `/api/events/submissions?status=${statusFilter}&limit=100`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch event submissions:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/events/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes: adminNotes[id] }),
      })
      if (res.ok) {
        setEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
        fetchEvents() // refresh stats
      }
    } catch (error) {
      console.error('Failed to update event status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/events/submissions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id))
        fetchEvents() // refresh stats
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500 text-white">Pending</Badge>
      case 'approved': return <Badge className="bg-green-500 text-white">Approved</Badge>
      case 'rejected': return <Badge className="bg-red-500 text-white">Rejected</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'pending' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="text-2xl font-bold">{stats.pending}</div>
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'approved' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="text-2xl font-bold">{stats.approved}</div>
              </div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className={cn(statusFilter === 'rejected' && 'ring-2 ring-primary')}>
            <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="text-2xl font-bold">{stats.rejected}</div>
              </div>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">
            {statusFilter === 'all' ? 'All Submissions' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Submissions`}
          </h2>
          <Badge variant="secondary">{events.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchEvents}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Submissions List */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No event submissions found</p>
          </div>
        ) : (
          <div className="divide-y">
            {events.map((event) => {
              const isExpanded = expandedId === event.id
              const isActioning = actionLoading === event.id

              return (
                <div key={event.id} className="bg-background">
                  {/* Summary Row */}
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  >
                    <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{event.title}</span>
                        <Badge variant="outline" className="shrink-0 text-xs">{event.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.date}
                        {event.submittedByEmail && ` • ${event.submittedByEmail}`}
                        {event.createdAt && ` • ${formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}`}
                      </p>
                    </div>
                    {getStatusBadge(event.status)}
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 pl-14">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {event.location && (
                            <div><span className="text-muted-foreground">Location:</span> {event.location}</div>
                          )}
                          {event.startTime && (
                            <div><span className="text-muted-foreground">Time:</span> {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</div>
                          )}
                          {event.url && (
                            <div>
                              <span className="text-muted-foreground">URL:</span>{' '}
                              <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {event.url}
                              </a>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm whitespace-pre-wrap">{event.description}</p>
                        )}

                        {/* Admin Notes Input */}
                        <div className="space-y-2 pt-2 border-t">
                          <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
                          <Input
                            value={adminNotes[event.id] ?? (event.adminNotes || '')}
                            onChange={e => setAdminNotes(prev => ({ ...prev, [event.id]: e.target.value }))}
                            placeholder="Optional notes..."
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          {event.status !== 'approved' && (
                            <Button
                              size="sm"
                              className="gap-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusChange(event.id, 'approved')}
                              disabled={isActioning}
                            >
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              Approve
                            </Button>
                          )}
                          {event.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => handleStatusChange(event.id, 'rejected')}
                              disabled={isActioning}
                            >
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                              Reject
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-destructive hover:text-destructive ml-auto"
                            onClick={() => handleDelete(event.id)}
                            disabled={isActioning}
                          >
                            Delete
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground pt-1">
                          <span className="font-mono">{event.id.slice(0, 8)}...</span>
                          {' • Submitted by: '}{event.submittedByEmail || event.submittedBy}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Valid admin tab values
const ADMIN_TABS = ['chat-logs', 'users', 'knowledge-base', 'suggestions', 'events', 'digest', 'tools'] as const
type AdminTab = typeof ADMIN_TABS[number]

// Main Admin Page (wrapped with Suspense for useSearchParams)
export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  )
}

// Admin Page Content (uses useSearchParams)
function AdminPageContent() {
  const { data: session, isPending } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get tab from URL or default to chat-logs
  const tabParam = searchParams.get('tab')
  const activeTab: AdminTab = tabParam && ADMIN_TABS.includes(tabParam as AdminTab)
    ? (tabParam as AdminTab)
    : 'chat-logs'

  // Handle tab change - update URL
  const handleTabChange = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.push(`/admin?${params.toString()}`)
  }, [searchParams, router])

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not logged in
  if (!session?.user) {
    return <AccessDenied reason="not-logged-in" />
  }

  // Check for admin role
  const userRole = (session.user as { role?: string }).role
  if (userRole !== 'admin') {
    return <AccessDenied reason="not-admin" />
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage chat logs and knowledge base</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="chat-logs" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Logs
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="digest" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Digest
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat-logs">
            <ChatLogsPanel />
          </TabsContent>

          <TabsContent value="users">
            <UsersPanel />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <RagAdmin hideHeader />
          </TabsContent>

          <TabsContent value="suggestions">
            <SuggestionsPanel />
          </TabsContent>

          <TabsContent value="events">
            <EventsPanel />
          </TabsContent>

          <TabsContent value="digest">
            <DigestPanel />
          </TabsContent>

          <TabsContent value="tools">
            <ToolsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
