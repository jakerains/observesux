'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { RagAdmin } from '@/components/rag/RagAdmin'
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_STATUSES,
  type Suggestion,
  type SuggestionStats,
  type SuggestionStatus,
} from '@/types'
import { useSession } from '@/lib/auth/client'

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
          'flex flex-col border-r bg-muted/30',
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
        <ScrollArea className="flex-1">
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

// Main Admin Page
export default function AdminPage() {
  const { data: session, isPending } = useSession()
  const [activeTab, setActiveTab] = useState('chat-logs')

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="chat-logs" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Logs
            </TabsTrigger>
            <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat-logs">
            <ChatLogsPanel />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <RagAdmin hideHeader />
          </TabsContent>

          <TabsContent value="suggestions">
            <SuggestionsPanel />
          </TabsContent>

          <TabsContent value="tools">
            <ToolsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
