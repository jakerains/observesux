'use client'

import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, MessageSquare, PenSquare, PanelLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ThreadContent, type ThreadContentHandle } from './ThreadContent'
import { ThreadSidebar } from './ThreadSidebar'
import { useThreads, type ThreadStateSnapshot } from './useThreads'

export function ContentStudioLayout() {
  const {
    threads,
    activeThread,
    activeThreadId,
    createThread,
    switchThread,
    deleteThread,
    renameThread,
    saveThreadState,
  } = useThreads()

  const [mobilePanel, setMobilePanel] = useState<'chat' | 'canvas'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const threadContentRef = useRef<ThreadContentHandle>(null)

  // Save current thread state before switching away
  const saveCurrentThreadState = useCallback(() => {
    if (threadContentRef.current) {
      const snapshot = threadContentRef.current.getState()
      saveThreadState(activeThreadId, snapshot)
    }
  }, [activeThreadId, saveThreadState])

  const handleSwitchThread = useCallback((id: string) => {
    if (id === activeThreadId) return
    saveCurrentThreadState()
    switchThread(id)
    setMobilePanel('chat')
    setSidebarOpen(false)
  }, [activeThreadId, saveCurrentThreadState, switchThread])

  const handleNewThread = useCallback(() => {
    saveCurrentThreadState()
    createThread()
    setMobilePanel('chat')
    setSidebarOpen(false)
  }, [saveCurrentThreadState, createThread])

  const handleDeleteThread = useCallback((id: string) => {
    deleteThread(id)
    setSidebarOpen(false)
  }, [deleteThread])

  const handleStateChange = useCallback((data: ThreadStateSnapshot) => {
    saveThreadState(activeThreadId, data)
  }, [activeThreadId, saveThreadState])

  const handleFirstUserMessage = useCallback((text: string) => {
    const title = text.length > 50 ? text.slice(0, 50) + '…' : text
    renameThread(activeThreadId, title)
  }, [activeThreadId, renameThread])

  const sidebarContent = (
    <ThreadSidebar
      threads={threads}
      activeThreadId={activeThreadId}
      onSelectThread={handleSwitchThread}
      onNewThread={handleNewThread}
      onDeleteThread={handleDeleteThread}
    />
  )

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b shrink-0 bg-background">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Mobile sidebar toggle */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
            <PenSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{activeThread.title}</h1>
          </div>
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
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-60 border-r shrink-0">
          {sidebarContent}
        </div>

        {/* Thread content — key forces remount on thread switch */}
        <ThreadContent
          key={activeThreadId}
          ref={threadContentRef}
          thread={activeThread}
          mobilePanel={mobilePanel}
          onMobilePanelChange={setMobilePanel}
          onStateChange={handleStateChange}
          onFirstUserMessage={handleFirstUserMessage}
        />
      </div>
    </div>
  )
}
