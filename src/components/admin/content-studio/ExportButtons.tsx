'use client'

import { useState } from 'react'
import { Copy, FileText, Code, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportButtonsProps {
  title: string
  body: string
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, '')) // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '- ')    // list markers
    .replace(/^\d+\.\s+/gm, '')      // ordered list markers
    .replace(/^>\s+/gm, '')          // blockquotes
    .replace(/---+/g, '')            // horizontal rules
    .replace(/\n{3,}/g, '\n\n')      // extra newlines
    .trim()
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  html = `<p>${html}</p>`
  html = html.replace(/<p>\s*<\/p>/g, '')
  return html
}

export function ExportButtons({ title, body }: ExportButtonsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const fullContent = title ? `# ${title}\n\n${body}` : body
  const disabled = !body.trim()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => copyToClipboard(stripMarkdown(fullContent), 'text')}
        disabled={disabled}
      >
        {copied === 'text' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <FileText className="h-3.5 w-3.5" />}
        Text
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => copyToClipboard(fullContent, 'md')}
        disabled={disabled}
      >
        {copied === 'md' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        Markdown
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => copyToClipboard(markdownToHtml(fullContent), 'html')}
        disabled={disabled}
      >
        {copied === 'html' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Code className="h-3.5 w-3.5" />}
        HTML
      </Button>
    </div>
  )
}
