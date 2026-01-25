'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  History,
  ChevronRight,
  Loader2,
  FileText,
  AlertCircle,
  Sun,
  Sunset,
  Moon
} from 'lucide-react'
import { editionLabels, type Digest, type DigestEdition } from '@/lib/digest/types'

interface DigestHistoryProps {
  selectedDigestId?: string
  onSelectDigest: (digest: Digest) => void
  refreshTrigger?: number // Increment to trigger refresh
}

const editionIcons: Record<DigestEdition, typeof Sun> = {
  morning: Sun,
  midday: Sunset,
  evening: Moon
}

// Short labels for history list
const shortEditionLabels: Record<DigestEdition, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening'
}

export function DigestHistory({
  selectedDigestId,
  onSelectDigest,
  refreshTrigger = 0
}: DigestHistoryProps) {
  const [digests, setDigests] = useState<Digest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDigests = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/digest?history=1&limit=14')

      if (!response.ok) {
        throw new Error('Failed to fetch digest history')
      }

      const data = await response.json()
      setDigests(data.digests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDigests()
  }, [refreshTrigger])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return 'Today'
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isYesterday) {
      return 'Yesterday'
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPreview = (content: string) => {
    // Get first paragraph after any heading
    const lines = content.split('\n').filter(line => line.trim())
    for (const line of lines) {
      if (!line.startsWith('#') && !line.startsWith('-') && line.length > 10) {
        return line.slice(0, 80) + (line.length > 80 ? '...' : '')
      }
    }
    return 'No preview available'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Past Editions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Past Editions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchDigests}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Past Editions
          {digests.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({digests.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {digests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center px-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No digests yet. Generate the first one!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {digests.map(digest => {
                const EditionIcon = editionIcons[digest.edition] || FileText
                return (
                  <button
                    key={digest.id}
                    onClick={() => onSelectDigest(digest)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                      selectedDigestId === digest.id ? 'bg-muted' : ''
                    }`}
                  >
                    <EditionIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatDate(digest.date)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {shortEditionLabels[digest.edition]}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {getPreview(digest.content)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
