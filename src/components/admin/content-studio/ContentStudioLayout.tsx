'use client'

import { useState, useCallback } from 'react'
import { ArrowLeft, MessageSquare, PenSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AdminChat } from './AdminChat'
import { Canvas, type CanvasState } from './Canvas'

export function ContentStudioLayout() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    contentType: 'free-form',
    title: '',
    body: '',
  })
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'canvas'>('chat')

  const handleWriteToCanvas = useCallback((state: CanvasState) => {
    setCanvasState(state)
    // On mobile, switch to canvas view when content is written
    setMobilePanel('canvas')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b shrink-0 bg-background">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <PenSquare className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-sm font-semibold">Content Studio</h1>
        </div>

        {/* Mobile panel switcher */}
        <div className="flex items-center gap-1 ml-auto md:hidden">
          <Button
            variant={mobilePanel === 'chat' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMobilePanel('chat')}
          >
            <MessageSquare className="h-3 w-3" />
            Chat
          </Button>
          <Button
            variant={mobilePanel === 'canvas' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMobilePanel('canvas')}
          >
            <PenSquare className="h-3 w-3" />
            Canvas
            {canvasState.body.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
          </Button>
        </div>
      </header>

      {/* Main content - side by side on desktop, tabbed on mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_1.2fr]">
        {/* Chat panel */}
        <div className={cn(
          'min-h-0 border-r',
          mobilePanel !== 'chat' && 'hidden md:block'
        )}>
          <AdminChat
            canvasState={canvasState}
            onWriteToCanvas={handleWriteToCanvas}
          />
        </div>

        {/* Canvas panel */}
        <div className={cn(
          'min-h-0',
          mobilePanel !== 'canvas' && 'hidden md:block'
        )}>
          <Canvas
            state={canvasState}
            onChange={setCanvasState}
          />
        </div>
      </div>
    </div>
  )
}
