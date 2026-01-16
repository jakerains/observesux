'use client'

import { useState } from 'react'
import { DashboardCard } from './DashboardCard'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Radio, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import type { ScannerFeed } from '@/types'

// Predefined scanner feeds for Sioux City area
const SCANNER_FEEDS: ScannerFeed[] = [
  {
    id: 'sioux-city-metro',
    name: 'Sioux City Metro',
    description: 'Police, Fire, and EMS Dispatch',
    type: 'combined',
    provider: 'broadcastify',
    feedId: '15277',
    isLive: true
  },
  {
    id: 'sioux-county-fire',
    name: 'Sioux County Fire/EMS',
    description: 'Fire and EMS Dispatch',
    type: 'fire',
    provider: 'broadcastify',
    feedId: '46141',
    isLive: true
  },
  {
    id: 'medical-helicopter',
    name: 'Medical Helicopter',
    description: 'Air Ambulance Communications',
    type: 'aviation',
    provider: 'broadcastify',
    feedId: '46227',
    isLive: true
  }
]

function getTypeIcon(type: ScannerFeed['type']) {
  switch (type) {
    case 'police': return '🚔'
    case 'fire': return '🚒'
    case 'ems': return '🚑'
    case 'aviation': return '🚁'
    case 'combined': return '📡'
    default: return '📻'
  }
}

function getTypeBadgeVariant(type: ScannerFeed['type']) {
  switch (type) {
    case 'police': return 'default'
    case 'fire': return 'destructive'
    case 'ems': return 'default'
    case 'aviation': return 'secondary'
    default: return 'outline'
  }
}

interface FeedPlayerProps {
  feed: ScannerFeed
}

function FeedPlayer({ feed }: FeedPlayerProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Broadcastify embed URL
  const embedUrl = `https://www.broadcastify.com/webPlayer/${feed.feedId}`

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(feed.type)}</span>
          <div>
            <h4 className="font-medium text-sm">{feed.name}</h4>
            <p className="text-xs text-muted-foreground">{feed.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getTypeBadgeVariant(feed.type) as "default" | "secondary" | "destructive" | "outline"}>
            {feed.type}
          </Badge>
          {feed.isLive && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMuted(!isMuted)}
          className="flex-1"
        >
          {isMuted ? (
            <>
              <VolumeX className="h-4 w-4 mr-2" />
              Tap to Listen
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Listening...
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <a
            href={`https://www.broadcastify.com/listen/feed/${feed.feedId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Embedded Player (shown when not muted) */}
      {!isMuted && (
        <div className="relative bg-black rounded overflow-hidden">
          <iframe
            src={embedUrl}
            width="100%"
            height="120"
            frameBorder="0"
            scrolling="no"
            allow="autoplay"
            title={`${feed.name} Scanner`}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Click play button in player above • Audio by Broadcastify
          </p>
        </div>
      )}
    </div>
  )
}

export function ScannerPlayer() {
  return (
    <DashboardCard
      title="Emergency Scanner"
      icon={<Radio className="h-4 w-4" />}
      status="live"
    >
      <Tabs defaultValue={SCANNER_FEEDS[0].id} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {SCANNER_FEEDS.map((feed) => (
            <TabsTrigger key={feed.id} value={feed.id} className="text-xs">
              {getTypeIcon(feed.type)} {feed.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {SCANNER_FEEDS.map((feed) => (
          <TabsContent key={feed.id} value={feed.id} className="mt-3">
            <FeedPlayer feed={feed} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Disclaimer */}
      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
        <p>
          Scanner feeds provided by Broadcastify. Audio may be delayed.
          For emergencies, always call 911.
        </p>
      </div>
    </DashboardCard>
  )
}
