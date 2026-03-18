'use client'

import { useState, useCallback, useRef } from 'react'

export type PipelineStep =
  | 'idle'
  | 'saving'
  | 'chunking'
  | 'embedding'
  | 'recap'
  | 'done'
  | 'error'

export interface PipelineLogEntry {
  step: string
  message: string
}

export interface PipelineProgress {
  embeddedSoFar: number
  totalChunks: number
  transcriptLength: number
  segmentCount: number
}

export interface PipelineState {
  active: boolean
  meetingId: string | null
  currentStep: PipelineStep
  progress: PipelineProgress
  error: string | null
  log: PipelineLogEntry[]
}

const initialState: PipelineState = {
  active: false,
  meetingId: null,
  currentStep: 'idle',
  progress: { embeddedSoFar: 0, totalChunks: 0, transcriptLength: 0, segmentCount: 0 },
  error: null,
  log: [],
}

/**
 * Client-side orchestrator for the manual meeting pipeline.
 *
 * Calls the pipeline API endpoints sequentially:
 *   save-transcript → chunk-and-embed (batched) → generate-recap
 *
 * Each endpoint is a short-lived serverless function (~60s max,
 * except generate-recap which gets 300s). The browser drives the loop,
 * so no single function needs to run for the full pipeline duration.
 */
export function useManualPipeline() {
  const [state, setState] = useState<PipelineState>(initialState)
  const abortRef = useRef<AbortController | null>(null)

  const addLog = useCallback((step: string, message: string) => {
    setState(prev => ({
      ...prev,
      log: [...prev.log, { step, message }],
    }))
  }, [])

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setState(initialState)
  }, [])

  /**
   * Run the full pipeline: save-transcript → chunk → embed batches → recap
   */
  const run = useCallback(async (
    meetingId: string,
    options: { transcript?: string } = {}
  ) => {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setState({
      active: true,
      meetingId,
      currentStep: 'saving',
      progress: { embeddedSoFar: 0, totalChunks: 0, transcriptLength: 0, segmentCount: 0 },
      error: null,
      log: [],
    })

    try {
      // Step 1: Save transcript
      addLog('transcript', options.transcript
        ? `Saving uploaded transcript (${options.transcript.length.toLocaleString()} chars)...`
        : 'Fetching transcript from YouTube...')

      const saveRes = await fetch('/api/council-meetings/pipeline/save-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, transcript: options.transcript }),
        signal,
      })

      if (!saveRes.ok) {
        const data = await saveRes.json()
        throw new Error(data.error || `Save transcript failed (${saveRes.status})`)
      }

      const saveData = await saveRes.json()
      addLog('transcript', `Got ${saveData.segmentCount} segments (${(saveData.transcriptLength / 1000).toFixed(0)}K chars)`)

      setState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          transcriptLength: saveData.transcriptLength,
          segmentCount: saveData.segmentCount,
        },
      }))

      // Step 2: Chunk transcript (first call without batchStart)
      setState(prev => ({ ...prev, currentStep: 'chunking' }))
      addLog('chunk', 'Chunking transcript...')

      const chunkRes = await fetch('/api/council-meetings/pipeline/chunk-and-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId }),
        signal,
      })

      if (!chunkRes.ok) {
        const data = await chunkRes.json()
        throw new Error(data.error || `Chunking failed (${chunkRes.status})`)
      }

      const chunkData = await chunkRes.json()
      const totalChunks = chunkData.totalChunks
      addLog('chunk', `Created ${totalChunks} chunks`)

      setState(prev => ({
        ...prev,
        currentStep: 'embedding',
        progress: { ...prev.progress, totalChunks, embeddedSoFar: 0 },
      }))

      // Step 3: Embed in batches of 10
      if (totalChunks > 0) {
        const BATCH_SIZE = 10
        for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
          if (signal.aborted) throw new Error('Pipeline cancelled')

          const batchEnd = Math.min(i + BATCH_SIZE, totalChunks)
          addLog('embeddings', `Embedding chunks ${i + 1}–${batchEnd}/${totalChunks}...`)

          const embedRes = await fetch('/api/council-meetings/pipeline/chunk-and-embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meetingId, batchStart: i }),
            signal,
          })

          if (!embedRes.ok) {
            const data = await embedRes.json()
            throw new Error(data.error || `Embedding failed (${embedRes.status})`)
          }

          const embedData = await embedRes.json()
          setState(prev => ({
            ...prev,
            progress: { ...prev.progress, embeddedSoFar: embedData.embeddedSoFar },
          }))

          addLog('embeddings', `Embeddings: ${embedData.embeddedSoFar}/${totalChunks}`)
        }
      }

      addLog('store', 'Transcript & embeddings saved.')

      // Step 4: Generate recap
      setState(prev => ({ ...prev, currentStep: 'recap' }))
      addLog('recap', `Generating AI recap (${(saveData.transcriptLength / 1000).toFixed(0)}K chars)...`)

      const recapRes = await fetch('/api/council-meetings/pipeline/generate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId }),
        signal,
      })

      if (!recapRes.ok) {
        const data = await recapRes.json()
        throw new Error(data.error || `Recap generation failed (${recapRes.status})`)
      }

      const recapData = await recapRes.json()
      addLog('recap', `Recap: ${recapData.recap.topicCount} topics, ${recapData.recap.decisionCount} decisions`)

      addLog('done', 'Draft ready for review')
      setState(prev => ({ ...prev, active: false, currentStep: 'done' }))
    } catch (error) {
      if (signal.aborted) return
      const message = error instanceof Error ? error.message : 'Unknown error'
      addLog('error', `Error: ${message}`)
      setState(prev => ({
        ...prev,
        active: false,
        currentStep: 'error',
        error: message,
      }))
    }
  }, [addLog])

  /**
   * Run recap-only (skips transcript + chunk + embed).
   * Used when the meeting already has a transcript saved.
   */
  const runRecapOnly = useCallback(async (meetingId: string) => {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setState({
      active: true,
      meetingId,
      currentStep: 'recap',
      progress: { embeddedSoFar: 0, totalChunks: 0, transcriptLength: 0, segmentCount: 0 },
      error: null,
      log: [],
    })

    try {
      addLog('recap', 'Generating AI recap from existing transcript...')

      const recapRes = await fetch('/api/council-meetings/pipeline/generate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId }),
        signal,
      })

      if (!recapRes.ok) {
        const data = await recapRes.json()
        throw new Error(data.error || `Recap generation failed (${recapRes.status})`)
      }

      const recapData = await recapRes.json()
      addLog('recap', `Recap: ${recapData.recap.topicCount} topics, ${recapData.recap.decisionCount} decisions`)

      addLog('done', 'Draft ready for review')
      setState(prev => ({ ...prev, active: false, currentStep: 'done' }))
    } catch (error) {
      if (signal.aborted) return
      const message = error instanceof Error ? error.message : 'Unknown error'
      addLog('error', `Error: ${message}`)
      setState(prev => ({
        ...prev,
        active: false,
        currentStep: 'error',
        error: message,
      }))
    }
  }, [addLog])

  return { state, run, runRecapOnly, reset }
}
