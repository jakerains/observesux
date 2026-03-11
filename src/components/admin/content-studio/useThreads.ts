'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { UIMessage } from 'ai'
import type { CanvasState } from './Canvas'
import type { HistoryEntry } from './useCanvasHistory'

const STORAGE_KEY = 'sux_content_studio_threads'
const MAX_THREADS = 30
const MAX_MESSAGES_PER_THREAD = 100
const DB_SAVE_DEBOUNCE_MS = 2000

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

// ── localStorage helpers (fast cache) ────────────────────────

function loadFromLocalStorage(): { threads: Thread[]; activeId: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as { threads: Thread[]; activeId: string }
      if (data.threads?.length > 0) {
        const validActive = data.threads.find((t) => t.id === data.activeId)
        return {
          threads: data.threads,
          activeId: validActive ? data.activeId : data.threads[0].id,
        }
      }
    }
  } catch {
    // corrupted storage
  }
  return null
}

function persistToLocalStorage(threads: Thread[], activeId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads, activeId }))
  } catch {
    // storage full
  }
}

// ── DB API helpers ───────────────────────────────────────────

async function fetchThreadsFromDb(): Promise<Thread[] | null> {
  try {
    const res = await fetch('/api/admin/threads')
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data.threads)) return null

    // Convert DB rows → client Thread objects
    return data.threads.map((row: {
      id: string
      title: string
      messages: unknown[]
      canvasState: Record<string, unknown>
      canvasHistory: Record<string, unknown>
      createdAt: string
      updatedAt: string
    }) => ({
      id: row.id,
      title: row.title,
      messages: row.messages as UIMessage[],
      canvasState: row.canvasState as unknown as CanvasState,
      canvasHistory: row.canvasHistory as unknown as Thread['canvasHistory'],
      createdAt: new Date(row.createdAt).getTime(),
      updatedAt: new Date(row.updatedAt).getTime(),
    }))
  } catch (error) {
    console.error('[useThreads] Failed to fetch from DB:', error)
    return null
  }
}

async function saveThreadToDb(thread: Thread): Promise<void> {
  try {
    await fetch('/api/admin/threads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: thread.id,
        title: thread.title,
        messages: thread.messages,
        canvasState: thread.canvasState,
        canvasHistory: thread.canvasHistory,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      }),
    })
  } catch (error) {
    console.error('[useThreads] Failed to save to DB:', error)
  }
}

async function deleteThreadFromDb(threadId: string): Promise<void> {
  try {
    await fetch('/api/admin/threads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: threadId }),
    })
  } catch (error) {
    console.error('[useThreads] Failed to delete from DB:', error)
  }
}

// ── Hook ─────────────────────────────────────────────────────

export function useThreads() {
  // Initialize from localStorage for immediate render
  const [state, setState] = useState<{ threads: Thread[]; activeId: string }>(() => {
    const cached = loadFromLocalStorage()
    if (cached) return cached
    const t = createBlankThread()
    return { threads: [t], activeId: t.id }
  })

  const [dbLoaded, setDbLoaded] = useState(false)
  const localStorageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dbSaveTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Load from DB on mount — overrides localStorage if DB has data
  useEffect(() => {
    let cancelled = false
    fetchThreadsFromDb().then((dbThreads) => {
      if (cancelled) return
      if (dbThreads && dbThreads.length > 0) {
        setState((prev) => {
          // Merge: DB threads are authoritative, but keep any localStorage-only
          // threads that might have been created while offline
          const dbIds = new Set(dbThreads.map((t) => t.id))
          const localOnly = prev.threads.filter((t) => !dbIds.has(t.id))

          // Only keep local-only threads that have actual content
          const meaningfulLocal = localOnly.filter(
            (t) => t.messages.length > 0 || t.canvasState.body.length > 0
          )

          const merged = [...dbThreads, ...meaningfulLocal].slice(0, MAX_THREADS)
          const activeId = merged.find((t) => t.id === prev.activeId)
            ? prev.activeId
            : merged[0].id

          // Save any local-only threads to DB
          for (const t of meaningfulLocal) {
            saveThreadToDb(t)
          }

          return { threads: merged, activeId }
        })
      } else {
        // DB is empty — push current localStorage threads to DB
        setState((prev) => {
          for (const t of prev.threads) {
            if (t.messages.length > 0 || t.canvasState.body.length > 0) {
              saveThreadToDb(t)
            }
          }
          return prev
        })
      }
      setDbLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  // Debounced localStorage persist (fast, 500ms)
  useEffect(() => {
    if (localStorageTimerRef.current) clearTimeout(localStorageTimerRef.current)
    localStorageTimerRef.current = setTimeout(() => {
      persistToLocalStorage(state.threads, state.activeId)
    }, 500)
    return () => {
      if (localStorageTimerRef.current) clearTimeout(localStorageTimerRef.current)
    }
  }, [state])

  // Schedule a debounced DB save for a specific thread
  const scheduleDbSave = useCallback((threadId: string) => {
    const existing = dbSaveTimersRef.current.get(threadId)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(() => {
      dbSaveTimersRef.current.delete(threadId)
      setState((prev) => {
        const thread = prev.threads.find((t) => t.id === threadId)
        if (thread) saveThreadToDb(thread)
        return prev // no state change
      })
    }, DB_SAVE_DEBOUNCE_MS)

    dbSaveTimersRef.current.set(threadId, timer)
  }, [])

  // Cleanup DB save timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of dbSaveTimersRef.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  const activeThread = state.threads.find((t) => t.id === state.activeId) ?? state.threads[0]

  const createThread = useCallback(() => {
    const newThread = createBlankThread()
    setState((prev) => {
      let threads = [newThread, ...prev.threads]
      if (threads.length > MAX_THREADS) {
        threads = threads.slice(0, MAX_THREADS)
      }
      return { threads, activeId: newThread.id }
    })
    // Save blank thread to DB immediately so it persists
    saveThreadToDb(newThread)
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
    deleteThreadFromDb(id)
  }, [])

  const renameThread = useCallback((id: string, title: string) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((t) =>
        t.id === id ? { ...t, title, updatedAt: Date.now() } : t
      ),
    }))
    scheduleDbSave(id)
  }, [scheduleDbSave])

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
    scheduleDbSave(threadId)
  }, [scheduleDbSave])

  return {
    threads: state.threads,
    activeThread,
    activeThreadId: state.activeId,
    createThread,
    switchThread,
    deleteThread,
    renameThread,
    saveThreadState,
    dbLoaded,
  }
}
