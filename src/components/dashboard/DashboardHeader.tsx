'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw, Lightbulb, X, Sparkles } from "lucide-react"
import { track } from '@vercel/analytics'
import { SuggestionModal } from './SuggestionModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { useSession } from '@/lib/auth/client'

const ACCOUNT_TOOLTIP_KEY = 'account-tooltip-seen-v1'

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({ onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { data: session, isPending: sessionPending } = useSession()
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (sessionPending) return
    if (session?.user) return

    const hasSeen = localStorage.getItem(ACCOUNT_TOOLTIP_KEY)
    if (!hasSeen) {
      const showTimer = setTimeout(() => setShowTooltip(true), 1500)
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
    <header className="sticky top-0 z-50 w-full header-glass">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            <span className="text-primary">Siouxland</span>
            <span className="text-muted-foreground font-normal">.Online</span>
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              track('refresh_all_clicked')
              onRefresh?.()
            }}
            disabled={isRefreshing}
            className="h-9 w-9 rounded-full hover:bg-accent press-effect"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh all data</span>
          </Button>

          <SuggestionModal
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent press-effect"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="sr-only">Submit suggestion</span>
              </Button>
            }
          />

          <div className="relative ml-1">
            <UserMenu />

            {showTooltip && (
              <div className="absolute top-full right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative bg-primary text-primary-foreground text-sm px-4 py-3 rounded-2xl shadow-lg max-w-[280px]">
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-primary rotate-45" />

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-semibold">Free Accounts!</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissTooltip()
                      }}
                      className="hover:bg-primary-foreground/20 rounded-full p-1 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <ul className="text-xs text-primary-foreground/90 space-y-1.5">
                    <li>• Save favorite cameras & routes</li>
                    <li>• Get weather & flood alerts</li>
                    <li>• Sync settings across devices</li>
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
