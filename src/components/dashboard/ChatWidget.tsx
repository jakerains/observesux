'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useMemo, FormEvent, useState } from 'react'
import { MessageSquare, Send, Loader2, RotateCcw, Sparkles } from 'lucide-react'
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
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { getToolCardComponent } from '@/components/chat/tool-cards'
import { useChatSheet } from '@/lib/contexts/ChatContext'

// Feature flag - set NEXT_PUBLIC_CHAT_ENABLED=true to enable
const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true'

// Suggested questions for onboarding
const SUGGESTED_QUESTIONS = [
  "What's happening in Sioux City?",
  "How's the weather?",
  "Any traffic problems?",
  "Are the rivers okay?",
]

export function ChatWidget() {
  // Don't render anything if feature is disabled
  if (!CHAT_ENABLED) {
    return null
  }

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

function ChatWidgetInner() {
  const { isOpen, openChat, closeChat } = useChatSheet()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // Create transport with useMemo to avoid recreation on each render
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Clear chat history
  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <>
      {/* Floating chat button - hidden on mobile, shown on desktop */}
      <div className="hidden md:block fixed bottom-6 right-20 z-50">
        <Button
          onClick={openChat}
          size="icon"
          className={cn(
            'w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
            'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
          aria-label="Open chat assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Ask about Sioux City
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
              ? 'h-[85vh] rounded-t-2xl'
              : 'w-full sm:max-w-md h-full'
          )}
        >
          {/* Drag handle for mobile */}
          {isMobile && (
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          )}
          <SheetHeader className={cn(
            "px-4 pb-2 border-b shrink-0",
            isMobile ? "pt-1" : "pt-4"
          )}>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <SheetTitle>Sioux City Observer</SheetTitle>
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
              Ask me about weather, traffic, rivers, and more
            </SheetDescription>
          </SheetHeader>

          {/* Messages Area - min-h-0 allows flex item to shrink for scrolling */}
          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="py-4 space-y-4">
              {/* Welcome message when empty */}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👋</div>
                  <p className="text-muted-foreground mb-6">
                    Hi! I can help you with real-time info about Sioux City.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {SUGGESTED_QUESTIONS.map((question) => (
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
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="space-y-2">
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
                              className={cn(
                                'text-xs italic flex items-center gap-1',
                                message.role === 'user'
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              )}
                            >
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Checking {formatToolName(toolName)}...
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
  }
  return names[toolName] || toolName
}
