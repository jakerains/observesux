'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Fuel,
  Bell,
  Newspaper,
  CalendarDays,
  Landmark,
  Smartphone,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CronRun {
  id: number
  jobName: string
  status: 'success' | 'error' | 'skipped'
  startedAt: string
  durationMs: number | null
  result: Record<string, unknown> | null
  errorMessage: string | null
}

const JOB_META: Record<string, { label: string; icon: React.ElementType; schedule: string }> = {
  'gas-prices':          { label: 'Gas Prices',       icon: Fuel,         schedule: 'Daily 6am CST' },
  'check-alerts':        { label: 'Alert Checks',      icon: Bell,         schedule: 'Hourly' },
  'digest':              { label: 'Digest',            icon: Newspaper,    schedule: '3x daily' },
  'events':              { label: 'Community Events',  icon: CalendarDays, schedule: 'Weekly Sunday' },
  'ingest-meetings':     { label: 'Council Meetings',  icon: Landmark,     schedule: '2x weekly' },
  'check-expo-receipts': { label: 'Expo Receipts',     icon: Smartphone,   schedule: 'Hourly :30' },
}

const JOB_ORDER = Object.keys(JOB_META)

function StatusIcon({ status }: { status: CronRun['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  if (status === 'error')   return <XCircle      className="h-4 w-4 text-red-500 shrink-0" />
  return                           <SkipForward  className="h-4 w-4 text-yellow-500 shrink-0" />
}

function StatusDot({ status }: { status: string | undefined }) {
  if (!status) return <span className="h-2 w-2 rounded-full bg-muted shrink-0" />
  if (status === 'success') return <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
  if (status === 'error')   return <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
  return                           <span className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function CronLogsPanel() {
  const [runs, setRuns] = useState<CronRun[]>([])
  const [summary, setSummary] = useState<CronRun[]>([])
  const [jobFilter, setJobFilter] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (jobFilter) params.set('job', jobFilter)
        const res = await fetch(`/api/admin/cron-logs?${params.toString()}`)
        if (!active) return
        if (res.ok) {
          const data = await res.json()
          setRuns(data.runs ?? [])
          setSummary(data.summary ?? [])
          setLastRefreshed(new Date())
        }
      } catch {
        // silently ignore network errors
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [jobFilter, refreshTick])

  // Build summary map keyed by jobName
  const summaryMap = Object.fromEntries(summary.map(s => [s.jobName, s]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Automation Logs</h2>
          <p className="text-sm text-muted-foreground">
            {lastRefreshed
              ? `Refreshed ${formatDistanceToNow(lastRefreshed, { addSuffix: true })}`
              : 'Loading…'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshTick(t => t + 1)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {JOB_ORDER.map(job => {
          const meta   = JOB_META[job]
          const latest = summaryMap[job]
          const Icon   = meta.icon
          const active = jobFilter === job

          return (
            <button
              key={job}
              onClick={() => setJobFilter(prev => prev === job ? null : job)}
              className={cn(
                'flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                active && 'ring-2 ring-primary bg-muted/50'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <StatusDot status={latest?.status} />
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{meta.schedule}</p>
              </div>
              {latest ? (
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(latest.startedAt), { addSuffix: true })}
                  {latest.durationMs !== null && ` · ${formatDuration(latest.durationMs)}`}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">No runs yet</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Filter pills + count */}
      <div className="flex items-center gap-2">
        {jobFilter && (
          <Badge variant="secondary" className="gap-1">
            {JOB_META[jobFilter]?.label ?? jobFilter}
            <button
              onClick={() => setJobFilter(null)}
              className="ml-1 hover:text-foreground text-muted-foreground"
              aria-label="Clear filter"
            >
              ×
            </button>
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${runs.length} run${runs.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Runs Table */}
      <div className="rounded-lg border divide-y">
        {loading && runs.length === 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading runs…
          </div>
        )}
        {!loading && runs.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No cron runs recorded yet. Runs will appear here after the next scheduled job fires.
          </div>
        )}
        {runs.map(run => {
          const meta      = JOB_META[run.jobName]
          const label     = meta?.label ?? run.jobName
          const isExpanded = expandedId === run.id

          return (
            <div key={run.id}>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(prev => prev === run.id ? null : run.id)}
              >
                <StatusIcon status={run.status} />
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{label}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                  {format(new Date(run.startedAt), 'MMM d, h:mm a')}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 hidden md:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(run.durationMs)}
                </span>
                <Badge
                  variant={
                    run.status === 'success' ? 'default' :
                    run.status === 'error' ? 'destructive' : 'secondary'
                  }
                  className="text-[10px] px-1.5 py-0"
                >
                  {run.status}
                </Badge>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                }
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 bg-muted/10">
                  <div className="text-xs text-muted-foreground">
                    Started: {format(new Date(run.startedAt), 'PPpp')}
                    {run.durationMs !== null && ` · Duration: ${formatDuration(run.durationMs)}`}
                  </div>
                  {run.errorMessage && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {run.errorMessage}
                    </div>
                  )}
                  {run.result && (
                    <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(run.result, null, 2)}
                    </pre>
                  )}
                  {!run.errorMessage && !run.result && (
                    <p className="text-xs text-muted-foreground italic">No result data.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
