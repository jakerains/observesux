import { Zap, CheckCircle, AlertTriangle, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { OutageSummary, ApiResponse } from '@/types'

type OutagesToolOutput = ApiResponse<OutageSummary[]> | { error: string }

interface ProviderRowProps {
  summary: OutageSummary
}

function ProviderRow({ summary }: ProviderRowProps) {
  const hasOutages = summary.totalOutages > 0

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded-lg border',
        hasOutages
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-green-500/10 border-green-500/30'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Zap className={cn(
          'h-4 w-4 shrink-0',
          hasOutages ? 'text-yellow-600' : 'text-green-600'
        )} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{summary.provider}</div>
          {hasOutages && summary.totalCustomersAffected > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              <span>{summary.totalCustomersAffected.toLocaleString()} affected</span>
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {hasOutages ? (
          <Badge className="bg-yellow-600 text-white text-xs">
            {summary.totalOutages} outage{summary.totalOutages !== 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge className="bg-green-600 text-white text-xs">
            All Clear
          </Badge>
        )}
      </div>
    </div>
  )
}

export function OutagesCard({ data, error, state }: ToolCardProps<OutagesToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string' && !('data' in data)) {
    return (
      <ToolCardWrapper
        title="Power Outages"
        icon={<Zap className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const outageData = data as ApiResponse<OutageSummary[]>
  const summaries = outageData?.data || []

  if (summaries.length === 0) {
    return (
      <ToolCardWrapper
        title="Power Outages"
        icon={<Zap className="h-3.5 w-3.5" />}
        error="No outage data available"
      />
    )
  }

  const totalOutages = summaries.reduce((sum, s) => sum + s.totalOutages, 0)
  const totalAffected = summaries.reduce((sum, s) => sum + s.totalCustomersAffected, 0)
  const hasAnyOutages = totalOutages > 0

  return (
    <ToolCardWrapper
      title="Power Outages"
      icon={<Zap className="h-3.5 w-3.5" />}
      status={hasAnyOutages ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Summary header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed">
        {hasAnyOutages ? (
          <>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <span className="font-semibold text-yellow-600">
                {totalOutages} Active Outage{totalOutages !== 1 ? 's' : ''}
              </span>
              {totalAffected > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({totalAffected.toLocaleString()} customers)
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-green-600">All Systems Normal</span>
          </>
        )}
      </div>

      {/* Provider list */}
      <div className="space-y-2">
        {summaries.map((summary, idx) => (
          <ProviderRow key={summary.provider || idx} summary={summary} />
        ))}
      </div>

      {/* Note about data source */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        Data from utility company outage portals
      </div>
    </ToolCardWrapper>
  )
}
