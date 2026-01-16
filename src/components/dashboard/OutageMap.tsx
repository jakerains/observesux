'use client'

import { DashboardCard } from './DashboardCard'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useOutages } from '@/lib/hooks/useDataFetching'
import { Zap, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const UTILITY_LINKS = {
  midamerican: {
    name: 'MidAmerican Energy',
    outageUrl: 'https://www.midamericanenergy.com/outagewatch/dsk.html',
    icon: '⚡'
  },
  woodbury: {
    name: 'Woodbury REC',
    outageUrl: 'https://www.woodburyrec.com/outages-power-restoration',
    icon: '🏘️'
  }
}

export function OutageMap() {
  const { data: outagesData, error, isLoading } = useOutages()

  const outages = outagesData?.data || []
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  // Calculate totals
  const totalOutages = outages.reduce((sum, o) => sum + o.totalOutages, 0)
  const totalAffected = outages.reduce((sum, o) => sum + o.totalCustomersAffected, 0)

  if (isLoading) {
    return (
      <DashboardCard title="Power Outages" icon={<Zap className="h-4 w-4" />} status="loading">
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Power Outages"
      icon={<Zap className="h-4 w-4" />}
      status={status}
      lastUpdated={outages[0]?.lastUpdated ? new Date(outages[0].lastUpdated) : undefined}
    >
      {/* Summary Banner */}
      <div className={cn(
        "p-3 rounded-lg mb-4 flex items-center gap-3",
        totalOutages > 0
          ? "bg-yellow-500/10 border border-yellow-500/20"
          : "bg-green-500/10 border border-green-500/20"
      )}>
        {totalOutages > 0 ? (
          <>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="font-medium text-sm">
                {totalOutages} Active Outage{totalOutages !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-muted-foreground">
                {totalAffected.toLocaleString()} customers affected
              </div>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-medium text-sm text-green-600 dark:text-green-400">
                All Systems Operational
              </div>
              <div className="text-xs text-muted-foreground">
                No reported outages in the area
              </div>
            </div>
          </>
        )}
      </div>

      {/* Utility Cards */}
      <div className="space-y-3">
        {Object.entries(UTILITY_LINKS).map(([key, utility]) => {
          const outageData = outages.find(o =>
            o.provider.toLowerCase().includes(key) ||
            o.provider.toLowerCase().replace(' ', '_') === key
          )

          return (
            <div
              key={key}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{utility.icon}</span>
                <div>
                  <h4 className="font-medium text-sm">{utility.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {outageData ? (
                      <>
                        <Badge variant={outageData.totalOutages > 0 ? "destructive" : "secondary"}>
                          {outageData.totalOutages} outage{outageData.totalOutages !== 1 ? 's' : ''}
                        </Badge>
                        <span>{outageData.totalCustomersAffected.toLocaleString()} affected</span>
                      </>
                    ) : (
                      <span>Check live status</span>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="sm" asChild>
                <a
                  href={utility.outageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  View Map
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )
        })}
      </div>

      {/* Additional Links */}
      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
        <p>
          Outage data is approximate. Visit utility websites for real-time information.
          <a
            href="https://poweroutage.us/area/state/iowa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline ml-1"
          >
            View statewide data →
          </a>
        </p>
      </div>
    </DashboardCard>
  )
}
