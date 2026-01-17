'use client'

import { useConversation } from '@elevenlabs/react'
import { useCallback, useState, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

// Feature flag - set NEXT_PUBLIC_VOICE_AGENT_ENABLED=true to enable
const VOICE_AGENT_ENABLED = process.env.NEXT_PUBLIC_VOICE_AGENT_ENABLED === 'true'

export function VoiceAgentWidget() {
  // Don't render anything if feature is disabled
  if (!VOICE_AGENT_ENABLED) {
    return null
  }

  return <VoiceAgentWidgetInner />
}

function VoiceAgentWidgetInner() {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice agent connected')
      setIsLoading(false)
      setError(null)
    },
    onDisconnect: () => {
      console.log('Voice agent disconnected')
      setIsLoading(false)
    },
    onError: (error) => {
      console.error('Voice agent error:', error)
      setError('Connection failed. Please try again.')
      setIsLoading(false)
    },
    onMessage: (message) => {
      console.log('Voice agent message:', message)
    },
  })

  // Fetch signed URL on mount
  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const res = await fetch('/api/voice-agent/auth')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to authenticate')
        }
        const data = await res.json()
        setSignedUrl(data.signedUrl)
      } catch (err) {
        console.error('Failed to fetch signed URL:', err)
        setError('Voice agent not available')
      }
    }
    fetchSignedUrl()
  }, [])

  const startConversation = useCallback(async () => {
    if (!signedUrl) {
      setError('Voice agent not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Start the conversation session
      await conversation.startSession({ signedUrl })
    } catch (err) {
      console.error('Failed to start conversation:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone access denied')
      } else {
        setError('Failed to connect. Please try again.')
      }
      setIsLoading(false)
    }
  }, [conversation, signedUrl])

  const endConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  const toggleMute = useCallback(() => {
    if (isMuted) {
      conversation.setVolume({ volume: 1 })
    } else {
      conversation.setVolume({ volume: 0 })
    }
    setIsMuted(!isMuted)
  }, [conversation, isMuted])

  const status: ConnectionStatus = conversation.status as ConnectionStatus
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting' || isLoading

  // Determine button color based on status
  const getButtonStyles = () => {
    if (isConnected) {
      return 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
    }
    if (isConnecting) {
      return 'bg-primary/80 text-primary-foreground'
    }
    if (error) {
      return 'bg-destructive/80 hover:bg-destructive text-destructive-foreground'
    }
    return 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
  }

  // Don't render if no signed URL and there's an error (agent not configured)
  if (!signedUrl && error) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 z-50 flex flex-col items-end gap-2">
      {/* Status/Error message */}
      {error && (
        <div className="bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-bottom-2">
          {error}
        </div>
      )}

      {/* Connection indicator when active */}
      {isConnected && (
        <div className="flex items-center gap-2 bg-background/95 backdrop-blur border rounded-full px-3 py-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium">Listening...</span>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="ml-1 p-1 hover:bg-muted rounded-full transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Main floating button */}
      <button
        onClick={isConnected ? endConversation : startConversation}
        disabled={isConnecting || (!signedUrl && !error)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          getButtonStyles()
        )}
        aria-label={isConnected ? 'End voice conversation' : 'Start voice conversation'}
      >
        {isConnecting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isConnected ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>

      {/* Tooltip on hover when disconnected */}
      {!isConnected && !isConnecting && signedUrl && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Talk to Sioux City Observer
          </div>
        </div>
      )}
    </div>
  )
}
