'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useCallback } from 'react'
import { useSWRConfig } from 'swr'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { RiverGauge } from '@/components/dashboard/RiverGauge'
import { AirQualityCard } from '@/components/dashboard/AirQualityCard'
import { CameraGrid } from '@/components/dashboard/CameraGrid'
import { ScannerPlayer } from '@/components/dashboard/ScannerPlayer'
import { FlightBoard } from '@/components/dashboard/FlightBoard'
import { OutageMap } from '@/components/dashboard/OutageMap'
import { EarthquakeWidget } from '@/components/dashboard/EarthquakeWidget'
import { TrafficEventsWidget } from '@/components/dashboard/TrafficEventsWidget'
import { NewsWidget } from '@/components/dashboard/NewsWidget'
import { StatusBar } from '@/components/dashboard/StatusBar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Dynamic import for the map component (requires client-side rendering)
const InteractiveMap = dynamic(
  () => import('@/components/dashboard/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }
)

// Widget loading skeleton
function WidgetSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { mutate } = useSWRConfig()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)

    // Revalidate all SWR caches
    await mutate(
      key => typeof key === 'string' && key.startsWith('/api/'),
      undefined,
      { revalidate: true }
    )

    // Short delay to show loading state
    setTimeout(() => setIsRefreshing(false), 500)
  }, [mutate])

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Dashboard Grid */}
      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1: Weather, River Levels, Air Quality */}
          <Suspense fallback={<WidgetSkeleton />}>
            <WeatherWidget />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <RiverGauge />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <AirQualityCard />
          </Suspense>

          {/* Row 2: Traffic Cameras (spans 2 cols on lg) */}
          <div className="md:col-span-2">
            <Suspense fallback={<WidgetSkeleton />}>
              <CameraGrid />
            </Suspense>
          </div>

          {/* Traffic Events */}
          <Suspense fallback={<WidgetSkeleton />}>
            <TrafficEventsWidget />
          </Suspense>

          {/* Row 3: Scanner, Power Outages, Flights */}
          <Suspense fallback={<WidgetSkeleton />}>
            <ScannerPlayer />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <OutageMap />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <FlightBoard />
          </Suspense>

          {/* Row 4: News + Earthquakes */}
          <Suspense fallback={<WidgetSkeleton />}>
            <NewsWidget />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <EarthquakeWidget />
          </Suspense>

          {/* Interactive Map - Full Width */}
          <div className="col-span-full">
            <Suspense fallback={
              <Card className="col-span-full">
                <CardContent className="p-6">
                  <Skeleton className="h-[400px] w-full rounded-lg" />
                </CardContent>
              </Card>
            }>
              <InteractiveMap />
            </Suspense>
          </div>
        </div>

        {/* Data Sources Attribution */}
        <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p className="mb-2">
            Data sourced from: Iowa DOT, National Weather Service, USGS, AirNow, Broadcastify, Iowa 511, RainViewer, KTIV, Siouxland Proud
          </p>
          <p>
            Built with Next.js, shadcn/ui, and public APIs.
            <a
              href="https://github.com/jakerains/observesux"
              className="text-primary hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </main>

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}
