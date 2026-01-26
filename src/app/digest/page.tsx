'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DigestViewer,
  DigestHistory
} from '@/components/digest'
import {
  ArrowLeft,
  Newspaper,
  Loader2,
  Sun,
  Sunset,
  Moon,
  Clock
} from 'lucide-react'
import { MobileNavigation } from '@/components/dashboard/MobileNavigation'
import { getCurrentEdition, editionLabels, type Digest, type DigestEdition } from '@/lib/digest/types'

// Edition icons map
const editionIcons: Record<DigestEdition, typeof Sun> = {
  morning: Sun,
  midday: Sunset,
  evening: Moon
}

export default function DigestPage() {
  const [currentDigest, setCurrentDigest] = useState<Digest | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(true)

  // Auto-detect the current edition based on time of day
  const currentEdition = useMemo(() => getCurrentEdition(), [])
  const EditionIcon = editionIcons[currentEdition]

  // Fetch the latest digest on page load
  useEffect(() => {
    const fetchLatestDigest = async () => {
      try {
        const response = await fetch('/api/user/digest')
        if (response.ok) {
          const data = await response.json()
          if (data.digest) {
            setCurrentDigest(data.digest)
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest digest:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestDigest()
  }, [])

  const handleSelectDigest = (digest: Digest) => {
    setCurrentDigest(digest)
  }

  // Initial loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">What You Need to Know, Siouxland</h1>
              <p className="text-sm text-muted-foreground">
                Your daily community newsletter
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current edition info */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <EditionIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Edition Period
                    </p>
                    <p className="font-semibold">{editionLabels[currentEdition]}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto gap-1">
                    <Clock className="h-3 w-3" />
                    Auto-generated daily
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Current digest */}
            {currentDigest ? (
              <DigestViewer digest={currentDigest} showMetadata defaultExpanded />
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Sun className="h-12 w-12 text-muted-foreground/30" />
                    <div>
                      <h3 className="font-medium text-muted-foreground">
                        No digest available yet
                      </h3>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Digests are generated automatically at 6:15am, 12pm, and 6pm
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - History */}
          <div className="lg:col-span-1">
            <DigestHistory
              selectedDigestId={currentDigest?.id}
              onSelectDigest={handleSelectDigest}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </main>
  )
}
