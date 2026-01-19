import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

/**
 * Normalize markdown content to fix common LLM output issues
 */
function normalizeMarkdown(content: string): string {
  return content
    // Fix headings stuck to previous text (e.g., "text.## Heading" → "text.\n\n## Heading")
    .replace(/([^\n])(\n?)(#{1,6}\s)/g, '$1\n\n$3')
    // Fix bold/headers stuck together (e.g., "text.**Bold**" → "text. **Bold**")
    .replace(/([.!?])(\*\*[A-Z])/g, '$1 $2')
}

const toneStyles = {
  assistant: {
    text: 'text-foreground',
    link: 'text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary/70',
    inlineCode: 'bg-foreground/5 text-foreground',
    blockCode: 'bg-foreground/5 text-foreground',
    hr: 'border-border',
    blockquote: 'border-border text-muted-foreground',
    table: 'border-border',
    tableHead: 'bg-foreground/5 text-foreground',
    tableCell: 'border-border',
  },
  user: {
    text: 'text-primary-foreground',
    link: 'text-primary-foreground underline underline-offset-4 decoration-primary-foreground/40 hover:decoration-primary-foreground/70',
    inlineCode: 'bg-primary-foreground/15 text-primary-foreground',
    blockCode: 'bg-primary-foreground/10 text-primary-foreground',
    hr: 'border-primary-foreground/30',
    blockquote: 'border-primary-foreground/30 text-primary-foreground/80',
    table: 'border-primary-foreground/30',
    tableHead: 'bg-primary-foreground/10 text-primary-foreground',
    tableCell: 'border-primary-foreground/30',
  },
} as const

type ChatMarkdownProps = {
  content: string
  className?: string
  variant?: 'assistant' | 'user'
}

export function ChatMarkdown({ content, className, variant = 'assistant' }: ChatMarkdownProps) {
  const tone = toneStyles[variant]

  return (
    <div
      className={cn(
        'text-sm leading-relaxed break-words',
        // Stabilize rendering during streaming to prevent flicker
        '[contain:content] [content-visibility:auto]',
        tone.text,
        className
      )}
      style={{
        // GPU acceleration hint for smoother updates
        willChange: 'contents',
        // Prevent font rendering shifts
        textRendering: 'optimizeSpeed',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-semibold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn('font-medium', tone.link)}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                'border-l-2 pl-3 italic my-2',
                tone.blockquote
              )}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className={cn('my-3 border-t', tone.hr)} />
          ),
          pre: ({ children }) => (
            <pre
              className={cn(
                'overflow-x-auto rounded-lg p-3 my-2 text-xs leading-relaxed',
                tone.blockCode
              )}
            >
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            // Check if this is a code block (has language class) or inline code
            const isInline = !className
            return (
              <code
                className={cn(
                  isInline
                    ? 'rounded px-1.5 py-0.5 text-[0.8em] font-mono'
                    : 'text-[0.8em] font-mono',
                  isInline ? tone.inlineCode : tone.text,
                  className
                )}
                {...props}
              >
                {children}
              </code>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className={cn('w-full border-collapse text-xs', tone.table)}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={tone.tableHead}>{children}</thead>
          ),
          th: ({ children }) => (
            <th className={cn('border px-2 py-1 text-left font-semibold', tone.tableCell)}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn('border px-2 py-1 align-top', tone.tableCell)}>
              {children}
            </td>
          ),
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}
