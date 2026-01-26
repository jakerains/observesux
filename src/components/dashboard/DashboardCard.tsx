'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export type CardSize = 'hero' | 'primary' | 'secondary' | 'compact'
export type CardStatus = 'live' | 'stale' | 'error' | 'loading'

interface DashboardCardProps {
  title: string
  icon?: React.ReactNode
  status?: CardStatus
  lastUpdated?: Date
  className?: string
  children: React.ReactNode
  action?: React.ReactNode
  size?: CardSize
  hideStatus?: boolean
  hideTimestamp?: boolean
}

const sizeClasses: Record<CardSize, string> = {
  hero: 'card-hero bg-card',
  primary: 'card-primary bg-card',
  secondary: 'card-secondary bg-card',
  compact: 'card-compact bg-card'
}

const titleSizeClasses: Record<CardSize, string> = {
  hero: 'text-lg font-semibold',
  primary: 'text-card-title',
  secondary: 'text-sm font-medium',
  compact: 'text-sm font-medium'
}

const statusConfig = {
  live: {
    badgeClass: 'badge-live',
    label: 'Live',
    dotClass: 'bg-emerald-500'
  },
  stale: {
    badgeClass: 'badge-warning',
    label: 'Stale',
    dotClass: 'bg-amber-500'
  },
  error: {
    badgeClass: 'badge-error',
    label: 'Error',
    dotClass: 'bg-rose-500'
  },
  loading: {
    badgeClass: 'badge-info',
    label: 'Loading',
    dotClass: 'bg-sky-500'
  }
}

export function DashboardCard({
  title,
  icon,
  status = 'live',
  lastUpdated,
  className,
  children,
  action,
  size = 'secondary',
  hideStatus = false,
  hideTimestamp = false
}: DashboardCardProps) {
  const config = statusConfig[status]

  return (
    <div className={cn(
      sizeClasses[size],
      "relative overflow-hidden flex flex-col hover-lift",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-muted-foreground">
              {icon}
            </span>
          )}
          <h3 className={titleSizeClasses[size]}>{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {action}
          {!hideStatus && (
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
              config.badgeClass
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                config.dotClass,
                status === 'live' && "animate-pulse"
              )} />
              {config.label}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Timestamp */}
      {!hideTimestamp && lastUpdated && (
        <p className="text-label mt-4 pt-3 border-t border-border/50">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      )}
    </div>
  )
}

// Simplified card for compact items in lists
export function CompactCard({
  children,
  className,
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        "card-compact bg-card hover-lift cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
