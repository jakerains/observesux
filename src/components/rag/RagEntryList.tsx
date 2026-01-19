'use client'

import { RagEntryCard } from './RagEntryCard'
import { Database, Loader2 } from 'lucide-react'
import type { RagEntry } from '@/types/rag'

interface RagEntryListProps {
  entries: RagEntry[]
  isLoading: boolean
  error: string | null
  onDelete: (id: string) => void
  isTrash?: boolean
}

export function RagEntryList({ entries, isLoading, error, onDelete, isTrash = false }: RagEntryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl">
        <Database className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-1">No entries yet</h3>
        <p className="text-sm text-muted-foreground">
          Add your first knowledge entry to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <RagEntryCard
          key={entry.id}
          entry={entry}
          onDelete={onDelete}
          isTrash={isTrash}
        />
      ))}
    </div>
  )
}
