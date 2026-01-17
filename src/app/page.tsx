'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useCallback, useMemo } from 'react'
import { useSWRConfig } from 'swr'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { RiverGauge } from '@/components/dashboard/RiverGauge'
import { AirQualityCard } from '@/components/dashboard/AirQualityCard'
import { TransitWidget } from '@/components/dashboard/TransitWidget'
import { CameraGrid } from '@/components/dashboard/CameraGrid'
import { ScannerPlayer } from '@/components/dashboard/ScannerPlayer'
import { FlightBoard } from '@/components/dashboard/FlightBoard'
import { OutageMap } from '@/components/dashboard/OutageMap'
import { EarthquakeWidget } from '@/components/dashboard/EarthquakeWidget'
import { TrafficEventsWidget } from '@/components/dashboard/TrafficEventsWidget'
import { NewsWidget } from '@/components/dashboard/NewsWidget'
import { StatusBar } from '@/components/dashboard/StatusBar'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'
import { DraggableWidget } from '@/components/dashboard/DraggableWidget'
import { DashboardLayoutProvider, useDashboardLayout } from '@/lib/contexts/DashboardLayoutContext'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import packageJson from '../../package.json'

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

// Widget component mapping
const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  'weather': WeatherWidget,
  'river': RiverGauge,
  'air-quality': AirQualityCard,
  'transit': TransitWidget,
  'cameras': CameraGrid,
  'traffic-events': TrafficEventsWidget,
  'scanner': ScannerPlayer,
  'outages': OutageMap,
  'flights': FlightBoard,
  'news': NewsWidget,
  'earthquakes': EarthquakeWidget,
  'map': InteractiveMap,
}

// Widget size to CSS class mapping
function getWidgetClassName(widgetId: string, size: string): string {
  if (widgetId === 'map') return 'col-span-full'
  if (widgetId === 'cameras') return 'sm:col-span-2 lg:col-span-2'

  switch (size) {
    case 'large': return 'sm:col-span-2 lg:col-span-2'
    case 'full': return 'col-span-full'
    default: return ''
  }
}

function DashboardContent() {
  const { mutate } = useSWRConfig()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { widgets, widgetOrder, setWidgetOrder, isWidgetEnabled, getWidgetConfig } = useDashboardLayout()

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get enabled widgets in order
  const enabledWidgetIds = useMemo(() => {
    return widgetOrder.filter(id => isWidgetEnabled(id))
  }, [widgetOrder, isWidgetEnabled])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string)
      const newIndex = widgetOrder.indexOf(over.id as string)

      const newOrder = [...widgetOrder]
      newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, active.id as string)

      setWidgetOrder(newOrder)
    }
  }, [widgetOrder, setWidgetOrder])

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
    <div className="min-h-screen pb-24 md:pb-16">
      {/* Header */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Dashboard Grid */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={enabledWidgetIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
              {enabledWidgetIds.map((widgetId) => {
                const WidgetComponent = WIDGET_COMPONENTS[widgetId]
                const config = getWidgetConfig(widgetId)

                if (!WidgetComponent || !config) return null

                return (
                  <DraggableWidget
                    key={widgetId}
                    id={widgetId}
                    className={getWidgetClassName(widgetId, config.size)}
                  >
                    <Suspense fallback={<WidgetSkeleton />}>
                      <WidgetComponent />
                    </Suspense>
                  </DraggableWidget>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty state when all widgets are hidden */}
        {enabledWidgetIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">No Widgets Enabled</h2>
            <p className="text-muted-foreground mb-4">
              Click the settings button to enable widgets for your dashboard.
            </p>
          </div>
        )}

        {/* Data Sources Attribution */}
        <footer className="mt-6 sm:mt-8 pt-4 border-t text-center text-xs text-muted-foreground px-2">
          <p className="mb-2 leading-relaxed">
            Data sourced from: Iowa DOT, National Weather Service, USGS, AirNow, Broadcastify, Iowa 511, RainViewer, Passio GO, KTIV, Siouxland Proud
          </p>
          <p className="mb-2">
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
          <p className="text-muted-foreground/60 md:hidden">
            v{packageJson.version}
          </p>
        </footer>
      </main>

      {/* Status Bar - hidden on mobile */}
      <StatusBar />

      {/* Mobile Navigation - iOS-style bottom tabs */}
      <MobileNavigation />
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardLayoutProvider>
      <DashboardContent />
    </DashboardLayoutProvider>
  )
}
