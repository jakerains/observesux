'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { UIMessage } from 'ai'
import type { CanvasState } from './Canvas'
import type { HistoryEntry } from './useCanvasHistory'

const STORAGE_KEY = 'sux_content_studio_threads'
const MAX_THREADS = 30
const MAX_MESSAGES_PER_THREAD = 100

export interface Thread {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: UIMessage[]
  canvasState: CanvasState
  canvasHistory: { entries: HistoryEntry[]; currentIndex: number }
}

export interface ThreadStateSnapshot {
  messages: UIMessage[]
  canvasState: CanvasState
  canvasHistory: { entries: HistoryEntry[]; currentIndex: number }
}

function generateId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createBlankThread(): Thread {
  return {
    id: generateId(),
    title: 'New Thread',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    canvasState: { contentType: 'free-form', title: '', body: '' },
    canvasHistory: {
      entries: [
        {
          state: { contentType: 'free-form', title: '', body: '' },
          timestamp: Date.now(),
          label: 'Initial',
        },
      ],
      currentIndex: 0,
    },
  }
}

function loadThreads(): { threads: Thread[]; activeId: string } {
  if (typeof window === 'undefined') {
    const t = createBlankThread()
    return { threads: [t], activeId: t.id }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as { threads: Thread[]; activeId: string }
      if (data.threads?.length > 0) {
        // Ensure activeId points to a valid thread
        const validActive = data.threads.find((t) => t.id === data.activeId)
        return {
          threads: data.threads,
          activeId: validActive ? data.activeId : data.threads[0].id,
        }
      }
    }
  } catch {
    // corrupted storage, start fresh
  }
  const t = createBlankThread()
  return { threads: [t], activeId: t.id }
}

function persistThreads(threads: Thread[], activeId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads, activeId }))
  } catch {
    // storage full — silently fail
  }
}

export function useThreads() {
  const [state, setState] = useState(() => loadThreads())
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced persist — avoids serializing on every keystroke
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      persistThreads(state.threads, state.activeId)
    }, 500)
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    }
  }, [state])

  const activeThread = state.threads.find((t) => t.id === state.activeId) ?? state.threads[0]

  const createThread = useCallback(() => {
    const newThread = createBlankThread()
    setState((prev) => {
      let threads = [newThread, ...prev.threads]
      // Cap at MAX_THREADS — remove oldest
      if (threads.length > MAX_THREADS) {
        threads = threads.slice(0, MAX_THREADS)
      }
      return { threads, activeId: newThread.id }
    })
    return newThread.id
  }, [])

  const switchThread = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.threads.find((t) => t.id === id)) return prev
      return { ...prev, activeId: id }
    })
  }, [])

  const deleteThread = useCallback((id: string) => {
    setState((prev) => {
      const remaining = prev.threads.filter((t) => t.id !== id)
      if (remaining.length === 0) {
        const fresh = createBlankThread()
        return { threads: [fresh], activeId: fresh.id }
      }
      const activeId = prev.activeId === id ? remaining[0].id : prev.activeId
      return { threads: remaining, activeId }
    })
  }, [])

  const renameThread = useCallback((id: string, title: string) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((t) =>
        t.id === id ? { ...t, title, updatedAt: Date.now() } : t
      ),
    }))
  }, [])

  const saveThreadState = useCallback((threadId: string, data: ThreadStateSnapshot) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: data.messages.slice(-MAX_MESSAGES_PER_THREAD),
              canvasState: data.canvasState,
              canvasHistory: data.canvasHistory,
              updatedAt: Date.now(),
            }
          : t
      ),
    }))
  }, [])

  return {
    threads: state.threads,
    activeThread,
    activeThreadId: state.activeId,
    createThread,
    switchThread,
    deleteThread,
    renameThread,
    saveThreadState,
  }
}
