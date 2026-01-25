import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { isDatabaseConfigured } from '@/lib/db'
import { saveDigest, getTodaysDigest, pruneOldDigests } from '@/lib/db/digest'
import { aggregateDigestData } from '@/lib/digest/data-aggregator'
import { getDigestSystemPrompt, buildDigestPrompt } from '@/lib/digest/system-prompt'
import { getCurrentEdition, type DigestEdition } from '@/lib/digest/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for generation

/**
 * Verify the request is from Vercel Cron or authorized
 */
function verifyCronRequest(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isDev = process.env.NODE_ENV === 'development'

  return isVercelCron || hasValidSecret || isDev
}

/**
 * GET /api/cron/digest
 * Auto-generate a digest based on current time of day
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    console.warn('[Digest Cron] Unauthorized request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    // Auto-detect the current edition based on time of day
    const edition = getCurrentEdition()
    console.log(`[Digest Cron] Starting ${edition} edition generation`)

    // Check if today's edition already exists
    const existingDigest = await getTodaysDigest(edition)
    if (existingDigest) {
      console.log(`[Digest Cron] ${edition} edition already exists for today, skipping`)
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `${edition} edition already exists for today`,
        digestId: existingDigest.id,
        timestamp: new Date().toISOString()
      })
    }

    const startTime = Date.now()

    // Aggregate all data sources
    const digestData = await aggregateDigestData()

    // Generate the digest using AI
    const systemPrompt = getDigestSystemPrompt(edition)
    const userPrompt = buildDigestPrompt(digestData, edition)

    console.log('[Digest Cron] Calling AI model...')
    const aiStartTime = Date.now()

    const result = await generateText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
      temperature: 0.7
    })

    const aiDuration = Date.now() - aiStartTime
    console.log(`[Digest Cron] AI generation completed in ${aiDuration}ms`)

    const fullText = result.text

    if (!fullText) {
      return NextResponse.json(
        { error: 'Failed to generate digest content' },
        { status: 500 }
      )
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

    const totalDuration = Date.now() - startTime

    // Save the digest to database
    const digest = await saveDigest({
      edition,
      summary,
      content,
      dataSnapshot: digestData,
      generationTimeMs: totalDuration
    })

    if (!digest) {
      console.error('[Digest Cron] Failed to save digest to database')
      return NextResponse.json(
        { error: 'Failed to save digest' },
        { status: 500 }
      )
    }

    // Prune old digests asynchronously (don't block response)
    pruneOldDigests(30).catch(err =>
      console.error('[Digest Cron] Failed to prune old digests:', err)
    )

    console.log(`[Digest Cron] ${edition} edition generated successfully in ${totalDuration}ms`)

    return NextResponse.json({
      success: true,
      edition,
      digestId: digest.id,
      summaryLength: summary.length,
      contentLength: content.length,
      generationTimeMs: totalDuration,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Digest Cron] Error generating digest:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST also supported for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}
