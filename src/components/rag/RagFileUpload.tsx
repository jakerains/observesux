'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParsedEntry {
  title: string
  content: string
  category?: string
  tags?: string[]
  source?: string
}

interface UploadResult {
  filename: string
  entriesFound: number
  entriesAdded: number
  entriesSkipped: number
  errors: string[]
}

interface RagFileUploadProps {
  onSuccess: () => void
}

interface ProgressState {
  stage: 'parsing' | 'embedding' | 'saving' | 'done'
  filename: string
  currentEntry: number
  totalEntries: number
  currentChunk?: number
  totalChunks?: number
  entryTitle?: string
}

/**
 * Parse a markdown file into RAG entries
 */
function parseMarkdown(content: string, filename: string): ParsedEntry[] {
  const entries: ParsedEntry[] = []

  // Try to extract title from first heading
  const headingMatch = content.match(/^#\s+(.+)$/m)
  const title = headingMatch ? headingMatch[1].trim() : filename.replace(/\.md$/i, '')

  // Remove the first heading from content if found
  let bodyContent = headingMatch
    ? content.replace(/^#\s+.+\n*/m, '').trim()
    : content.trim()

  // If content is very long, we might want to split by ## headings
  const sections = bodyContent.split(/^##\s+/m).filter(Boolean)

  if (sections.length > 1) {
    // Multiple sections - create an entry for each
    sections.forEach((section, idx) => {
      const lines = section.split('\n')
      const sectionTitle = idx === 0 ? title : lines[0].trim()
      const sectionContent = idx === 0 ? section.trim() : lines.slice(1).join('\n').trim()

      if (sectionContent.length > 50) {
        entries.push({
          title: sectionTitle,
          content: sectionContent,
          source: filename,
        })
      }
    })
  } else {
    // Single document
    entries.push({
      title,
      content: bodyContent,
      source: filename,
    })
  }

  return entries
}

/**
 * Parse a plain text file into a RAG entry
 */
function parseTxt(content: string, filename: string): ParsedEntry[] {
  const title = filename.replace(/\.txt$/i, '')
  return [{
    title,
    content: content.trim(),
    source: filename,
  }]
}

/**
 * Parse a JSON file into RAG entries
 */
function parseJson(content: string, filename: string): ParsedEntry[] {
  const data = JSON.parse(content)
  const entries: ParsedEntry[] = []

  // Normalize to array
  const items = Array.isArray(data) ? data : [data]

  for (const item of items) {
    if (typeof item !== 'object' || !item) continue

    // Try to find title field
    const title = item.title || item.name || item.heading || item.subject ||
                  (typeof item.id === 'string' ? item.id : null)

    // Try to find content field
    const content = item.content || item.body || item.text || item.description ||
                    item.summary || item.details

    if (!title || !content) {
      // If we can't find standard fields, try to use the whole object
      if (typeof item === 'object' && Object.keys(item).length > 0) {
        const autoTitle = Object.keys(item)[0]
        const autoContent = JSON.stringify(item, null, 2)
        entries.push({
          title: `Entry from ${filename}`,
          content: autoContent,
          source: filename,
        })
      }
      continue
    }

    entries.push({
      title: String(title),
      content: String(content),
      category: item.category || item.type,
      tags: Array.isArray(item.tags) ? item.tags :
            (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : undefined),
      source: item.source || filename,
    })
  }

  return entries
}

export function RagFileUpload({ onSuccess }: RagFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [results, setResults] = useState<UploadResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File): Promise<UploadResult> => {
    const result: UploadResult = {
      filename: file.name,
      entriesFound: 0,
      entriesAdded: 0,
      entriesSkipped: 0,
      errors: [],
    }

    try {
      // Stage 1: Parsing
      setProgress({
        stage: 'parsing',
        filename: file.name,
        currentEntry: 0,
        totalEntries: 0,
      })

      const content = await file.text()
      let entries: ParsedEntry[] = []

      if (file.name.endsWith('.md')) {
        entries = parseMarkdown(content, file.name)
      } else if (file.name.endsWith('.json')) {
        entries = parseJson(content, file.name)
      } else if (file.name.endsWith('.txt')) {
        entries = parseTxt(content, file.name)
      } else {
        result.errors.push('Unsupported file type. Use .md, .json, or .txt files.')
        return result
      }

      result.entriesFound = entries.length

      // Stage 2 & 3: Embedding and saving each entry
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]

        setProgress({
          stage: 'embedding',
          filename: file.name,
          currentEntry: i + 1,
          totalEntries: entries.length,
          entryTitle: entry.title.length > 40 ? entry.title.slice(0, 40) + '...' : entry.title,
        })

        try {
          const response = await fetch('/api/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          })

          if (response.ok) {
            const data = await response.json()
            // Check if content was chunked
            if (data.totalChunks && data.totalChunks > 1) {
              result.entriesAdded += data.totalChunks
            } else {
              result.entriesAdded++
            }
          } else if (response.status === 409) {
            // Duplicate detected - skip silently
            result.entriesSkipped++
          } else {
            const data = await response.json()
            result.errors.push(`Failed to add "${entry.title}": ${data.error || 'Unknown error'}`)
          }
        } catch (err) {
          result.errors.push(`Failed to add "${entry.title}": ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    } catch (err) {
      result.errors.push(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    return result
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setResults([])
    setProgress(null)

    const newResults: UploadResult[] = []

    for (const file of Array.from(files)) {
      const result = await processFile(file)
      newResults.push(result)
    }

    setResults(newResults)
    setIsProcessing(false)
    setProgress(null)

    // If any entries were added, refresh the list
    if (newResults.some(r => r.entriesAdded > 0)) {
      onSuccess()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          isProcessing && 'opacity-50 pointer-events-none'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.json,.txt"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {progress && (
              <div className="w-full space-y-2">
                <p className="text-sm font-medium text-center truncate">
                  {progress.filename}
                </p>
                {progress.stage === 'parsing' ? (
                  <p className="text-xs text-muted-foreground text-center">
                    Parsing file...
                  </p>
                ) : (
                  <>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{
                          width: `${(progress.currentEntry / progress.totalEntries) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Embedding entry {progress.currentEntry} of {progress.totalEntries}
                    </p>
                    {progress.entryTitle && (
                      <p className="text-xs text-muted-foreground/70 text-center truncate">
                        {progress.entryTitle}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
            {!progress && (
              <p className="text-sm text-muted-foreground">Processing files...</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports .md, .json, and .txt files
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Upload Results</h4>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {results.map((result, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-lg border p-3 text-sm',
                result.errors.length > 0 && result.entriesAdded === 0
                  ? 'border-destructive/50 bg-destructive/5'
                  : result.entriesAdded > 0
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-muted'
              )}
            >
              <div className="flex items-center gap-2">
                {result.entriesAdded > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : result.errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">{result.filename}</span>
              </div>
              <p className="text-muted-foreground mt-1 ml-6">
                Found {result.entriesFound} entries, added {result.entriesAdded}
                {result.entriesSkipped > 0 && `, skipped ${result.entriesSkipped} duplicates`}
              </p>
              {result.errors.length > 0 && (
                <ul className="text-destructive text-xs mt-2 ml-6 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
