'use client'

import { Button } from "@/components/ui/button"
import { RefreshCw, Lightbulb, BookOpen, Search } from "lucide-react"
import { track } from '@vercel/analytics'
import { useRouter } from 'next/navigation'
import { SuggestionModal } from './SuggestionModal'
import { UserMenu } from '@/components/auth/UserMenu'

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({ onRefresh, isRefreshing }: DashboardHeaderProps) {
  const router = useRouter()
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
              track('command_palette_opened', { source: 'header' })
              document.dispatchEvent(new CustomEvent('open-command-palette'))
            }}
            className="h-9 w-9 rounded-full hover:bg-accent press-effect"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search (⌘K)</span>
          </Button>

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

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-accent press-effect"
            onClick={() => {
              track('resources_clicked')
              router.push('/resources')
            }}
          >
            <BookOpen className="h-4 w-4" />
            <span className="sr-only">Resources</span>
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

          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
