'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Star, Bell } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

const BANNER_DISMISSED_KEY = 'sign-in-banner-dismissed'

export function SignInBanner() {
  const { data: session, isPending } = useSession()
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only check after mounted and session is loaded
    if (!mounted || isPending) return

    // If user is logged in, don't show
    if (session?.user) return

    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY)
    if (!dismissed) {
      setIsDismissed(false)
      // Delay showing banner for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [mounted, isPending, session])

  const handleDismiss = () => {
    setIsVisible(false)
    // Wait for animation to complete before removing
    setTimeout(() => {
      setIsDismissed(true)
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
    }, 300)
  }

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted || isPending || session?.user || isDismissed) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      )}
    >
      <div className="bg-gradient-to-r from-primary/90 to-primary backdrop-blur-sm border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-primary-foreground/80">
                <Star className="h-4 w-4" />
                <Bell className="h-4 w-4" />
              </div>
              <p className="text-sm text-primary-foreground">
                <span className="font-medium">Sign in</span>
                <span className="hidden sm:inline"> to save favorites, get alerts, and sync across devices</span>
                <span className="sm:hidden"> for favorites & alerts</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 px-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <a href="/auth/sign-in">Sign in</a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
