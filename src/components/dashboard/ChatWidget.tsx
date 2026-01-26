'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useMemo, FormEvent, useState, useCallback } from 'react'
import { Send, Loader2, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { getToolCardComponent } from '@/components/chat/tool-cards'
import { useChatSheet } from '@/lib/contexts/ChatContext'

// Session storage key for chat session ID
const SESSION_STORAGE_KEY = 'sux-chat-session-id'
const MESSAGE_INDEX_KEY = 'sux-chat-message-index'

// Capture device info for analytics
function getDeviceInfo() {
  const width = window.innerWidth
  const height = window.innerHeight
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Determine device type based on viewport width
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (width < 768) {
    deviceType = 'mobile'
  } else if (width < 1024) {
    deviceType = 'tablet'
  }

  return {
    deviceType,
    viewportWidth: width,
    viewportHeight: height,
    isTouchDevice,
  }
}

// Fixed first question - always shown
const FIXED_QUESTION = "What's happening in Sioux City?"

// Bank of rotating questions covering different topics
const QUESTION_BANK = [
  // Weather & Environment
  "How's the weather?",
  "Any weather alerts?",
  "What's the air quality like?",
  "Are the rivers flooding?",

  // Traffic & Transit
  "Any traffic problems?",
  "How's I-29 looking?",
  "Are the buses running?",

  // Local Info & Services
  "What are City Hall's hours?",
  "How do I pay a parking ticket?",
  "Report a pothole?",
  "Who do I call about a stray animal?",

  // Food & Entertainment
  "Where should I eat tonight?",
  "Best tacos in town?",
  "Good coffee shops?",
  "Any local events coming up?",

  // General
  "Tell me about Sioux City",
  "What's the airport code?",
  "Any power outages?",
  "What's on the local news?",
]

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get random questions for display (called once per mount)
function getRandomQuestions(count: number): string[] {
  return shuffleArray(QUESTION_BANK).slice(0, count)
}

export function ChatWidget() {
  return <ChatWidgetInner />
}

// Hook to detect mobile screen size
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
    checkMobile() // Initial check
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

// Generate a UUID v4 (browser-compatible)
function generateUUID(): string {
  return crypto.randomUUID()
}

function ChatWidgetInner() {
  const { isOpen, openChat, closeChat } = useChatSheet()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // Random suggested questions - randomized on mount and when chat is cleared
  const [suggestedQuestions, setSuggestedQuestions] = useState(() => [
    FIXED_QUESTION,
    ...getRandomQuestions(3),
  ])

  // Swipe-to-close gesture handling for mobile
  const touchStartY = useRef<number | null>(null)
  const touchCurrentY = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchCurrentY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    touchCurrentY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null || touchCurrentY.current === null) return

    const deltaY = touchCurrentY.current - touchStartY.current
    // If swiped down more than 80px, close the sheet
    if (deltaY > 80) {
      closeChat()
    }

    touchStartY.current = null
    touchCurrentY.current = null
  }, [closeChat])

  // Session tracking state - using refs for stable references in transport
  const sessionIdRef = useRef<string | null>(null)
  const lastLoggedIndexRef = useRef<number>(-1)
  const deviceInfoRef = useRef<ReturnType<typeof getDeviceInfo> | null>(null)
  const deviceInfoSentRef = useRef(false)

  // Load or create session ID on mount + capture device info
  useEffect(() => {
    let stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) {
      // Generate a new session ID client-side
      stored = generateUUID()
      sessionStorage.setItem(SESSION_STORAGE_KEY, stored)
    }
    sessionIdRef.current = stored

    const storedIndex = sessionStorage.getItem(MESSAGE_INDEX_KEY)
    if (storedIndex) lastLoggedIndexRef.current = parseInt(storedIndex, 10)

    // Capture device info for analytics
    deviceInfoRef.current = getDeviceInfo()
  }, [])

  // Create transport with dynamic body that includes session tracking
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => {
      // Only send device info once per session (on first message)
      const includeDeviceInfo = !deviceInfoSentRef.current && deviceInfoRef.current
      if (includeDeviceInfo) {
        deviceInfoSentRef.current = true
      }
      return {
        sessionId: sessionIdRef.current,
        lastLoggedMessageIndex: lastLoggedIndexRef.current,
        ...(includeDeviceInfo && { deviceInfo: deviceInfoRef.current }),
      }
    },
  }), [])

  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    setMessages,
  } = useChat({
    transport,
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Update the last logged message index when messages change (for deduplication)
  useEffect(() => {
    if (messages.length > 0 && status === 'ready') {
      lastLoggedIndexRef.current = messages.length - 1
      sessionStorage.setItem(MESSAGE_INDEX_KEY, String(messages.length - 1))
    }
  }, [messages.length, status])

  // Auto-scroll to bottom when new messages arrive
  // Throttled during streaming to avoid forced reflow on every chunk
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTimeRef = useRef(0)

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastScroll = now - lastScrollTimeRef.current

    // During streaming, throttle scrolls to every 150ms to reduce reflows
    // When not streaming, scroll immediately with smooth animation
    if (status === 'streaming') {
      if (timeSinceLastScroll > 150) {
        lastScrollTimeRef.current = now
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      } else if (!scrollTimeoutRef.current) {
        // Schedule a scroll for the remaining throttle time
        scrollTimeoutRef.current = setTimeout(() => {
          lastScrollTimeRef.current = Date.now()
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
          scrollTimeoutRef.current = null
        }, 150 - timeSinceLastScroll)
      }
    } else {
      // Not streaming - scroll smoothly
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = null
      }
    }
  }, [messages, status])

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage({ text: message })
  }

  // Handle suggested question click
  const handleSuggestedQuestion = async (question: string) => {
    if (isLoading) return
    await sendMessage({ text: question })
  }

  // Clear chat history and start a new session
  const handleClearChat = () => {
    setMessages([])
    // Clear session to start fresh
    sessionIdRef.current = null
    lastLoggedIndexRef.current = -1
    deviceInfoSentRef.current = false // Reset so new session gets device info
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem(MESSAGE_INDEX_KEY)
    // Randomize suggested questions
    setSuggestedQuestions([FIXED_QUESTION, ...getRandomQuestions(3)])
  }

  return (
    <>
      {/* Floating chat button - hidden on mobile, shown on desktop */}
      <div className="hidden md:block fixed bottom-20 right-20 z-50 group">
        <button
          onClick={openChat}
          className={cn(
            'w-16 h-16 rounded-full shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-200',
            'bg-white hover:scale-105',
            'flex items-center justify-center overflow-hidden border-2 border-white/20'
          )}
          aria-label="Open chat assistant"
        >
          <Image
            src="/sux.png"
            alt="SUX - Siouxland Assistant"
            width={56}
            height={56}
            className="object-cover"
            style={{ width: 'auto', height: 'auto' }}
          />
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Ask SUX about Sioux City
          </div>
        </div>
      </div>

      {/* Chat Sheet - bottom on mobile, right on desktop */}
      <Sheet open={isOpen} onOpenChange={(open) => open ? openChat() : closeChat()}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'flex flex-col p-0 overflow-hidden',
            isMobile
              ? 'h-[calc(85vh-80px)] rounded-t-2xl !bottom-[80px]'
              : 'w-full sm:max-w-md h-full'
          )}
        >
          {/* Drag handle for mobile - swipe down to close */}
          {isMobile && (
            <div
              className="flex justify-center pt-2 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          )}
          <SheetHeader className={cn(
            "px-4 pb-2 border-b shrink-0",
            isMobile ? "pt-1" : "pt-4"
          )}>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <Image
                  src="/sux.png"
                  alt="SUX"
                  width={36}
                  height={36}
                  className="shrink-0"
                  style={{ width: 'auto', height: 'auto' }}
                />
                <SheetTitle>SUX</SheetTitle>
                <span className="text-xs text-muted-foreground font-normal">Siouxland Assistant</span>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClearChat}
                  className="h-8 w-8"
                  aria-label="Clear chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <SheetDescription>
              Weather, traffic, city services, restaurants & more
            </SheetDescription>
          </SheetHeader>

          {/* Messages Area - min-h-0 allows flex item to shrink for scrolling */}
          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="py-4 space-y-4">
              {/* Welcome message when empty */}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Image
                    src="/sux.png"
                    alt="SUX - Siouxland Assistant"
                    width={120}
                    height={120}
                    className="mx-auto mb-4"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <p className="text-muted-foreground mb-6">
                    Hey there! I&apos;m SUX, your Siouxland Assistant. Ask me anything about Sioux City!
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => handleSuggestedQuestion(question)}
                          disabled={isLoading}
                          className="text-sm px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2 transition-all duration-150 overflow-hidden',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="space-y-2 [&>*]:transition-opacity [&>*]:duration-100 overflow-hidden break-words">
                      {/* Show tool progress and results */}
                      {message.parts?.map((part, index) => {
                        if (!part.type.startsWith('tool-')) return null
                        const toolPart = part as {
                          type: string
                          state: string
                          toolCallId: string
                          output?: unknown
                          error?: string
                        }
                        const toolName = part.type.slice(5)

                        // Show loading spinner while tool is executing
                        if (toolPart.state === 'input-available' || toolPart.state === 'input-streaming') {
                          return (
                            <div
                              key={index}
                              className="text-xs py-1"
                            >
                              <TextShimmer
                                duration={1.5}
                                className="text-xs"
                              >
                                {`Searching ${formatToolName(toolName)}...`}
                              </TextShimmer>
                            </div>
                          )
                        }

                        // Render rich tool card when output is available
                        if (toolPart.state === 'output-available') {
                          const CardComponent = getToolCardComponent(toolName)
                          if (CardComponent && toolPart.output) {
                            return (
                              <div key={index} className="my-2 -mx-2">
                                <CardComponent
                                  data={toolPart.output}
                                  error={toolPart.error}
                                  state={toolPart.error ? 'error' : 'success'}
                                />
                              </div>
                            )
                          }
                        }

                        return null
                      })}

                      {/* Render markdown text */}
                      {(() => {
                        const textContent = message.parts
                          ?.filter((part) => part.type === 'text')
                          .map((part) => (part as { type: 'text'; text: string }).text)
                          .join('') || ''
                        if (!textContent.trim()) {
                          return null
                        }
                        return (
                          <ChatMarkdown
                            content={textContent}
                            variant={message.role === 'user' ? 'user' : 'assistant'}
                          />
                        )
                      })()}
                    </div>

                    {/* Empty message fallback */}
                    {(!message.parts || message.parts.length === 0) && (
                      <div className="text-muted-foreground text-sm italic">
                        ...
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2 flex items-center gap-2">
                    <span>Something went wrong.</span>
                    <button
                      onClick={() => regenerate()}
                      className="underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - shrink-0 keeps it fixed at bottom */}
          <div className="border-t p-4 shrink-0 bg-background">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Sioux City..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-full h-10 w-10 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// Helper to format tool names for display
function formatToolName(toolName: string): string {
  const names: Record<string, string> = {
    getCitySummary: 'city conditions',
    getCurrentWeather: 'weather',
    getWeatherAlerts: 'weather alerts',
    getWeatherForecast: 'forecast',
    getRiverLevels: 'river levels',
    getAirQuality: 'air quality',
    getTrafficEvents: 'traffic',
    getNews: 'news',
    getGasPrices: 'gas prices',
    getFlights: 'flights',
    getAviationWeather: 'aviation weather',
    getTransit: 'transit',
    getOutages: 'power outages',
    getEarthquakes: 'earthquakes',
    getSystemStatus: 'system status',
    searchKnowledgeBase: 'local info',
    getEvents: 'events',
    webSearch: 'realtime info',
  }
  return names[toolName] || toolName
}
