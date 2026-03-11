'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CanvasPreviewProps {
  content: string
}

export function CanvasPreview({ content }: CanvasPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Preview will appear here...
      </div>
    )
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
