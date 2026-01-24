'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Moon, Sun, Settings, Lightbulb, X, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { SettingsModal } from './SettingsModal'
import { SuggestionModal } from './SuggestionModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const ACCOUNT_TOOLTIP_KEY = 'account-tooltip-seen-v1'

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({ onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session, isPending: sessionPending } = useSession()
  const [mounted, setMounted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Avoid hydration mismatch - only render theme toggle after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show account tooltip for non-authenticated users who haven't seen it
  useEffect(() => {
    if (sessionPending) return // Wait for session to load
    if (session?.user) return // Don't show to logged-in users

    const hasSeen = localStorage.getItem(ACCOUNT_TOOLTIP_KEY)
    if (!hasSeen) {
      // Show tooltip after a brief delay
      const showTimer = setTimeout(() => setShowTooltip(true), 1500)
      // Auto-hide after 10 seconds
      const hideTimer = setTimeout(() => {
        setShowTooltip(false)
        localStorage.setItem(ACCOUNT_TOOLTIP_KEY, 'true')
      }, 11500)
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [session, sessionPending])

  const dismissTooltip = () => {
    setShowTooltip(false)
    localStorage.setItem(ACCOUNT_TOOLTIP_KEY, 'true')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto flex h-14 items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/siouxlandonlinelogo_black.png"
            alt="Siouxland Online"
            width={180}
            height={45}
            className="h-8 sm:h-10 w-auto"
            priority
          />
          <Badge variant="default" className="hidden sm:flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh all data</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <SuggestionModal
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="sr-only">Submit suggestion</span>
              </Button>
            }
          />

          <SettingsModal
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            }
          />

          <div className="relative">
            <UserMenu />

            {/* Account feature tooltip for new users */}
            {showTooltip && (
              <div
                className="absolute top-full right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="relative bg-primary text-primary-foreground text-sm px-4 py-3 rounded-lg shadow-lg max-w-[280px]">
                  {/* Arrow pointing up */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-primary rotate-45" />

                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-semibold">NEW: Free Accounts!</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissTooltip()
                      }}
                      className="hover:bg-primary-foreground/20 rounded p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Benefits list */}
                  <ul className="text-xs text-primary-foreground/90 space-y-1 ml-0.5">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-foreground/70">•</span>
                      <span>Save favorite cameras & routes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-foreground/70">•</span>
                      <span>Get alerts for weather & flooding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-foreground/70">•</span>
                      <span>Sync settings across devices</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
