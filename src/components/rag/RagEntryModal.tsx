'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Calendar, Tag, Link as LinkIcon } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { RagEntry } from '@/types/rag'

interface RagEntryModalProps {
  entry: RagEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RagEntryModal({ entry, open, onOpenChange }: RagEntryModalProps) {
  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl leading-tight">
                {entry.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Added {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Metadata row */}
        <div className="flex flex-wrap gap-2 py-3 border-y shrink-0">
          {entry.category && (
            <Badge variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              {entry.category}
            </Badge>
          )}
          {entry.tags && entry.tags.length > 0 && (
            entry.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          )}
          {entry.source && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <LinkIcon className="h-3 w-3" />
              {entry.source}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="prose prose-sm dark:prose-invert max-w-none py-4 pr-4">
              {entry.content.split('\n').map((paragraph, idx) => (
                paragraph.trim() ? (
                  <p key={idx} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ) : (
                  <br key={idx} />
                )
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t text-xs text-muted-foreground shrink-0">
          {entry.content.length.toLocaleString()} characters
          {!entry.isActive && (
            <span className="ml-2 text-destructive">(Deleted)</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
