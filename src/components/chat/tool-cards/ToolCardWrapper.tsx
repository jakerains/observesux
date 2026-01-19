import { ReactNode } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusLevel } from './types'

interface ToolCardWrapperProps {
  /** Card title displayed in header */
  title: string
  /** Icon component to show in header */
  icon: ReactNode
  /** Visual status level affecting border color */
  status?: StatusLevel
  /** Loading state - shows spinner */
  isLoading?: boolean
  /** Error message to display */
  error?: string | null
  /** Card content (optional when showing error/loading) */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Shared wrapper for tool cards with consistent styling.
 * Provides header with icon/title, status borders, and error/loading states.
 */
export function ToolCardWrapper({
  title,
  icon,
  status = 'normal',
  isLoading,
  error,
  children,
  className,
}: ToolCardWrapperProps) {
  const borderColors: Record<StatusLevel, string> = {
    normal: 'border-border',
    attention: 'border-yellow-500/50',
    alert: 'border-red-500/50',
  }

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl border bg-card p-3',
        borderColors.normal,
        className
      )}>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        'rounded-xl border bg-card p-3',
        borderColors.alert,
        className
      )}>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card p-3',
      borderColors[status],
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}
