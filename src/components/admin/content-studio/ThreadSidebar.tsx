'use client'

import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Thread } from './useThreads'

interface ThreadSidebarProps {
  threads: Thread[]
  activeThreadId: string
  onSelectThread: (id: string) => void
  onNewThread: () => void
  onDeleteThread: (id: string) => void
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
}: ThreadSidebarProps) {
  const sorted = useMemo(() => [...threads].sort((a, b) => b.updatedAt - a.updatedAt), [threads])

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* New Thread button */}
      <div className="p-3 border-b shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={onNewThread}
        >
          <Plus className="h-3.5 w-3.5" />
          New Thread
        </Button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No threads yet
          </div>
        ) : (
          <div className="py-1">
            {sorted.map((thread) => {
              const isActive = thread.id === activeThreadId
              const messageCount = thread.messages.length
              return (
                <div
                  key={thread.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectThread(thread.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectThread(thread.id) } }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 border-l-2 transition-colors group hover:bg-muted/50 cursor-pointer',
                    isActive
                      ? 'border-l-primary bg-muted/50'
                      : 'border-l-transparent'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {thread.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(thread.updatedAt, { addSuffix: true })}
                        </span>
                        {messageCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            · {messageCount} msg{messageCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Delete button — visible on hover, but not for the only thread */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteThread(thread.id)
                      }}
                      aria-label="Delete thread"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
