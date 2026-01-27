/**
 * Digest Generation Workflow
 *
 * A durable workflow for generating the "What You Need to Know, Siouxland" digest.
 * Uses Vercel Workflow DevKit for automatic retries and step-level persistence.
 *
 * Benefits over cron-based approach:
 * 1. Each data fetch is a retryable step
 * 2. No HTTP self-calls that timeout
 * 3. Full visibility into each step's status
 * 4. Can resume from failures
 */

import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { aggregateAllData } from '@/lib/digest/fetcher-steps'
import { getDigestSystemPrompt, buildDigestPrompt } from '@/lib/digest/system-prompt'
import { saveDigest, getTodaysDigest, pruneOldDigests } from '@/lib/db/digest'
import { isDatabaseConfigured } from '@/lib/db'
import { getCurrentEdition, type DigestEdition, type DigestData } from '@/lib/digest/types'

export interface DigestWorkflowInput {
  edition?: DigestEdition
  force?: boolean // Skip "already exists" check and regenerate
  draft?: boolean // Save as inactive draft for review before publishing
}

export interface DigestWorkflowOutput {
  success: boolean
  edition: DigestEdition
  digestId?: string
  skipped?: boolean
  message?: string
  generationTimeMs?: number
  error?: string
}

/**
 * Generate digest content using AI
 */
