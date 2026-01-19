'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RagEntryForm } from './RagEntryForm'
import { RagEntryList } from './RagEntryList'
import { RagFileUpload } from './RagFileUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Database, Plus, List, Upload, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { RagEntry } from '@/types/rag'

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200, 500] as const

interface RagAdminProps {
  hideHeader?: boolean
}

export function RagAdmin({ hideHeader = false }: RagAdminProps) {
  const [entries, setEntries] = useState<RagEntry[]>([])
  const [deletedEntries, setDeletedEntries] = useState<RagEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('entries')
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)
  const [pageSize, setPageSize] = useState<number>(50)
  const [hasMore, setHasMore] = useState(false)
  const initialLoadDone = useRef(false)

  const fetchEntries = useCallback(async (limit: number) => {
    setIsLoading(true)
    try {
      // Fetch active entries with selected limit
      const activeResponse = await fetch(`/api/rag?limit=${limit}`)
      if (!activeResponse.ok) throw new Error('Failed to fetch')
      const activeData = await activeResponse.json()
      const newEntries = activeData.entries || []

      setEntries(newEntries)
      setHasMore(newEntries.length === limit)

      // Fetch deleted entries
      const allResponse = await fetch('/api/rag?includeInactive=true&limit=500')
      if (allResponse.ok) {
        const allData = await allResponse.json()
        const deleted = (allData.entries || []).filter((e: RagEntry) => !e.isActive)
        setDeletedEntries(deleted)
      }

      setError(null)
    } catch (err) {
      setError('Failed to load entries')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      fetchEntries(pageSize)
    }
  }, [fetchEntries, pageSize])

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    fetchEntries(newSize)
  }

  const handleEntryCreated = () => {
    fetchEntries(pageSize)
    setActiveTab('entries')
  }

  const handleEntryDeleted = (id: string) => {
    // Move from active to deleted
    const entry = entries.find(e => e.id === id)
    if (entry) {
      setEntries(prev => prev.filter(e => e.id !== id))
      setDeletedEntries(prev => [...prev, { ...entry, isActive: false }])
    }
  }

  const handlePermanentDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/rag/${id}?permanent=true`, { method: 'DELETE' })
      if (response.ok) {
        setDeletedEntries(prev => prev.filter(e => e.id !== id))
      }
    } catch (err) {
      console.error('Permanent delete failed:', err)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm(`Permanently delete ${deletedEntries.length} entries? This cannot be undone.`)) return

    setIsEmptyingTrash(true)
    try {
      for (const entry of deletedEntries) {
        await fetch(`/api/rag/${entry.id}?permanent=true`, { method: 'DELETE' })
      }
      setDeletedEntries([])
    } catch (err) {
      console.error('Empty trash failed:', err)
    } finally {
      setIsEmptyingTrash(false)
    }
  }

  const activeCount = entries.length
  const deletedCount = deletedEntries.length

  return (
    <div className="space-y-6">
      {/* Header - only show when not embedded */}
      {!hideHeader && (
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Knowledge Base</h1>
            </div>
            <p className="text-muted-foreground ml-11">
              Manage RAG entries that enhance the chat assistant's knowledge
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Entries ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="trash" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Trash {deletedCount > 0 && `(${deletedCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-6">
          <RagEntryList
            entries={entries}
            isLoading={isLoading}
            error={error}
            onDelete={handleEntryDeleted}
          />
          {/* Pagination Controls */}
          {!isLoading && entries.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {entries.length} entries
                {hasMore && '+'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Add Knowledge Entry</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create a new entry to enhance the assistant's knowledge about Sioux City.
              The content will be automatically embedded for semantic search.
            </p>
            <RagEntryForm onSuccess={handleEntryCreated} />
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Drop .md, .json, or .txt files to bulk import knowledge entries.
              Markdown uses the first heading as title. JSON should have title/content fields. Text files use the filename as title.
            </p>
            <RagFileUpload onSuccess={handleEntryCreated} />
          </div>
        </TabsContent>

        <TabsContent value="trash" className="mt-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Trash</h2>
                <p className="text-sm text-muted-foreground">
                  Deleted entries are hidden from the chat assistant
                </p>
              </div>
              {deletedCount > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEmptyTrash}
                  disabled={isEmptyingTrash}
                >
                  {isEmptyingTrash ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Empty Trash
                    </>
                  )}
                </Button>
              )}
            </div>

            {deletedCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Trash is empty
              </div>
            ) : (
              <RagEntryList
                entries={deletedEntries}
                isLoading={false}
                error={null}
                onDelete={handlePermanentDelete}
                isTrash
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
