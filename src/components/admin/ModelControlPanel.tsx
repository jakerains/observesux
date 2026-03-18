'use client'

import { useState, useEffect, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  Cpu,
  Send,
  Loader2,
  Check,
  RotateCcw,
  MessageCircle,
  Newspaper,
  Landmark,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMarkdown } from '@/components/dashboard/ChatMarkdown'
import { getToolCardComponent } from '@/components/chat/tool-cards'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ModelCombobox } from '@/components/admin/ModelCombobox'
import {
  AVAILABLE_MODELS,
  MODEL_CONTEXTS,
  DEFAULT_MODEL,
  type ModelContext,
} from '@/lib/ai/model-config'
import { formatToolName } from '@/lib/ai/tool-display-names'

// ---------------------------------------------------------------------------
// Section A: Model Configuration
// ---------------------------------------------------------------------------

type ModelSettings = Record<string, string>

function ModelConfigSection() {
  const [settings, setSettings] = useState<ModelSettings>({})
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  // Track original settings for dirty detection
  const [originalSettings, setOriginalSettings] = useState<ModelSettings>({})

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data = await res.json()
        // data is an array of { key, value } or an object — handle both
        const map: ModelSettings = {}
        if (Array.isArray(data)) {
          for (const item of data) {
            map[item.key] = item.value
          }
        } else if (typeof data === 'object' && data !== null) {
          Object.assign(map, data)
        }
        setSettings(map)
        setOriginalSettings(map)
      } catch {
        console.error('Failed to load model settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  function getModelForContext(ctx: ModelContext): string {
    const key = `model:${ctx}`
    return settings[key] ?? DEFAULT_MODEL
  }

  function handleModelChange(ctx: ModelContext, value: string) {
    const key = `model:${ctx}`
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
  }

  const isDirty = Object.keys(settings).some(
    (key) => settings[key] !== originalSettings[key]
  ) || MODEL_CONTEXTS.some((ctx) => {
    const key = `model:${ctx.id}`
    return (settings[key] ?? DEFAULT_MODEL) !== (originalSettings[key] ?? DEFAULT_MODEL)
  })

  async function handleSave() {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const promises = MODEL_CONTEXTS.map(async (ctx) => {
        const key = `model:${ctx.id}`
        const current = settings[key] ?? DEFAULT_MODEL
        const original = originalSettings[key] ?? DEFAULT_MODEL
        if (current !== original) {
          const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: current }),
          })
          if (!res.ok) throw new Error(`Failed to save ${key}`)
        }
      })
      await Promise.all(promises)
      setOriginalSettings({ ...settings })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const contextIcons: Record<string, React.ReactNode> = {
    chat: <MessageCircle className="h-4 w-4" />,
    digest: <Newspaper className="h-4 w-4" />,
    council: <Landmark className="h-4 w-4" />,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Model Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Assign AI models to each feature. Changes take effect on next request.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'error' && (
            <span className="text-xs text-destructive">Save failed</span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            size="sm"
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODEL_CONTEXTS.map((ctx) => (
          <div
            key={ctx.id}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary">
                {contextIcons[ctx.id] ?? <Cpu className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">{ctx.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{ctx.description}</p>
              </div>
            </div>
            <ModelCombobox
              value={getModelForContext(ctx.id)}
              onChange={(model) => handleModelChange(ctx.id, model)}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section B: A/B/C Testing Playground
// ---------------------------------------------------------------------------

const PANEL_COLORS = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-purple-500',
} as const

type PanelId = 'A' | 'B' | 'C'

interface PlaygroundPanelHandle {
  sendMessage: (msg: { text: string }) => Promise<void>
  clearMessages: () => void
}

const PlaygroundPanel = forwardRef<PlaygroundPanelHandle, {
  panelId: PanelId
  model: string
  onModelChange: (model: string) => void
}>(function PlaygroundPanel({ panelId, model, onModelChange }, ref) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const modelRef = useRef(model)
  modelRef.current = model

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/admin/playground',
        body: () => ({ model: modelRef.current }),
      }),
    []
  )

  const { messages, sendMessage, status, setMessages } = useChat({
    id: `playground-${panelId.toLowerCase()}`,
    transport,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Expose sendMessage and clearMessages to parent via ref
  useImperativeHandle(ref, () => ({
    sendMessage,
    clearMessages: () => setMessages([]),
  }), [sendMessage, setMessages])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: status === 'streaming' ? 'auto' : 'smooth' })
  }, [messages, status])

  return (
    <div data-panel-id={panelId} className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <div className={`w-3 h-3 rounded-full ${PANEL_COLORS[panelId]}`} />
        <span className="text-sm font-semibold">Panel {panelId}</span>
        <div className="ml-auto flex-1 max-w-[220px]">
          <ModelCombobox
            value={model}
            onChange={onModelChange}
            size="sm"
            className="w-full"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Send a prompt to start testing
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                message.role === 'user'
                  ? 'bg-muted text-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {/* Tool cards */}
              <div className="space-y-2">
                {message.parts?.map((part, i) => {
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
                      <div key={i} className="text-xs text-muted-foreground italic py-0.5">
                        Searching {formatToolName(toolName)}...
                      </div>
                    )
                  }

                  if (toolPart.state === 'output-available') {
                    const CardComponent = getToolCardComponent(toolName)
                    if (CardComponent && toolPart.output) {
                      return (
                        <div key={i} className="my-1 -mx-1">
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
              </div>

              {/* Markdown text */}
              {(() => {
                const textContent = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => (part as { type: 'text'; text: string }).text)
                  .join('') || ''
                if (!textContent.trim()) return null
                if (message.role === 'user') {
                  return <span className="whitespace-pre-wrap break-words">{textContent}</span>
                }
                return (
                  <ChatMarkdown
                    content={textContent}
                    variant="assistant"
                  />
                )
              })()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-3 py-1.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Shared: Model Selector for streaming panels (Digest / Council)
// Uses ModelCombobox with full OpenRouter catalog
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared: Panel Count Toggle
// ---------------------------------------------------------------------------

function PanelCountToggle({
  panelCount,
  onPanelCountChange,
}: {
  panelCount: number
  onPanelCountChange: (n: number) => void
}) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={() => onPanelCountChange(n)}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            panelCount === n
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared: Grid cols helper
// ---------------------------------------------------------------------------

function getGridCols(panelCount: number) {
  if (panelCount === 1) return 'grid-cols-1'
  if (panelCount === 2) return 'grid-cols-1 md:grid-cols-2'
  return 'grid-cols-1 md:grid-cols-3'
}

// ---------------------------------------------------------------------------
// Chat Playground (existing behavior, extracted)
// ---------------------------------------------------------------------------

function ChatPlayground() {
  const [panelCount, setPanelCount] = useState(2)
  const [models, setModels] = useState<Record<PanelId, string>>({
    A: AVAILABLE_MODELS[0].id,
    B: AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0].id,
    C: AVAILABLE_MODELS[2]?.id ?? AVAILABLE_MODELS[0].id,
  })
  const [prompt, setPrompt] = useState('')
  const [sending, setSending] = useState(false)
  const [hasSent, setHasSent] = useState(false)

  const panelARef = useRef<PlaygroundPanelHandle>(null)
  const panelBRef = useRef<PlaygroundPanelHandle>(null)
  const panelCRef = useRef<PlaygroundPanelHandle>(null)

  const panelRefMap: Record<PanelId, React.RefObject<PlaygroundPanelHandle | null>> = {
    A: panelARef,
    B: panelBRef,
    C: panelCRef,
  }

  const activePanels: PanelId[] = (['A', 'B', 'C'] as const).slice(0, panelCount)

  const handleSend = useCallback(async () => {
    const text = prompt.trim()
    if (!text) return
    setPrompt('')
    setSending(true)
    setHasSent(true)

    try {
      const promises = activePanels.map((id) => {
        const handle = panelRefMap[id].current
        if (handle) {
          return handle.sendMessage({ text })
        }
        return Promise.resolve()
      })
      await Promise.all(promises)
    } finally {
      setSending(false)
    }
  // activePanels is derived from panelCount, so include panelCount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, panelCount])

  const handleClearAll = useCallback(() => {
    for (const id of activePanels) {
      panelRefMap[id].current?.clearMessages()
    }
    setHasSent(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelCount])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="gap-1 text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear All
        </Button>
        <PanelCountToggle panelCount={panelCount} onPanelCountChange={setPanelCount} />
      </div>

      {/* Panels */}
      <div className={`grid ${getGridCols(panelCount)} gap-4`} style={{ height: '500px' }}>
        {activePanels.map((id) => (
          <PlaygroundPanel
            key={id}
            ref={panelRefMap[id]}
            panelId={id}
            model={models[id]}
            onModelChange={(model) => setModels((prev) => ({ ...prev, [id]: model }))}
          />
        ))}
      </div>

      {/* Suggestion chips */}
      {!hasSent && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "What's happening in Sioux City?",
              "Are the rivers flooding?",
              "How's the air quality today?",
              "Any weather alerts right now?",
              "What's the traffic like on I-29?",
              "Summarize today's news",
            ].map((question) => (
              <button
                key={question}
                onClick={() => {
                  setPrompt(question)
                  // Auto-send after a tick so the prompt state updates
                  setTimeout(() => {
                    setHasSent(true)
                    setSending(true)
                    const promises = activePanels.map((id) => {
                      const handle = panelRefMap[id].current
                      if (handle) return handle.sendMessage({ text: question })
                      return Promise.resolve()
                    })
                    Promise.all(promises).finally(() => {
                      setSending(false)
                      setPrompt('')
                    })
                  }, 0)
                }}
                disabled={sending}
                className="text-sm px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shared prompt input */}
      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type a prompt to send to all panels..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sending || !prompt.trim()} className="gap-2">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Digest Playground
// ---------------------------------------------------------------------------

function DigestPlayground() {
  const [panelCount, setPanelCount] = useState(2)
  const [models, setModels] = useState<Record<PanelId, string>>({
    A: AVAILABLE_MODELS[0].id,
    B: AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0].id,
    C: AVAILABLE_MODELS[2]?.id ?? AVAILABLE_MODELS[0].id,
  })
  const [edition, setEdition] = useState<'morning' | 'midday' | 'evening'>('morning')
  const [panelContent, setPanelContent] = useState<Record<PanelId, string>>({ A: '', B: '', C: '' })
  const [panelLoading, setPanelLoading] = useState<Record<PanelId, boolean>>({ A: false, B: false, C: false })
  const [panelError, setPanelError] = useState<Record<PanelId, string | null>>({ A: null, B: null, C: null })

  const activePanels: PanelId[] = (['A', 'B', 'C'] as const).slice(0, panelCount)

  async function generateForPanel(id: PanelId) {
    setPanelContent((prev) => ({ ...prev, [id]: '' }))
    setPanelLoading((prev) => ({ ...prev, [id]: true }))
    setPanelError((prev) => ({ ...prev, [id]: null }))

    try {
      const response = await fetch('/api/admin/playground/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: models[id], edition }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setPanelContent((prev) => ({ ...prev, [id]: prev[id] + chunk }))
      }
    } catch (error) {
      setPanelError((prev) => ({
        ...prev,
        [id]: error instanceof Error ? error.message : 'Unknown error',
      }))
    } finally {
      setPanelLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  function handleGenerate() {
    for (const id of activePanels) {
      generateForPanel(id)
    }
  }

  function handleClear() {
    setPanelContent({ A: '', B: '', C: '' })
    setPanelError({ A: null, B: null, C: null })
  }

  const anyLoading = activePanels.some((id) => panelLoading[id])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Edition selector */}
          <div className="flex rounded-md border overflow-hidden">
            {(['morning', 'midday', 'evening'] as const).map((ed) => (
              <button
                key={ed}
                onClick={() => setEdition(ed)}
                className={`px-3 py-1 text-sm font-medium capitalize transition-colors ${
                  edition === ed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {ed}
              </button>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={anyLoading} size="sm" className="gap-2">
            {anyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-1 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear All
          </Button>
          <PanelCountToggle panelCount={panelCount} onPanelCountChange={setPanelCount} />
        </div>
      </div>

      {/* Panels */}
      <div className={`grid ${getGridCols(panelCount)} gap-4`} style={{ height: '500px' }}>
        {activePanels.map((id) => (
          <div
            key={id}
            className="flex flex-col h-full border rounded-lg overflow-hidden bg-card"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <div className={`w-3 h-3 rounded-full ${PANEL_COLORS[id]}`} />
              <span className="text-sm font-semibold">Panel {id}</span>
              <div className="ml-auto flex-1 max-w-[200px]">
                <ModelCombobox
                  value={models[id]}
                  onChange={(model) => setModels((prev) => ({ ...prev, [id]: model }))}
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
              {panelError[id] && (
                <p className="text-sm text-destructive">{panelError[id]}</p>
              )}
              {panelLoading[id] && !panelContent[id] && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {panelContent[id] ? (
                <div className="text-sm">
                  <ChatMarkdown content={panelContent[id]} variant="assistant" />
                  {panelLoading[id] && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                  )}
                </div>
              ) : (
                !panelLoading[id] &&
                !panelError[id] && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Select an edition and click Generate
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Council Playground
// ---------------------------------------------------------------------------

interface CouncilMeeting {
  id: string
  title: string
  videoId: string
  publishedAt: string
  transcriptLength?: number
}

function CouncilPlayground() {
  const [panelCount, setPanelCount] = useState(2)
  const [models, setModels] = useState<Record<PanelId, string>>({
    A: AVAILABLE_MODELS[0].id,
    B: AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0].id,
    C: AVAILABLE_MODELS[2]?.id ?? AVAILABLE_MODELS[0].id,
  })
  const [meetings, setMeetings] = useState<CouncilMeeting[]>([])
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [meetingsError, setMeetingsError] = useState<string | null>(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('')
  const [panelContent, setPanelContent] = useState<Record<PanelId, string>>({ A: '', B: '', C: '' })
  const [panelLoading, setPanelLoading] = useState<Record<PanelId, boolean>>({ A: false, B: false, C: false })
  const [panelError, setPanelError] = useState<Record<PanelId, string | null>>({ A: null, B: null, C: null })

  const activePanels: PanelId[] = (['A', 'B', 'C'] as const).slice(0, panelCount)

  // Fetch meeting list on mount
  useEffect(() => {
    async function fetchMeetings() {
      setMeetingsLoading(true)
      setMeetingsError(null)
      try {
        const res = await fetch('/api/admin/playground/council')
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to fetch meetings' }))
          throw new Error(err.error || 'Failed to fetch meetings')
        }
        const data = await res.json()
        setMeetings(data.meetings ?? data ?? [])
      } catch (error) {
        setMeetingsError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setMeetingsLoading(false)
      }
    }
    fetchMeetings()
  }, [])

  async function generateForPanel(id: PanelId) {
    setPanelContent((prev) => ({ ...prev, [id]: '' }))
    setPanelLoading((prev) => ({ ...prev, [id]: true }))
    setPanelError((prev) => ({ ...prev, [id]: null }))

    try {
      const response = await fetch('/api/admin/playground/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: models[id], meetingId: selectedMeetingId }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate recap')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setPanelContent((prev) => ({ ...prev, [id]: prev[id] + chunk }))
      }
    } catch (error) {
      setPanelError((prev) => ({
        ...prev,
        [id]: error instanceof Error ? error.message : 'Unknown error',
      }))
    } finally {
      setPanelLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  function handleGenerate() {
    for (const id of activePanels) {
      generateForPanel(id)
    }
  }

  function handleClear() {
    setPanelContent({ A: '', B: '', C: '' })
    setPanelError({ A: null, B: null, C: null })
  }

  const anyLoading = activePanels.some((id) => panelLoading[id])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Meeting selector */}
          <div className="w-[320px]">
            {meetingsLoading ? (
              <div className="flex items-center gap-2 h-9 px-3 border rounded-md text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading meetings...
              </div>
            ) : meetingsError ? (
              <div className="flex items-center gap-2 h-9 px-3 border border-destructive rounded-md text-sm text-destructive">
                {meetingsError}
              </div>
            ) : (
              <Select
                value={selectedMeetingId}
                onValueChange={setSelectedMeetingId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a meeting..." />
                </SelectTrigger>
                <SelectContent>
                  {meetings.map((meeting) => (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[280px]">{meeting.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(meeting.publishedAt).toLocaleDateString()}
                          {meeting.transcriptLength != null && (
                            <> &middot; {Math.round(meeting.transcriptLength / 1000)}k chars</>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={anyLoading || !selectedMeetingId}
            size="sm"
            className="gap-2"
          >
            {anyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Generate Recap
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-1 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear All
          </Button>
          <PanelCountToggle panelCount={panelCount} onPanelCountChange={setPanelCount} />
        </div>
      </div>

      {/* Panels */}
      <div className={`grid ${getGridCols(panelCount)} gap-4`} style={{ height: '500px' }}>
        {activePanels.map((id) => (
          <div
            key={id}
            className="flex flex-col h-full border rounded-lg overflow-hidden bg-card"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <div className={`w-3 h-3 rounded-full ${PANEL_COLORS[id]}`} />
              <span className="text-sm font-semibold">Panel {id}</span>
              <div className="ml-auto flex-1 max-w-[200px]">
                <ModelCombobox
                  value={models[id]}
                  onChange={(model) => setModels((prev) => ({ ...prev, [id]: model }))}
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
              {panelError[id] && (
                <p className="text-sm text-destructive">{panelError[id]}</p>
              )}
              {panelLoading[id] && !panelContent[id] && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {panelContent[id] ? (
                <div className="text-sm">
                  <ChatMarkdown content={panelContent[id]} variant="assistant" />
                  {panelLoading[id] && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                  )}
                </div>
              ) : (
                !panelLoading[id] &&
                !panelError[id] && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Select a meeting and click Generate Recap
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Playground Section (tabbed: Chat / Digest / Council)
// ---------------------------------------------------------------------------

function PlaygroundSection() {
  const [testMode, setTestMode] = useState<'chat' | 'digest' | 'council'>('chat')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">A/B/C Testing Playground</h3>
          <p className="text-sm text-muted-foreground">
            Compare model responses side-by-side with the same prompt.
          </p>
        </div>
        {/* Test mode selector */}
        <div className="flex rounded-md border overflow-hidden">
          {(['chat', 'digest', 'council'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTestMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                testMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {mode === 'council' ? 'Council Recap' : mode === 'digest' ? 'Digest' : 'Chat'}
            </button>
          ))}
        </div>
      </div>

      {testMode === 'chat' && <ChatPlayground />}
      {testMode === 'digest' && <DigestPlayground />}
      {testMode === 'council' && <CouncilPlayground />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function ModelControlPanel() {
  return (
    <div className="space-y-8">
      <ModelConfigSection />
      <Separator />
      <PlaygroundSection />
    </div>
  )
}
