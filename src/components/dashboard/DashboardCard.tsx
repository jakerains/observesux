'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  icon?: React.ReactNode
  status?: 'live' | 'stale' | 'error' | 'loading'
  lastUpdated?: Date
  className?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function DashboardCard({
  title,
  icon,
  status = 'live',
  lastUpdated,
  className,
  children,
  action
}: DashboardCardProps) {
  const statusColors = {
    live: 'bg-green-500',
    stale: 'bg-yellow-500',
    error: 'bg-red-500',
    loading: 'bg-blue-500'
  }

  const statusLabels = {
    live: 'Live',
    stale: 'Stale',
    error: 'Error',
    loading: 'Loading'
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {action}
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-normal",
              status === 'error' && "border-red-500 text-red-500"
            )}
          >
            <span className={cn(
              "w-2 h-2 rounded-full mr-1.5 animate-pulse",
              statusColors[status]
            )} />
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {children}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
