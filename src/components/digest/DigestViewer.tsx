'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Newspaper,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Timer,
  Sun,
  Sunset,
  Moon,
  ExternalLink
} from 'lucide-react'
import { editionLabels, type Digest, type DigestEdition } from '@/lib/digest/types'

interface DigestViewerProps {
  digest: Digest
  showMetadata?: boolean
  defaultExpanded?: boolean
}

const editionIcons: Record<DigestEdition, typeof Sun> = {
  morning: Sun,
  midday: Sunset,
  evening: Moon
}

export function DigestViewer({
  digest,
  showMetadata = true,
  defaultExpanded = true
}: DigestViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)

  const EditionIcon = editionIcons[digest.edition] || Newspaper

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const formatGenerationTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(digest.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <EditionIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">What You Need to Know, Siouxland</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {editionLabels[digest.edition]}
                </Badge>
                {showMetadata && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(digest.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showMetadata && digest.generationTimeMs && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Timer className="h-3 w-3" />
                {formatGenerationTime(digest.generationTimeMs)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                // Style headings
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mt-6 mb-3 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold mt-4 mb-2 text-primary">{children}</h3>
                ),
                // Style lists
                ul: ({ children }) => (
                  <ul className="my-2 space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm">{children}</li>
                ),
                // Style paragraphs
                p: ({ children }) => (
                  <p className="my-2 text-sm leading-relaxed">{children}</p>
                ),
                // Style horizontal rules
                hr: () => (
                  <hr className="my-4 border-border" />
                ),
                // Style strong/bold
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                // Style links with external indicator
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {children}
                    <ExternalLink className="h-3 w-3 inline-block ml-0.5 opacity-70" />
                  </a>
                )
              }}
            >
              {digest.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
