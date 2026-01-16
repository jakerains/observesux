'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { DashboardCard } from './DashboardCard'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Radio, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react'

// Scanner feed configuration - uses our proxy to bypass CORS
interface ScannerFeed {
  id: string
  feedId: string // Broadcastify feed ID
  name: string
  shortName: string
  description: string
  type: 'fire' | 'ems' | 'aviation' | 'combined'
  icon: string
}

const SCANNER_FEEDS: ScannerFeed[] = [
  {
    id: 'le-mars-fire',
    feedId: '15277',
    name: 'Le Mars Fire and Rescue',
    shortName: 'Le Mars',
    description: 'Fire and Rescue Dispatch',
    type: 'fire',
    icon: '🚒'
  },
  {
    id: 'sioux-county',
    feedId: '46141',
    name: 'Sioux County Fire and EMS',
    shortName: 'Sioux Co',
    description: 'Fire and EMS Dispatch',
    type: 'combined',
    icon: '📡'
  },
  {
    id: 'life-net',
    feedId: '46227',
    name: 'Life Net-Air Methods West',
    shortName: 'Life Net',
    description: 'Air Ambulance Communications',
    type: 'aviation',
    icon: '🚁'
  }
]

// Generate stream URL via our proxy API
function getStreamUrl(feedId: string): string {
  return `/api/scanner/stream?feed=${feedId}`
}

type StreamStatus = 'idle' | 'connecting' | 'playing' | 'error'

interface AudioPlayerProps {
  feed: ScannerFeed
  isActive: boolean
}

function AudioPlayer({ feed, isActive }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const isMountedRef = useRef(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Handle play/pause
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      setStatus('idle')
    } else {
      setStatus('connecting')
      audio.src = getStreamUrl(feed.feedId)
      audio.load()

      try {
        await audio.play()
        // Only update state if still mounted
        if (isMountedRef.current) {
          setStatus('playing')
          setIsPlaying(true)
        }
      } catch (error) {
        // Ignore AbortError - happens when audio is removed during play request
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Play request was interrupted')
          return
        }
        console.error('Audio play error:', error)
        if (isMountedRef.current) {
          setStatus('error')
        }
      }
    }
  }, [isPlaying, feed.feedId])

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.7
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }, [isMuted, volume])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleWaiting = () => {
      if (isMountedRef.current) {
        setStatus('connecting')
      }
    }

    const handlePlaying = () => {
      if (isMountedRef.current) {
        setStatus('playing')
        setIsPlaying(true)
      }
    }

    const handleError = () => {
      // Ignore errors if not mounted or if audio has no valid src
      if (!isMountedRef.current) return
      // Check if src is empty or just the base URL (no actual stream)
      if (!audio.src || audio.src === window.location.href || audio.src === '') return

      // Get detailed error info from MediaError
      const mediaError = audio.error
      if (mediaError) {
        const errorMessages: Record<number, string> = {
          1: 'MEDIA_ERR_ABORTED - Playback aborted',
          2: 'MEDIA_ERR_NETWORK - Network error',
          3: 'MEDIA_ERR_DECODE - Decode error',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Source not supported'
        }
        console.error('Audio error:', errorMessages[mediaError.code] || `Unknown error code: ${mediaError.code}`)
      }

      setStatus('error')
      setIsPlaying(false)
    }

    const handlePause = () => {
      if (isMountedRef.current) {
        setIsPlaying(false)
        setStatus('idle')
      }
    }

    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('error', handleError)
    audio.addEventListener('pause', handlePause)

    return () => {
      // Clean up: pause and remove src on unmount
      audio.pause()
      audio.src = ''
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  // Stop audio when switching tabs or becoming inactive
  useEffect(() => {
    const audio = audioRef.current
    if (!isActive && audio) {
      audio.pause()
      audio.src = '' // Clear source to prevent AbortError
      setIsPlaying(false)
      setStatus('idle')
    }
  }, [isActive])

  // Set initial volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* Feed Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{feed.icon}</span>
          <div>
            <h4 className="font-medium">{feed.name}</h4>
            <p className="text-sm text-muted-foreground">{feed.description}</p>
          </div>
        </div>
        <Badge
          variant={status === 'playing' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
          className="shrink-0"
        >
          {status === 'playing' && (
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
          )}
          {status === 'connecting' && (
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          )}
          {status === 'idle' ? 'Ready' : status === 'connecting' ? 'Connecting' : status === 'playing' ? 'Live' : 'Error'}
        </Badge>
      </div>

      {/* Main Play Button */}
      <div className="flex flex-col items-center py-4">
        <Button
          size="lg"
          variant={isPlaying ? 'secondary' : 'default'}
          onClick={togglePlay}
          disabled={status === 'connecting'}
          className="w-20 h-20 rounded-full"
        >
          {status === 'connecting' ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {isPlaying ? 'Tap to stop' : 'Tap to listen'}
        </p>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="shrink-0"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>

      {/* Error Message */}
      {status === 'error' && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-center">
          <p className="text-destructive">Unable to connect to stream</p>
          <p className="text-muted-foreground text-xs mt-1">
            The feed may be temporarily offline. Try again later.
          </p>
        </div>
      )}

      {/* Audio Visualization Placeholder (when playing) */}
      {status === 'playing' && (
        <div className="flex items-center justify-center gap-1 h-8">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 24 + 8}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ScannerPlayer() {
  const [activeTab, setActiveTab] = useState(SCANNER_FEEDS[0].id)

  return (
    <DashboardCard
      title="Emergency Scanner"
      icon={<Radio className="h-4 w-4" />}
      status="live"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {SCANNER_FEEDS.map((feed) => (
            <TabsTrigger key={feed.id} value={feed.id} className="text-xs px-2">
              {feed.icon} {feed.shortName}
            </TabsTrigger>
          ))}
        </TabsList>

        {SCANNER_FEEDS.map((feed) => (
          <TabsContent key={feed.id} value={feed.id} className="mt-4">
            <AudioPlayer feed={feed} isActive={activeTab === feed.id} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground text-center">
        <p>
          Scanner feeds provided by Broadcastify. Audio may be delayed.
          For emergencies, always call 911.
        </p>
      </div>
    </DashboardCard>
  )
}
