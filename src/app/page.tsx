'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSWRConfig } from 'swr'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { CurrentConditionsHero } from '@/components/dashboard/CurrentConditionsHero'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { RiverGauge } from '@/components/dashboard/RiverGauge'
import { AirQualityCard } from '@/components/dashboard/AirQualityCard'
import { TransitWidget } from '@/components/dashboard/TransitWidget'
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
import { PollenWidget } from '@/components/dashboard/PollenWidget'
import { AuroraWidget } from '@/components/dashboard/AuroraWidget'
import { SunWidget } from '@/components/dashboard/SunWidget'
import { LocalEatsWidget } from '@/components/dashboard/LocalEatsWidget'
import { StatusBar } from '@/components/dashboard/StatusBar'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'
import { DashboardLayoutProvider } from '@/lib/contexts/DashboardLayoutContext'
import { TransitProvider } from '@/lib/contexts/TransitContext'
import { MapFocusProvider } from '@/lib/contexts/MapFocusContext'
import { Skeleton } from '@/components/ui/skeleton'
import { scrollToWidget } from '@/lib/utils/scrollToWidget'
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

// Dynamic imports for heavy/below-fold components
const ChatWidget = dynamic(
  () => import('@/components/dashboard/ChatWidget').then(mod => ({ default: mod.ChatWidget })),
  { ssr: false, loading: () => null }
)

const ChangelogModal = dynamic(
  () => import('@/components/dashboard/ChangelogModal').then(mod => ({ default: mod.ChangelogModal })),
  { ssr: false, loading: () => null }
)

const VoiceAgentWidget = dynamic(
  () => import('@/components/dashboard/VoiceAgentWidget').then(mod => ({ default: mod.VoiceAgentWidget })),
  { ssr: false, loading: () => null }
)

const CommandMenu = dynamic(
  () => import('@/components/dashboard/CommandMenu').then(mod => ({ default: mod.CommandMenu })),
  { ssr: false, loading: () => null }
)

const ScannerPlayer = dynamic(
  () => import('@/components/dashboard/ScannerPlayer').then(mod => ({ default: mod.ScannerPlayer })),
  { ssr: false, loading: () => <WidgetSkeleton /> }
)

const CameraGrid = dynamic(
  () => import('@/components/dashboard/CameraGrid').then(mod => ({ default: mod.CameraGrid })),
  { ssr: false, loading: () => <WidgetSkeleton className="h-[400px]" /> }
)

function DashboardContent() {
  const { mutate } = useSWRConfig()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return !sessionStorage.getItem('splash-shown')
  })

  // Handle hash navigation (e.g., from /digest clicking on Map, or command palette)
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setTimeout(() => {
        if (scrollToWidget(hash)) {
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
    <>
      {/* Splash Screen — rendered outside content wrapper so it's independent */}
      {hydrated && showSplash && <SplashScreen onComplete={handleSplashComplete} />}

    <div className={`min-h-screen pb-24 md:pb-16${hydrated ? '' : ' opacity-0'}`}>
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
        <section data-widget-id="digest">
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
            <div data-widget-id="forecast">
              <Suspense fallback={<WidgetSkeleton />}>
                <WeatherWidget />
              </Suspense>
            </div>

            {/* News */}
            <div data-widget-id="news">
              <Suspense fallback={<WidgetSkeleton />}>
                <NewsWidget />
              </Suspense>
            </div>

            {/* City Council */}
            <div data-widget-id="council">
              <Suspense fallback={<WidgetSkeleton />}>
                <CouncilWidget />
              </Suspense>
            </div>
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
            <div data-widget-id="traffic">
              <Suspense fallback={<WidgetSkeleton />}>
                <TrafficEventsWidget />
              </Suspense>
            </div>

            {/* River Gauge */}
            <div data-widget-id="river">
              <Suspense fallback={<WidgetSkeleton />}>
                <RiverGauge />
              </Suspense>
            </div>

            {/* Air Quality */}
            <div data-widget-id="air-quality">
              <Suspense fallback={<WidgetSkeleton />}>
                <AirQualityCard />
              </Suspense>
            </div>

            {/* Transit */}
            <div data-widget-id="transit">
              <Suspense fallback={<WidgetSkeleton />}>
                <TransitWidget />
              </Suspense>
            </div>

            {/* Outages */}
            <div data-widget-id="outages">
              <Suspense fallback={<WidgetSkeleton />}>
                <OutageMap />
              </Suspense>
            </div>

            {/* Gas Prices */}
            <div data-widget-id="gas-prices">
              <Suspense fallback={<WidgetSkeleton />}>
                <GasPricesWidget />
              </Suspense>
            </div>

            {/* Local Eats */}
            <div data-widget-id="local-eats">
              <Suspense fallback={<WidgetSkeleton />}>
                <LocalEatsWidget />
              </Suspense>
            </div>

            {/* Community Events */}
            <div data-widget-id="events">
              <Suspense fallback={<WidgetSkeleton />}>
                <EventsWidget />
              </Suspense>
            </div>

            {/* Pollen & Allergy */}
            <div data-widget-id="pollen">
              <Suspense fallback={<WidgetSkeleton />}>
                <PollenWidget />
              </Suspense>
            </div>

            {/* Sun & Daylight */}
            <div data-widget-id="sun">
              <Suspense fallback={<WidgetSkeleton />}>
                <SunWidget />
              </Suspense>
            </div>
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
            <div data-widget-id="flights">
              <Suspense fallback={<WidgetSkeleton />}>
                <FlightBoard />
              </Suspense>
            </div>

            {/* Aviation Weather */}
            <div data-widget-id="aviation-weather">
              <Suspense fallback={<WidgetSkeleton />}>
                <AviationWeatherWidget />
              </Suspense>
            </div>

            {/* Scanner */}
            <div data-widget-id="scanner">
              <Suspense fallback={<WidgetSkeleton />}>
                <ScannerPlayer />
              </Suspense>
            </div>

            {/* Earthquakes */}
            <div data-widget-id="earthquakes">
              <Suspense fallback={<WidgetSkeleton />}>
                <EarthquakeWidget />
              </Suspense>
            </div>

            {/* Aurora Watch */}
            <div data-widget-id="aurora">
              <Suspense fallback={<WidgetSkeleton />}>
                <AuroraWidget />
              </Suspense>
            </div>
          </div>
        </section>

        {/* ============================================
            FOOTER
           ============================================ */}
        <footer className="pt-8 border-t border-border/50 text-center text-xs text-muted-foreground/70">
          <p className="mb-2 leading-relaxed">
            Data: Iowa DOT, National Weather Service, AviationWeather.gov, USGS, AirNow, NOAA SWPC, Open-Meteo, Broadcastify, Iowa 511, RainViewer, Passio GO, KTIV, Siouxland Proud, Yelp
          </p>
          <p className="mb-3">
            Built with Next.js, shadcn/ui, and public APIs.
            <a
              href="https://github.com/jakerains/observesux"
              className="text-primary hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
            <span className="mx-1">·</span>
            <a
              href="/resources"
              className="text-primary hover:underline"
            >
              Local Resources
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

      {/* Command Palette (Cmd+K) */}
      <CommandMenu onRefresh={handleRefresh} />

      {/* Chat Widget */}
      <ChatWidget />

      {/* Voice Agent */}
      <VoiceAgentWidget />
    </div>
    </>
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
