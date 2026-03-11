'use client'

import { forwardRef, useImperativeHandle, useCallback, useRef, useEffect } from 'react'
import type { UIMessage } from 'ai'
import { cn } from '@/lib/utils'
import { AdminChat } from './AdminChat'
import { Canvas, type CanvasState } from './Canvas'
import { useCanvasHistory } from './useCanvasHistory'
import type { Thread, ThreadStateSnapshot } from './useThreads'

export interface ThreadContentHandle {
  getState: () => ThreadStateSnapshot
}

interface ThreadContentProps {
  thread: Thread
  mobilePanel: 'chat' | 'canvas'
  onMobilePanelChange: (panel: 'chat' | 'canvas') => void
  onStateChange: (data: ThreadStateSnapshot) => void
  onFirstUserMessage: (text: string) => void
}

export const ThreadContent = forwardRef<ThreadContentHandle, ThreadContentProps>(
  function ThreadContent({ thread, mobilePanel, onMobilePanelChange, onStateChange, onFirstUserMessage }, ref) {
    const {
      currentState: canvasState,
      handleChange,
      handleAIWrite,
      undo,
      redo,
      jumpTo,
      clear,
      canUndo,
      canRedo,
      entries,
      currentIndex,
      getSnapshot,
    } = useCanvasHistory(thread.canvasState, {
      initialEntries: thread.canvasHistory.entries,
      initialIndex: thread.canvasHistory.currentIndex,
    })

    const latestMessagesRef = useRef<UIMessage[]>(thread.messages)

    // Stable refs for values needed in auto-save (avoids callback recreation)
    const canvasStateRef = useRef(canvasState)
    canvasStateRef.current = canvasState
    const onStateChangeRef = useRef(onStateChange)
    onStateChangeRef.current = onStateChange

    // Expose getState for parent to snapshot before thread switch
    useImperativeHandle(ref, () => ({
      getState: () => ({
        messages: latestMessagesRef.current,
        canvasState: canvasStateRef.current,
        canvasHistory: getSnapshot(),
      }),
    }), [getSnapshot])

    // Debounced auto-save — stable callback, reads current values from refs
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
    const scheduleAutoSave = useCallback(() => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        onStateChangeRef.current({
          messages: latestMessagesRef.current,
          canvasState: canvasStateRef.current,
          canvasHistory: getSnapshot(),
        })
      }, 3000)
    }, [getSnapshot])

    // Auto-save when canvas state changes
    useEffect(() => {
      scheduleAutoSave()
    }, [canvasState, scheduleAutoSave])

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      }
    }, [])

    const handleWriteToCanvas = useCallback((state: CanvasState) => {
      handleAIWrite(state)
      onMobilePanelChange('canvas')
    }, [handleAIWrite, onMobilePanelChange])

    const handleMessagesChange = useCallback((messages: UIMessage[]) => {
      latestMessagesRef.current = messages
      scheduleAutoSave()
    }, [scheduleAutoSave])

    return (
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_1.2fr]">
        {/* Chat panel */}
        <div className={cn(
          'min-h-0 border-r',
          mobilePanel !== 'chat' && 'hidden md:block'
        )}>
          <AdminChat
            canvasState={canvasState}
            onWriteToCanvas={handleWriteToCanvas}
            initialMessages={thread.messages.length > 0 ? thread.messages : undefined}
            onMessagesChange={handleMessagesChange}
            onFirstUserMessage={onFirstUserMessage}
          />
        </div>

        {/* Canvas panel */}
        <div className={cn(
          'min-h-0',
          mobilePanel !== 'canvas' && 'hidden md:block'
        )}>
          <Canvas
            state={canvasState}
            onChange={handleChange}
            onClear={clear}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            historyEntries={entries}
            historyIndex={currentIndex}
            onJumpTo={jumpTo}
          />
        </div>
      </div>
    )
  }
)
