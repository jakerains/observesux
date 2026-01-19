'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Loader2, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { RagEntryModal } from './RagEntryModal'
import type { RagEntry } from '@/types/rag'

interface RagEntryCardProps {
  entry: RagEntry
  onDelete: (id: string) => void
  isTrash?: boolean
}

export function RagEntryCard({ entry, onDelete, isTrash = false }: RagEntryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening modal

    const confirmMessage = isTrash
      ? 'Permanently delete this entry? This cannot be undone.'
      : 'Move this entry to trash?'

    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      const url = isTrash
        ? `/api/rag/${entry.id}?permanent=true`
        : `/api/rag/${entry.id}`
      const response = await fetch(url, { method: 'DELETE' })
      if (response.ok) {
        onDelete(entry.id)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'rounded-xl border bg-card p-4 transition-all cursor-pointer',
          'hover:border-primary/50 hover:shadow-sm',
          !entry.isActive && 'opacity-50'
        )}
      >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{entry.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Added {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                {entry.category && ` • ${entry.category}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting || !entry.isActive}
              className="h-8 w-8 shrink-0"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {entry.content}
          </p>

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {entry.source && (
            <p className="text-xs text-muted-foreground mt-2">
              Source: {entry.source}
            </p>
          )}
        </div>
      </div>
      </div>

      <RagEntryModal
        entry={entry}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
