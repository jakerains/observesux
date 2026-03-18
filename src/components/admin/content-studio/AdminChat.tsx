'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useMemo, useState, useCallback, FormEvent } from 'react'
import { Send, Loader2, RotateCcw, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { getToolCardComponent } from '@/components/chat/tool-cards'
import { ModelCombobox } from '@/components/admin/ModelCombobox'
import { formatToolName } from '@/lib/ai/tool-display-names'
import type { CanvasState } from './Canvas'

const SUGGESTED_PROMPTS = [
  'Write a social post about the latest council meeting',
  'Draft a press release about today\'s top story',
  'Summarize recent news for the newsletter',
  'Create an event announcement',
  'What topics are trending in local news?',
  'Summarize the latest council meeting',
  'Write a weather update post for today',
  'Draft a community spotlight feature',
]

function getRandomPrompts(count: number): string[] {
  const shuffled = [...SUGGESTED_PROMPTS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

interface AdminChatProps {
  canvasState: CanvasState
  onWriteToCanvas: (state: CanvasState) => void
  initialMessages?: import('ai').UIMessage[]
  onMessagesChange?: (messages: import('ai').UIMessage[]) => void
  onFirstUserMessage?: (text: string) => void
}

export function AdminChat({ canvasState, onWriteToCanvas, initialMessages, onMessagesChange, onFirstUserMessage }: AdminChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestedPrompts] = useState(() => getRandomPrompts(4))
  // Track which writeToCanvas tool calls we've already processed
  // Pre-populate from initial messages to prevent re-triggering
  const processedToolCallsRef = useRef<Set<string>>(null as unknown as Set<string>)
  if (processedToolCallsRef.current === null) {
    const ids = new Set<string>()
    if (initialMessages) {
      for (const msg of initialMessages) {
        if (msg.role !== 'assistant' || !msg.parts) continue
        for (const part of msg.parts) {
          if (!part.type.startsWith('tool-')) continue
          const toolPart = part as { type: string; toolCallId: string; state: string }
          if (part.type === 'tool-writeToCanvas' && toolPart.state === 'output-available') {
            ids.add(toolPart.toolCallId)
          }
        }
      }
    }
    processedToolCallsRef.current = ids
  }
  // Track whether we've fired the first-user-message callback
  const hasFiredFirstMessageRef = useRef(
    !!(initialMessages && initialMessages.some((m) => m.role === 'user'))
  )
  const maybeFireFirstMessage = useCallback((text: string) => {
    if (!hasFiredFirstMessageRef.current) {
      hasFiredFirstMessageRef.current = true
      onFirstUserMessage?.(text)
    }
  }, [onFirstUserMessage])

  // Use ref for canvasState so transport is created once
  const canvasStateRef = useRef(canvasState)
  canvasStateRef.current = canvasState

  // Model override — empty string means use server default
  const [selectedModel, setSelectedModel] = useState('')
  const selectedModelRef = useRef(selectedModel)
  selectedModelRef.current = selectedModel

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/admin/chat',
    body: () => ({
      canvasContent: canvasStateRef.current.body.trim() ? canvasStateRef.current : undefined,
      modelOverride: selectedModelRef.current || undefined,
    }),
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
    ...(initialMessages?.length ? { messages: initialMessages } : {}),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Detect writeToCanvas tool outputs and push to canvas
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant' || !message.parts) continue
      for (const part of message.parts) {
        if (!part.type.startsWith('tool-')) continue
        const toolPart = part as {
          type: string
          state: string
          toolCallId: string
          output?: { contentType?: string; title?: string; body?: string; sentToCanvas?: boolean }
        }
        const toolName = part.type.slice(5)
        if (
          toolName === 'writeToCanvas' &&
          toolPart.state === 'output-available' &&
          toolPart.output?.sentToCanvas &&
          !processedToolCallsRef.current.has(toolPart.toolCallId)
        ) {
          processedToolCallsRef.current.add(toolPart.toolCallId)
          onWriteToCanvas({
            contentType: (toolPart.output.contentType as CanvasState['contentType']) || 'free-form',
            title: toolPart.output.title || '',
            body: toolPart.output.body || '',
          })
        }
      }
    }
  }, [messages, onWriteToCanvas])

  // Notify parent of message changes when streaming finishes
  const prevStatusRef = useRef(status)
  useEffect(() => {
    const wasActive = prevStatusRef.current === 'streaming' || prevStatusRef.current === 'submitted'
    const isIdle = status === 'ready' || status === 'error'
    if (wasActive && isIdle && onMessagesChange) {
      onMessagesChange(messages)
    }
    prevStatusRef.current = status
  }, [status, messages, onMessagesChange])

  // Auto-scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTimeRef = useRef(0)

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastScroll = now - lastScrollTimeRef.current

    if (status === 'streaming') {
      if (timeSinceLastScroll > 150) {
        lastScrollTimeRef.current = now
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      } else if (!scrollTimeoutRef.current) {
        scrollTimeoutRef.current = setTimeout(() => {
          lastScrollTimeRef.current = Date.now()
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
          scrollTimeoutRef.current = null
        }, 150 - timeSinceLastScroll)
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = null
      }
    }
  }, [messages, status])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const message = input.trim()
    setInput('')
    maybeFireFirstMessage(message)
    await sendMessage({ text: message })
  }

  const handleSuggestedPrompt = async (prompt: string) => {
    if (isLoading) return
    maybeFireFirstMessage(prompt)
    await sendMessage({ text: prompt })
  }

  const handleClearChat = useCallback(() => {
    setMessages([])
    processedToolCallsRef.current.clear()
  }, [setMessages])

  // Extract text from an assistant message for "Send to Canvas"
  const getMessageText = (message: { parts?: Array<{ type: string; text?: string }> }): string => {
    return message.parts
      ?.filter((p) => p.type === 'text')
      .map((p) => p.text || '')
      .join('') || ''
  }

  const handleSendToCanvas = (message: { parts?: Array<{ type: string; text?: string }> }) => {
    const text = getMessageText(message)
    if (text.trim()) {
      onWriteToCanvas({
        contentType: canvasState.contentType || 'free-form',
        title: canvasState.title,
        body: text.trim(),
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <Image
          src="/sux.png"
          alt="SUX"
          width={32}
          height={32}
          className="shrink-0"
          style={{ width: 'auto', height: 'auto' }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">SUX Content Studio</h2>
          <p className="text-xs text-muted-foreground">Draft content with real Siouxland data</p>
        </div>
        <ModelCombobox
          value={selectedModel}
          onChange={setSelectedModel}
          size="sm"
          className="w-[250px]"
        />
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

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="py-4 space-y-4">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-6">
              <Image
                src="/sux.png"
                alt="SUX"
                width={80}
                height={80}
                className="mx-auto mb-3"
                style={{ width: 'auto', height: 'auto' }}
              />
              <p className="text-sm text-muted-foreground mb-4">
                I can help you create content using live Siouxland data. What would you like to draft?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
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
                  'max-w-[85%] rounded-2xl px-4 py-2 transition-all duration-150 overflow-hidden',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="space-y-2 overflow-hidden break-words">
                  {/* Tool progress and results */}
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

                    if (toolPart.state === 'input-available' || toolPart.state === 'input-streaming') {
                      return (
                        <div key={index} className="text-xs py-1">
                          <TextShimmer duration={1.5} className="text-xs">
                            {`Searching ${formatToolName(toolName)}...`}
                          </TextShimmer>
                        </div>
                      )
                    }

                    // writeToCanvas confirmation
                    if (toolName === 'writeToCanvas' && toolPart.state === 'output-available') {
                      return (
                        <div key={index} className="text-xs py-1 text-green-600 dark:text-green-400 flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Sent to canvas
                        </div>
                      )
                    }

                    // Other tool cards
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

                  {/* Text content */}
                  {(() => {
                    const textContent = message.parts
                      ?.filter((part) => part.type === 'text')
                      .map((part) => (part as { type: 'text'; text: string }).text)
                      .join('') || ''
                    if (!textContent.trim()) return null
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
                  <div className="text-muted-foreground text-sm italic">...</div>
                )}

                {/* Send to Canvas button for assistant messages */}
                {message.role === 'assistant' && status !== 'streaming' && getMessageText(message).trim() && (
                  <button
                    onClick={() => handleSendToCanvas(message)}
                    className="mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Send to Canvas
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <span>Something went wrong.</span>
                <button onClick={() => regenerate()} className="underline hover:no-underline">
                  Try again
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 shrink-0 bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SUX to create content..."
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
    </div>
  )
}
