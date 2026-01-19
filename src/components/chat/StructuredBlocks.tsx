'use client'

import { Phone, MapPin, Clock, Mail, Globe, ExternalLink } from 'lucide-react'

/**
 * Structured data blocks that the AI can embed in responses
 * using special code block syntax like ```contact or ```hours
 */

interface ContactData {
  name?: string
  phone?: string
  address?: string
  email?: string
  website?: string
  hours?: string
}

/**
 * Contact card - renders phone, address, email, website, hours
 */
export function ContactBlock({ data }: { data: ContactData }) {
  return (
    <div className="my-3 p-3 rounded-lg bg-muted/50 border border-border/50 not-prose">
      {data.name && (
        <div className="font-semibold text-sm mb-2">{data.name}</div>
      )}
      <div className="space-y-1.5 text-sm">
        {data.phone && (
          <a
            href={`tel:${data.phone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{data.phone}</span>
          </a>
        )}
        {data.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(data.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-foreground hover:text-primary transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span>{data.address}</span>
          </a>
        )}
        {data.email && (
          <a
            href={`mailto:${data.email}`}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{data.email}</span>
          </a>
        )}
        {data.website && (
          <a
            href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{data.website.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        )}
        {data.hours && (
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{data.hours}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface HoursData {
  title?: string
  hours: Array<{ day: string; time: string }> | Record<string, string>
}

/**
 * Hours block - renders operating hours in a nice format
 */
export function HoursBlock({ data }: { data: HoursData }) {
  // Normalize hours to array format
  const hoursList = Array.isArray(data.hours)
    ? data.hours
    : Object.entries(data.hours).map(([day, time]) => ({ day, time }))

  return (
    <div className="my-3 p-3 rounded-lg bg-muted/50 border border-border/50 not-prose">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">{data.title || 'Hours'}</span>
      </div>
      <div className="grid gap-1 text-sm">
        {hoursList.map(({ day, time }, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{day}</span>
            <span className="font-medium">{time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface LinkListData {
  title?: string
  links: Array<{ text: string; url: string; description?: string }>
}

/**
 * Link list block - renders a list of action links
 */
export function LinkListBlock({ data }: { data: LinkListData }) {
  return (
    <div className="my-3 p-3 rounded-lg bg-muted/50 border border-border/50 not-prose">
      {data.title && (
        <div className="font-semibold text-sm mb-2">{data.title}</div>
      )}
      <div className="space-y-2">
        {data.links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 -mx-2 rounded hover:bg-muted transition-colors group"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary" />
            <div>
              <div className="text-sm font-medium group-hover:text-primary transition-colors">
                {link.text}
              </div>
              {link.description && (
                <div className="text-xs text-muted-foreground">{link.description}</div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

/**
 * Parse and render a structured block from code block content
 * Returns null during streaming when JSON is incomplete
 */
export function parseStructuredBlock(
  language: string,
  content: string
): React.ReactNode | null {
  // Don't try to parse empty or whitespace-only content
  if (!content || !content.trim()) {
    return null
  }

  // Quick check: valid JSON objects must start with { and end with }
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    // Still streaming - return null silently
    return null
  }

  // Check for balanced braces (simple heuristic for complete JSON)
  let braceCount = 0
  for (const char of trimmed) {
    if (char === '{') braceCount++
    if (char === '}') braceCount--
  }
  if (braceCount !== 0) {
    // Unbalanced braces - still streaming
    return null
  }

  try {
    const data = JSON.parse(trimmed)

    switch (language) {
      case 'contact':
        return <ContactBlock data={data} />
      case 'hours':
        return <HoursBlock data={data} />
      case 'links':
        return <LinkListBlock data={data} />
      default:
        return null
    }
  } catch {
    // JSON is malformed or still incomplete - return null silently during streaming
    return null
  }
}

/**
 * Structured block types the AI can use
 */
export const STRUCTURED_BLOCK_TYPES = ['contact', 'hours', 'links'] as const
