'use client'

import { useRef, useEffect, useState } from 'react'
import { Eye, Edit3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CanvasPreview } from './CanvasPreview'
import { ExportButtons } from './ExportButtons'
import type { ContentType } from '@/lib/ai/admin-tools'

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
}

export function Canvas({ state, onChange }: CanvasProps) {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && !showPreview) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, 300)}px`
    }
  }, [state.body, showPreview])

  const wordCount = state.body.trim() ? state.body.trim().split(/\s+/).length : 0
  const charCount = state.body.length

  const handleClear = () => {
    if (!state.body.trim() && !state.title.trim()) return
    if (window.confirm('Clear the canvas? This cannot be undone.')) {
      onChange({ contentType: 'free-form', title: '', body: '' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
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
          <Button
            variant={showPreview ? 'default' : 'ghost'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={handleClear}
            disabled={!state.body.trim() && !state.title.trim()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-3 shrink-0">
        <input
          type="text"
          value={state.title}
          onChange={(e) => onChange({ ...state, title: e.target.value })}
          placeholder="Title or headline..."
          className="w-full text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Body - Editor or Preview */}
      <div className="flex-1 min-h-0 overflow-auto px-4 py-2">
        {showPreview ? (
          <CanvasPreview content={state.title ? `# ${state.title}\n\n${state.body}` : state.body} />
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
    </div>
  )
}
