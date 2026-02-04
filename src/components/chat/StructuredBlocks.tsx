'use client'

import { useState } from 'react'
import { Phone, MapPin, Clock, Mail, Globe, ExternalLink, FileText, Menu, ChevronDown, UtensilsCrossed } from 'lucide-react'
import { track } from '@vercel/analytics'
import { cn } from '@/lib/utils'

/**
 * Structured data blocks that the AI can embed in responses
 * using special code block syntax like ```contact or ```hours
 */

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

interface ActionButtonProps {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  external?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Reusable action button for structured blocks
 * Provides consistent styling for CTAs across all block types
 */
export function ActionButton({
  href,
  icon,
  children,
  variant = 'secondary',
  external = false,
  className,
  onClick,
}: ActionButtonProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors'

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
      {external && <ExternalLink className="h-3 w-3 opacity-60" />}
    </a>
  )
}

// =============================================================================
// CONTACT BLOCK
// =============================================================================

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
    <div className="my-3 p-3 rounded-lg bg-muted/50 border border-border/50 not-prose overflow-hidden">
      {data.name && (
        <div className="font-semibold text-sm mb-2">{data.name}</div>
      )}
      <div className="space-y-1.5 text-sm">
        {data.phone && (
          <a
            href={`tel:${data.phone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors min-w-0"
          >
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{data.email}</span>
          </a>
        )}
        {data.website && (
          <a
            href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors min-w-0"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate min-w-0 flex-1">{data.website.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
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
      case 'restaurant':
        return <RestaurantBlock data={data} />
      case 'restaurants':
        return <RestaurantListBlock data={data} />
      default:
        return null
    }
  } catch {
    // JSON is malformed or still incomplete - return null silently during streaming
    return null
  }
}

// =============================================================================
// RESTAURANT BLOCKS
// =============================================================================

interface RestaurantData {
  name: string
  category?: string
  price_range?: '$' | '$$' | '$$$' | '$$$$'
  description?: string
  phone_number?: string
  address?: string
  menu_link?: string
  website?: string
  hours?: string
  weekly_hours?: Record<string, string>
}

interface RestaurantListData {
  title?: string
  restaurants: RestaurantData[]
}

/**
 * Price indicator showing $$$$ with filled/unfilled styling
 */
function PriceIndicator({ priceRange }: { priceRange?: string }) {
  if (!priceRange) return null

  const level = priceRange.length
  const labels: Record<number, string> = {
    1: 'Budget-friendly',
    2: 'Moderate',
    3: 'Upscale casual',
    4: 'Fine dining',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              i < level ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/30'
            )}
          >
            $
          </span>
        ))}
      </span>
      <span className="text-[10px] text-muted-foreground">{labels[level]}</span>
    </div>
  )
}

/**
 * Expandable hours section with collapsible toggle
 */
function ExpandableHours({ hours }: { hours: Record<string, string> }) {
  const [isOpen, setIsOpen] = useState(false)
  const hoursList = Object.entries(hours)

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="h-3.5 w-3.5" />
        <span>Hours</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 ml-auto transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && (
        <div className="mt-2 grid gap-1 text-xs">
          {hoursList.map(([day, time]) => (
            <div key={day} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{day}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Restaurant card - renders restaurant info with prominent menu CTA
 */
export function RestaurantBlock({ data }: { data: RestaurantData }) {
  const isPdf = data.menu_link?.toLowerCase().endsWith('.pdf')
  const hasActions = data.phone_number || data.address || data.website

  return (
    <div className="my-3 p-3 rounded-lg bg-muted/50 border border-border/50 not-prose overflow-hidden">
      {/* Header: Name + Category + Price */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{data.name}</h4>
            {data.category && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                <UtensilsCrossed className="h-2.5 w-2.5" />
                {data.category}
              </span>
            )}
          </div>
          <PriceIndicator priceRange={data.price_range} />
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
      )}

      {/* Primary CTA: Menu button (prominent, full-width) */}
      {data.menu_link && (
        <div className="mb-2">
          <ActionButton
            href={data.menu_link}
            icon={isPdf ? <FileText className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
            variant="primary"
            external
            className="w-full justify-center"
            onClick={() => track('restaurant_action_clicked', { action: 'menu', restaurant: data.name, isPdf })}
          >
            {isPdf ? 'View Menu (PDF)' : 'View Menu'}
          </ActionButton>
        </div>
      )}

      {/* Secondary actions: Call, Directions, Website */}
      {hasActions && (
        <div className="flex flex-wrap gap-2">
          {data.phone_number && (
            <ActionButton
              href={`tel:${data.phone_number.replace(/[^0-9+]/g, '')}`}
              icon={<Phone className="h-3.5 w-3.5" />}
              onClick={() => track('restaurant_action_clicked', { action: 'call', restaurant: data.name })}
            >
              Call
            </ActionButton>
          )}
          {data.address && (
            <ActionButton
              href={`https://maps.google.com/?q=${encodeURIComponent(data.address)}`}
              icon={<MapPin className="h-3.5 w-3.5" />}
              external
              onClick={() => track('restaurant_action_clicked', { action: 'directions', restaurant: data.name })}
            >
              Directions
            </ActionButton>
          )}
          {data.website && (
            <ActionButton
              href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
              icon={<Globe className="h-3.5 w-3.5" />}
              external
              onClick={() => track('restaurant_action_clicked', { action: 'website', restaurant: data.name })}
            >
              Website
            </ActionButton>
          )}
        </div>
      )}

      {/* Expandable hours */}
      {data.weekly_hours && Object.keys(data.weekly_hours).length > 0 && (
        <ExpandableHours hours={data.weekly_hours} />
      )}

      {/* Simple hours string (non-expandable) */}
      {data.hours && !data.weekly_hours && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{data.hours}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Restaurant list block - renders multiple restaurant cards
 */
export function RestaurantListBlock({ data }: { data: RestaurantListData }) {
  return (
    <div className="my-3">
      {data.title && (
        <div className="font-semibold text-sm mb-2">{data.title}</div>
      )}
      <div className="grid gap-3">
        {data.restaurants.map((restaurant, i) => (
          <RestaurantBlock key={i} data={restaurant} />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// BLOCK TYPE REGISTRY
// =============================================================================

/**
 * Structured block types the AI can use
 */
export const STRUCTURED_BLOCK_TYPES = ['contact', 'hours', 'links', 'restaurant', 'restaurants'] as const
