'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useCallback, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { CurrentConditionsHero } from '@/components/dashboard/CurrentConditionsHero'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { RiverGauge } from '@/components/dashboard/RiverGauge'
import { AirQualityCard } from '@/components/dashboard/AirQualityCard'
import { TransitWidget } from '@/components/dashboard/TransitWidget'
import { CameraGrid } from '@/components/dashboard/CameraGrid'
import { ScannerPlayer } from '@/components/dashboard/ScannerPlayer'
import { FlightBoard } from '@/components/dashboard/FlightBoard'
import { AviationWeatherWidget } from '@/components/dashboard/AviationWeatherWidget'
import { OutageMap } from '@/components/dashboard/OutageMap'
import { EarthquakeWidget } from '@/components/dashboard/EarthquakeWidget'
import { TrafficEventsWidget } from '@/components/dashboard/TrafficEventsWidget'
import { NewsWidget } from '@/components/dashboard/NewsWidget'
import { GasPricesWidget } from '@/components/dashboard/GasPricesWidget'
import { EventsWidget } from '@/components/dashboard/EventsWidget'
import { CouncilWidget } from '@/components/dashboard/CouncilWidget'
import { DigestWidget } from '@/components/dashboard/DigestWidget'
import { StatusBar } from '@/components/dashboard/StatusBar'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'
import { VoiceAgentWidget } from '@/components/dashboard/VoiceAgentWidget'
import { ChatWidget } from '@/components/dashboard/ChatWidget'
import { ChangelogModal } from '@/components/dashboard/ChangelogModal'
import { DashboardLayoutProvider } from '@/lib/contexts/DashboardLayoutContext'
import { TransitProvider } from '@/lib/contexts/TransitContext'
import { MapFocusProvider } from '@/lib/contexts/MapFocusContext'
import { Skeleton } from '@/components/ui/skeleton'
import { SplashScreen } from '@/components/splash/SplashScreen'
import packageJson from '../../package.json'

// Dynamic import for the map component
const InteractiveMap = dynamic(
  () => import('@/components/dashboard/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="card-primary bg-card h-[400px] flex items-center justify-center">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    )
  }
)

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h2 className="text-section-header">{title}</h2>
      <div className="section-divider flex-1" />
    </div>
  )
}

