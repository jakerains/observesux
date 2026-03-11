'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Eye,
  Edit3,
  Trash2,
  Undo2,
  Redo2,
  Clock,
  Sparkles,
  PenLine,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CanvasPreview } from './CanvasPreview'
import { ExportButtons } from './ExportButtons'
import type { ContentType } from '@/lib/ai/admin-tools'
import type { HistoryEntry } from './useCanvasHistory'

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'social-post': 'Social Post',
  'press-release': 'Press Release',
  'newsletter-blurb': 'Newsletter Blurb',
  'event-announcement': 'Event Announcement',
  'council-summary': 'Council Summary',
  'free-form': 'Free Form',
}

export interface CanvasState {
  contentType: ContentType
  title: string
  body: string
}

interface CanvasProps {
  state: CanvasState
  onChange: (state: CanvasState) => void
  onClear?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  historyEntries?: HistoryEntry[]
  historyIndex?: number
  onJumpTo?: (index: number) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getHistoryIcon(label: string) {
  if (label === 'AI generated') return <Sparkles className="h-3 w-3 text-purple-500" />
  if (label === 'Manual edit') return <PenLine className="h-3 w-3 text-blue-500" />
  if (label === 'Cleared') return <Trash2 className="h-3 w-3 text-red-500" />
  return <Clock className="h-3 w-3 text-muted-foreground" />
}

export function Canvas({
  state,
  onChange,
  onClear,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  historyEntries = [],
  historyIndex = 0,
  onJumpTo,
}: CanvasProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevBodyRef = useRef(state.body)

  // When content arrives from outside (AI write), switch to preview
  useEffect(() => {
    if (state.body !== prevBodyRef.current && state.body.trim()) {
      // Only auto-switch to preview if the body changed substantially (not user typing)
      if (!isEditing) {
        setIsEditing(false)
      }
    }
    prevBodyRef.current = state.body
  }, [state.body, isEditing])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && isEditing) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, 300)}px`
    }
  }, [state.body, isEditing])

  // Focus textarea when switching to edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const wordCount = state.body.trim() ? state.body.trim().split(/\s+/).length : 0
  const charCount = state.body.length
  const hasContent = state.body.trim() || state.title.trim()

  const handleClear = () => {
    if (!hasContent) return
    if (window.confirm('Clear the canvas?')) {
      if (onClear) {
        onClear()
      } else {
        onChange({ contentType: 'free-form', title: '', body: '' })
      }
      setIsEditing(false)
    }
  }

  // If canvas is empty, always show editor
  const showingPreview = hasContent && !isEditing

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <Select
          value={state.contentType}
          onValueChange={(v) => onChange({ ...state, contentType: v as ContentType })}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          {/* Undo / Redo */}
          {onUndo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onRedo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              title="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* History */}
          {historyEntries.length > 1 && (
            <Button
              variant={showHistory ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowHistory(!showHistory)}
              aria-label="History"
              title="Version history"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Divider */}
          {(onUndo || historyEntries.length > 1) && (
            <div className="w-px h-5 bg-border mx-0.5" />
          )}

          {/* Edit / Preview toggle */}
          <Button
            variant={showingPreview ? 'ghost' : 'default'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsEditing(!isEditing)}
            disabled={!hasContent && isEditing}
          >
            {isEditing ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={handleClear}
            disabled={!hasContent}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-3 shrink-0">
        {showingPreview ? (
          <div
            className="text-lg font-semibold cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors min-h-[28px]"
            onClick={() => setIsEditing(true)}
          >
            {state.title || (
              <span className="text-muted-foreground/50">Title or headline...</span>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={state.title}
            onChange={(e) => onChange({ ...state, title: e.target.value })}
            placeholder="Title or headline..."
            className="w-full text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          />
        )}
      </div>

      {/* Body - Editor or Preview */}
      <div className="flex-1 min-h-0 overflow-auto px-4 py-2">
        {showingPreview ? (
          <div
            className="cursor-pointer group"
            onClick={() => setIsEditing(true)}
          >
            <CanvasPreview content={state.body} />
            <div className="mt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Edit3 className="h-3 w-3" />
              Click to edit
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={state.body}
            onChange={(e) => onChange({ ...state, body: e.target.value })}
            placeholder="Start writing, or ask SUX to draft something for you..."
            className="w-full min-h-[300px] bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50"
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t shrink-0 bg-muted/30">
        <div className="text-xs text-muted-foreground">
          {wordCount} words · {charCount} chars
        </div>
        <ExportButtons title={state.title} body={state.body} />
      </div>

      {/* History panel (slide-in from right) */}
      {showHistory && (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-background border-l shadow-lg flex flex-col z-10">
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Version History
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowHistory(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="py-2">
              {[...historyEntries].reverse().map((entry, reversedIdx) => {
                const realIndex = historyEntries.length - 1 - reversedIdx
                const isActive = realIndex === historyIndex
                const preview = entry.state.title || entry.state.body.slice(0, 60) || '(empty)'
                return (
                  <button
                    key={`${entry.timestamp}-${realIndex}`}
                    onClick={() => {
                      onJumpTo?.(realIndex)
                      setIsEditing(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-l-2',
                      isActive
                        ? 'border-l-primary bg-muted/30'
                        : 'border-l-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {getHistoryIcon(entry.label)}
                      <span className="text-xs font-medium">{entry.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {preview}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
