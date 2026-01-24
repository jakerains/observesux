'use client'

import { useState, useEffect } from 'react'
import { useWeather, useCameras, useRivers, useTransit, useAirQuality, useTrafficEvents } from '@/lib/hooks/useDataFetching'
import { cn } from '@/lib/utils'

interface SplashScreenProps {
  onComplete?: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  // Track loading state of key data sources
  const { data: weather, isLoading: weatherLoading } = useWeather()
  const { data: cameras, isLoading: camerasLoading } = useCameras()
  const { data: rivers, isLoading: riversLoading } = useRivers()
  const { data: transit, isLoading: transitLoading } = useTransit()
  const { data: airQuality, isLoading: airQualityLoading } = useAirQuality()
  const { data: trafficEvents, isLoading: trafficLoading } = useTrafficEvents()

  // Calculate progress based on loaded data sources
  useEffect(() => {
    const sources = [
      { loaded: !!weather, loading: weatherLoading },
      { loaded: !!cameras, loading: camerasLoading },
      { loaded: !!rivers, loading: riversLoading },
      { loaded: !!transit, loading: transitLoading },
      { loaded: !!airQuality, loading: airQualityLoading },
      { loaded: !!trafficEvents, loading: trafficLoading },
    ]

    const loadedCount = sources.filter(s => s.loaded).length
    const totalSources = sources.length

    // Calculate percentage (add some base progress for initial load feel)
    const baseProgress = 10
    const dataProgress = (loadedCount / totalSources) * 90
    const newProgress = Math.min(baseProgress + dataProgress, 100)

    setProgress(newProgress)

    // All sources loaded - start fade out
    if (loadedCount === totalSources) {
      // Small delay to show 100% before fading
      setTimeout(() => {
        setIsFading(true)
        // After fade animation completes, hide completely
        setTimeout(() => {
          setIsVisible(false)
          onComplete?.()
        }, 500)
      }, 300)
    }
  }, [weather, cameras, rivers, transit, airQuality, trafficEvents, weatherLoading, camerasLoading, riversLoading, transitLoading, airQualityLoading, trafficLoading, onComplete])

  // Animate progress smoothly
  useEffect(() => {
    // Start with initial progress animation
    const timer = setTimeout(() => {
      setProgress(prev => Math.max(prev, 10))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        isFading ? 'opacity-0' : 'opacity-100'
      )}
    >
      {/* Logo */}
      <div className="mb-12 animate-in fade-in zoom-in duration-500">
        <img
          src="/siouxlandonlinelogo_black.png"
          alt="Siouxland Online"
          className="h-32 sm:h-40 md:h-48 w-auto dark:invert"
        />
      </div>

      {/* Progress Bar Container */}
      <div className="w-64 sm:w-80">
        {/* Progress bar background */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          {/* Progress bar fill */}
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading text */}
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            {progress < 100 ? 'Loading dashboard...' : 'Ready!'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* Subtle tagline */}
      <p className="mt-8 text-xs text-muted-foreground/50">
        Real-time Sioux City dashboard
      </p>
    </div>
  )
}