// Widget loading skeleton
function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <div className={`card-secondary bg-card ${className}`}>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function DashboardContent() {
  const { mutate } = useSWRConfig()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  // Check if we've shown splash recently (within session)
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splash-shown')
    if (splashShown) {
      setShowSplash(false)
    }
  }, [])

  // Handle hash navigation (e.g., from /digest clicking on Map)
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove the #
    if (hash) {
      // Small delay to ensure elements are rendered
      setTimeout(() => {
        const element = document.querySelector(`[data-widget-id="${hash}"]`)
        if (element) {
          const headerOffset = 70
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
          // Clear the hash after scrolling
          window.history.replaceState(null, '', window.location.pathname)
        }
      }, 100)
    }
  }, [])

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await mutate(
      key => typeof key === 'string' && key.startsWith('/api/'),
      undefined,
      { revalidate: true }
    )
    setTimeout(() => setIsRefreshing(false), 500)
  }, [mutate])

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splash-shown', 'true')
    setShowSplash(false)
  }, [])

  return (
    <div className="min-h-screen pb-24 md:pb-16">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Alert Banner - Top priority, always visible */}
      <AlertBanner />

      {/* Header */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12">

        {/* ============================================
            HERO SECTION - Current Conditions
            Apple Weather-style prominent display
           ============================================ */}
        <section data-widget-id="weather">
          <CurrentConditionsHero />
        </section>

        {/* ============================================
            DIGEST - Daily summary right after hero
           ============================================ */}
        <section>
          <Suspense fallback={null}>
            <DigestWidget />
          </Suspense>
        </section>

        {/* ============================================
            MAP SECTION - Interactive overview
           ============================================ */}
        <section data-widget-id="map">
          <SectionHeader title="Area Map" />
          <div className="rounded-2xl overflow-hidden">
            <Suspense fallback={<WidgetSkeleton className="h-[450px]" />}>
              <InteractiveMap />
            </Suspense>
          </div>
        </section>

        {/* ============================================
            PRIMARY TIER - Most important real-time info
            Large cards, critical for daily use
           ============================================ */}
        <section>
          <SectionHeader title="Live Updates" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Traffic Cameras - Full width */}
            <div className="lg:col-span-3" data-widget-id="cameras">
              <Suspense fallback={<WidgetSkeleton className="h-[400px]" />}>
                <CameraGrid />
              </Suspense>
            </div>

            {/* Weather Forecast */}
            <Suspense fallback={<WidgetSkeleton />}>
              <WeatherWidget />
            </Suspense>

            {/* News */}
            <div data-widget-id="news">
              <Suspense fallback={<WidgetSkeleton />}>
                <NewsWidget />
              </Suspense>
            </div>

            {/* City Council */}
            <Suspense fallback={<WidgetSkeleton />}>
              <CouncilWidget />
            </Suspense>
          </div>
        </section>

        {/* ============================================
            SECONDARY TIER - Important but less urgent
            Medium cards, 2-3 column layout
           ============================================ */}
        <section>
          <SectionHeader title="Conditions & Services" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Traffic Events */}
            <Suspense fallback={<WidgetSkeleton />}>
              <TrafficEventsWidget />
            </Suspense>

            {/* River Gauge */}
            <Suspense fallback={<WidgetSkeleton />}>
              <RiverGauge />
            </Suspense>

            {/* Air Quality */}
            <Suspense fallback={<WidgetSkeleton />}>
              <AirQualityCard />
            </Suspense>

            {/* Transit */}
            <Suspense fallback={<WidgetSkeleton />}>
              <TransitWidget />
            </Suspense>

            {/* Outages */}
            <Suspense fallback={<WidgetSkeleton />}>
              <OutageMap />
            </Suspense>

            {/* Gas Prices */}
            <Suspense fallback={<WidgetSkeleton />}>
              <GasPricesWidget />
            </Suspense>

            {/* Community Events */}
            <Suspense fallback={<WidgetSkeleton />}>
              <EventsWidget />
            </Suspense>
          </div>
        </section>

        {/* ============================================
            TERTIARY TIER - Specialized info
            Compact cards, less prominent
           ============================================ */}
        <section>
          <SectionHeader title="More Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flights */}
            <Suspense fallback={<WidgetSkeleton />}>
              <FlightBoard />
            </Suspense>

            {/* Aviation Weather */}
            <Suspense fallback={<WidgetSkeleton />}>
              <AviationWeatherWidget />
            </Suspense>

            {/* Scanner */}
            <Suspense fallback={<WidgetSkeleton />}>
              <ScannerPlayer />
            </Suspense>

            {/* Earthquakes */}
            <Suspense fallback={<WidgetSkeleton />}>
              <EarthquakeWidget />
            </Suspense>
          </div>
        </section>

        {/* ============================================
            FOOTER
           ============================================ */}
        <footer className="pt-8 border-t border-border/50 text-center text-xs text-muted-foreground/70">
          <p className="mb-2 leading-relaxed">
            Data: Iowa DOT, National Weather Service, AviationWeather.gov, USGS, AirNow, Broadcastify, Iowa 511, RainViewer, Passio GO, KTIV, Siouxland Proud
          </p>
          <p className="mb-3">
            Built with Next.js, shadcn/ui, and public APIs.
            <a
              href="https://github.com/jakerains/siouxland-online"
              className="text-primary hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
          <ChangelogModal>
            <button className="text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer">
              v{packageJson.version}
            </button>
          </ChangelogModal>
        </footer>
      </main>

      {/* Status Bar - Desktop only */}
      <StatusBar />

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Chat Widget */}
      <ChatWidget />

      {/* Voice Agent */}
      <VoiceAgentWidget />
    </div>
  )
}

export default function Dashboard() {
  return (
    <MapFocusProvider>
      <TransitProvider>
        <DashboardLayoutProvider>
          <DashboardContent />
        </DashboardLayoutProvider>
      </TransitProvider>
    </MapFocusProvider>
  )
}
