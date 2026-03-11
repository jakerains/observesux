'use client'

import { useState, useCallback, useRef } from 'react'
import type { CanvasState } from './Canvas'

export interface HistoryEntry {
  state: CanvasState
  timestamp: number
  label: string
}

export interface CanvasHistoryOptions {
  initialEntries?: HistoryEntry[]
  initialIndex?: number
}

export function useCanvasHistory(initialState: CanvasState, options?: CanvasHistoryOptions) {
  // The live state shown in the UI (updates on every keystroke)
  const [currentState, setCurrentState] = useState<CanvasState>(() => {
    if (options?.initialEntries?.length && options.initialIndex !== undefined) {
      return options.initialEntries[options.initialIndex]?.state ?? initialState
    }
    return initialState
  })

  // History stack (only saved on meaningful changes)
  const entriesRef = useRef<HistoryEntry[]>(
    options?.initialEntries?.length
      ? options.initialEntries
      : [{ state: initialState, timestamp: Date.now(), label: 'Initial' }]
  )
  const indexRef = useRef(options?.initialIndex ?? 0)
  // Force re-render when history changes (so canUndo/canRedo update)
  const [, bump] = useState(0)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastCommittedRef = useRef(JSON.stringify(
    options?.initialEntries?.length && options.initialIndex !== undefined
      ? options.initialEntries[options.initialIndex]?.state ?? initialState
      : initialState
  ))

  const commitToHistory = useCallback((state: CanvasState, label: string) => {
    const serialized = JSON.stringify(state)
    // Don't push duplicate entries
    if (serialized === lastCommittedRef.current) return

    // Truncate any "future" entries (after undo)
    entriesRef.current = entriesRef.current.slice(0, indexRef.current + 1)
    entriesRef.current.push({ state, timestamp: Date.now(), label })

    // Cap at 50 entries
    if (entriesRef.current.length > 50) {
      entriesRef.current.shift()
    } else {
      indexRef.current++
    }

    lastCommittedRef.current = serialized
    bump((n) => n + 1)
  }, [])

  // User edits in the canvas — update UI immediately, debounce history save
  const handleChange = useCallback(
    (state: CanvasState) => {
      setCurrentState(state)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        commitToHistory(state, 'Manual edit')
      }, 1500)
    },
    [commitToHistory]
  )

  // AI writes to canvas — update immediately and save to history
  const handleAIWrite = useCallback(
    (state: CanvasState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setCurrentState(state)
      commitToHistory(state, 'AI generated')
    },
    [commitToHistory]
  )

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    indexRef.current--
    const entry = entriesRef.current[indexRef.current]
    setCurrentState(entry.state)
    lastCommittedRef.current = JSON.stringify(entry.state)
    bump((n) => n + 1)
  }, [])

  const redo = useCallback(() => {
    if (indexRef.current >= entriesRef.current.length - 1) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    indexRef.current++
    const entry = entriesRef.current[indexRef.current]
    setCurrentState(entry.state)
    lastCommittedRef.current = JSON.stringify(entry.state)
    bump((n) => n + 1)
  }, [])

  // Jump to a specific history entry
  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= entriesRef.current.length) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    indexRef.current = index
    const entry = entriesRef.current[index]
    setCurrentState(entry.state)
    lastCommittedRef.current = JSON.stringify(entry.state)
    bump((n) => n + 1)
  }, [])

  // Clear canvas and push to history
  const clear = useCallback(() => {
    const emptyState: CanvasState = { contentType: 'free-form', title: '', body: '' }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setCurrentState(emptyState)
    commitToHistory(emptyState, 'Cleared')
  }, [commitToHistory])

  const getSnapshot = useCallback(() => ({
    entries: entriesRef.current,
    currentIndex: indexRef.current,
  }), [])

  return {
    currentState,
    handleChange,
    handleAIWrite,
    undo,
    redo,
    jumpTo,
    clear,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < entriesRef.current.length - 1,
    entries: entriesRef.current,
    currentIndex: indexRef.current,
    getSnapshot,
  }
}
