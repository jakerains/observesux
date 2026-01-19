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
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { RagAdmin } from '@/components/rag/RagAdmin'

// Session storage key for auth
const AUTH_KEY = 'admin-authenticated'

// Types for chat logs
interface ChatSession {
  id: string
  startedAt: string
  endedAt: string | null
  messageCount: number
  toolCallsCount: number
  userAgent: string | null
  metadata: Record<string, unknown>
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

// Password protection component
function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat-logs/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        sessionStorage.setItem(AUTH_KEY, 'true')
        onAuthenticated()
      } else {
        setError('Invalid password')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground">Enter password to access admin panel</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-destructive' : ''}
                autoFocus
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Admin'
              )}
            </Button>
          </form>
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
                <p className="font-medium text-sm">
                  {format(new Date(selectedSession.startedAt), 'MMMM d, yyyy at h:mm a')}
                </p>
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

// Main Admin Page
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('chat-logs')

  useEffect(() => {
    const isAuthed = sessionStorage.getItem(AUTH_KEY) === 'true'
    setIsAuthenticated(isAuthed)
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />
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
          </TabsList>

          <TabsContent value="chat-logs">
            <ChatLogsPanel />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <RagAdmin hideHeader />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