async function generateDigestContent(
  edition: DigestEdition,
  data: DigestData
): Promise<{ summary: string; content: string }> {
  "use step"

  const systemPrompt = getDigestSystemPrompt(edition)
  const userPrompt = buildDigestPrompt(data, edition)

  console.log('[Digest Workflow] Calling AI model...')
  const aiStartTime = Date.now()

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })

  const result = await generateText({
    model: openrouter('anthropic/claude-opus-4.5'),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 4000,
  })

  const aiDuration = Date.now() - aiStartTime
  console.log(`[Digest Workflow] AI generation completed in ${aiDuration}ms`)

  const fullText = result.text

  if (!fullText) {
    throw new Error('AI returned empty response')
  }

  // Parse summary and content from the response
  let summary = ''
  let content = fullText

  const summaryMatch = fullText.match(/\*\*SUMMARY:\*\*\s*([^\n]+(?:\n(?![\n#-]).*)*)/i)
  if (summaryMatch) {
    summary = summaryMatch[1].trim()
    content = fullText.replace(/\*\*SUMMARY:\*\*[^\n]*(?:\n(?![\n#-]).*)*\n*---\n*/i, '').trim()
  } else {
    // Fallback: try to extract first paragraph as summary
    const firstParagraph = fullText.split('\n\n')[0]
    if (firstParagraph && firstParagraph.length < 300 && !firstParagraph.startsWith('#')) {
      summary = firstParagraph.replace(/\*\*SUMMARY:\*\*\s*/i, '').trim()
    }
  }

  return { summary, content }
}

/**
 * Save the digest to the database
 */
async function saveDigestStep(params: {
  edition: DigestEdition
  summary: string
  content: string
  dataSnapshot: DigestData
  generationTimeMs: number
  draft?: boolean
}): Promise<{ id: string } | null> {
  "use step"

  const digest = await saveDigest({
    edition: params.edition,
    summary: params.summary,
    content: params.content,
    dataSnapshot: params.dataSnapshot,
    generationTimeMs: params.generationTimeMs,
    draft: params.draft
  })

  if (!digest) {
    throw new Error('Failed to save digest to database')
  }

  return { id: digest.id }
}

/**
 * Check if today's digest already exists
 */
async function checkExistingDigest(edition: DigestEdition): Promise<{ exists: boolean; digestId?: string }> {
  "use step"

  const existing = await getTodaysDigest(edition)

  if (existing) {
    return { exists: true, digestId: existing.id }
  }

  return { exists: false }
}

/**
 * Prune old digests (wrapped in a step for workflow compatibility)
 */
async function pruneOldDigestsStep(daysToKeep: number): Promise<void> {
  "use step"

  try {
    await pruneOldDigests(daysToKeep)
    console.log(`[Digest Workflow] Successfully pruned digests older than ${daysToKeep} days`)
  } catch (err) {
    console.error('[Digest Workflow] Failed to prune old digests:', err)
  }
}

/**
 * Main digest generation workflow
 *
 * @param input - Optional edition override. If not provided, auto-detects based on time.
 * @returns Workflow result with digest ID or skip reason
 */
export async function digestWorkflow(
  input?: DigestWorkflowInput
): Promise<DigestWorkflowOutput> {
  "use workflow"

  const edition = input?.edition ?? getCurrentEdition()
  const force = input?.force ?? false
  const draft = input?.draft ?? false
  console.log(`[Digest Workflow] Starting ${edition} edition generation${force ? ' (forced)' : ''}${draft ? ' (draft mode)' : ''}`)

  // Check database configuration
  if (!isDatabaseConfigured()) {
    return {
      success: false,
      edition,
      error: 'Database not configured'
    }
  }

  // Check if today's edition already exists (skip if force=true)
  if (!force) {
    const existingCheck = await checkExistingDigest(edition)
    if (existingCheck.exists) {
      console.log(`[Digest Workflow] ${edition} edition already exists for today, skipping`)
      return {
        success: true,
        edition,
        skipped: true,
        digestId: existingCheck.digestId,
        message: `${edition} edition already exists for today`
      }
    }
  } else {
    console.log(`[Digest Workflow] Force flag set, regenerating ${edition} edition`)
  }

  const startTime = Date.now()

  try {
    // Step 1: Aggregate all data (each fetch is a retryable sub-step)
    // Pass edition so school updates are only fetched for morning digest
    console.log('[Digest Workflow] Step 1: Aggregating data from all sources...')
    const digestData = await aggregateAllData(edition)

    // Log what data we got
    console.log('[Digest Workflow] Data aggregation complete. Summary:')
    console.log(`  - Weather: ${digestData.weather.current ? 'YES' : 'NO'}`)
    console.log(`  - Forecast: ${digestData.weather.forecast ? `YES (${digestData.weather.forecast.periods.length} periods)` : 'NO'}`)
    console.log(`  - Alerts: ${digestData.weather.alerts.length}`)
    console.log(`  - Rivers: ${digestData.rivers.length}`)
    console.log(`  - Air Quality: ${digestData.airQuality ? 'YES' : 'NO'}`)
    console.log(`  - Traffic: ${digestData.traffic.length}`)
    console.log(`  - News: ${digestData.news.length}`)
    console.log(`  - Events: ${digestData.events.length}`)
    console.log(`  - Gas Prices: ${digestData.gasPrices ? 'YES' : 'NO'}`)
    console.log(`  - Flights: ${digestData.flights ? 'YES' : 'NO'}`)
    console.log(`  - Schools: ${digestData.schools?.length || 0} (Firecrawl)`)

    // Step 2: Generate AI content
    console.log('[Digest Workflow] Step 2: Generating AI content...')
    const { summary, content } = await generateDigestContent(edition, digestData)
    console.log(`[Digest Workflow] AI content generated. Summary length: ${summary.length}, Content length: ${content.length}`)

    const totalDuration = Date.now() - startTime

    // Step 3: Save to database (as draft if requested)
    const savedDigest = await saveDigestStep({
      edition,
      summary,
      content,
      dataSnapshot: digestData,
      generationTimeMs: totalDuration,
      draft
    })

    if (!savedDigest) {
      return {
        success: false,
        edition,
        error: 'Failed to save digest to database'
      }
    }

    // Prune old digests (as a step so it works in workflow context)
    await pruneOldDigestsStep(30)

    console.log(`[Digest Workflow] ${edition} edition generated successfully in ${totalDuration}ms`)

    return {
      success: true,
      edition,
      digestId: savedDigest.id,
      generationTimeMs: totalDuration
    }
  } catch (error) {
    console.error('[Digest Workflow] Error:', error)
    return {
      success: false,
      edition,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
