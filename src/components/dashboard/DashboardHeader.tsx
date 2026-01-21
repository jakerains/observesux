'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Moon, Sun, Settings, Lightbulb, X } from "lucide-react"
import { useTheme } from "next-themes"
import { SettingsModal } from './SettingsModal'
import { SuggestionModal } from './SuggestionModal'
import { cn } from '@/lib/utils'

const SUGGESTION_TOOLTIP_KEY = 'suggestion-tooltip-seen'

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({ onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Avoid hydration mismatch - only render theme toggle after mount
  useEffect(() => {
    setMounted(true)

    // Check if user has seen the tooltip
    const hasSeen = localStorage.getItem(SUGGESTION_TOOLTIP_KEY)
    if (!hasSeen) {
      // Show tooltip after a brief delay
      const showTimer = setTimeout(() => setShowTooltip(true), 1500)
      // Auto-hide after 8 seconds
      const hideTimer = setTimeout(() => {
        setShowTooltip(false)
        localStorage.setItem(SUGGESTION_TOOLTIP_KEY, 'true')
      }, 9500)
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [])

  const dismissTooltip = () => {
    setShowTooltip(false)
    localStorage.setItem(SUGGESTION_TOOLTIP_KEY, 'true')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto flex h-14 items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            Siouxland.online
          </h1>
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

          <div className="relative">
            <SuggestionModal
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", showTooltip && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
                  onClick={dismissTooltip}
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="sr-only">Submit suggestion</span>
                </Button>
              }
            />

            {/* New user tooltip */}
            {showTooltip && (
              <div
                className="absolute top-full right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                onClick={dismissTooltip}
              >
                <div className="relative bg-primary text-primary-foreground text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  {/* Arrow pointing up */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-primary rotate-45" />
                  <div className="flex items-center gap-2">
                    <span>Got an idea? Suggest a feature!</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissTooltip()
                      }}
                      className="hover:bg-primary-foreground/20 rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SettingsModal
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}
