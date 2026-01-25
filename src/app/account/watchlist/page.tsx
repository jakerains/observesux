'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star } from 'lucide-react'
import { MyWatchlistPanel } from '@/components/watchlist/MyWatchlistPanel'

export default function WatchlistPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Watchlist</h1>
              <p className="text-sm text-muted-foreground">
                Quick access to your saved items
              </p>
            </div>
          </div>
        </div>

        {/* Watchlist Panel */}
        <MyWatchlistPanel />
      </div>
    </main>
  )
}
