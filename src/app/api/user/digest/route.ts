import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getCurrentUser } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db'
import {
  saveDigest,
  getLatestDigest,
  getRecentDigests,
  getTodaysDigest,
  getDigestById,
  pruneOldDigests
} from '@/lib/db/digest'
import { aggregateDigestData } from '@/lib/digest/data-aggregator'
import { getDigestSystemPrompt, buildDigestPrompt } from '@/lib/digest/system-prompt'
import { getCurrentEdition, type DigestEdition } from '@/lib/digest/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for generation

/**
 * POST /api/user/digest
 * Generate a new community digest for an edition
 * Requires authentication (for now - could be admin-only or cron in future)
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    // Auth check - in future this could be restricted to admin/cron
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get edition from request body, or auto-detect based on time of day
    let edition: DigestEdition = getCurrentEdition()
    try {
      const body = await request.json()
      if (body.edition && ['morning', 'midday', 'evening'].includes(body.edition)) {
        edition = body.edition
      }
      // If body.edition is 'auto' or not specified, use the auto-detected edition
    } catch {
      // No body or invalid JSON - use auto-detected edition
    }

    console.log(`[Digest API] Generating ${edition} edition digest`)
    const startTime = Date.now()

    // Aggregate all data sources
    const digestData = await aggregateDigestData()

    // Generate the digest using AI
    const systemPrompt = getDigestSystemPrompt(edition)
    const userPrompt = buildDigestPrompt(digestData, edition)

    console.log('[Digest API] Calling GPT-5.2...')
    const aiStartTime = Date.now()

    const result = await generateText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
      temperature: 0.7
    })

    const aiDuration = Date.now() - aiStartTime
    console.log(`[Digest API] AI generation completed in ${aiDuration}ms`)

    const fullText = result.text

    if (!fullText) {
      return NextResponse.json(
        { error: 'Failed to generate digest content' },
        { status: 500 }
      )
    }

    // Parse summary and content from the response
    // Expected format: "**SUMMARY:** [summary text]\n\n---\n\n[main content]"
    let summary = ''
    let content = fullText

    // Look for SUMMARY line - match until we hit the separator or first heading
    const summaryMatch = fullText.match(/\*\*SUMMARY:\*\*\s*([^\n]+(?:\n(?![\n#-]).*)*)/i)
    if (summaryMatch) {
      summary = summaryMatch[1].trim()
      // Remove the summary section from content (summary + separator)
      content = fullText.replace(/\*\*SUMMARY:\*\*[^\n]*(?:\n(?![\n#-]).*)*\n*---\n*/i, '').trim()
    } else {
      // Fallback: try to extract first paragraph as summary
      const firstParagraph = fullText.split('\n\n')[0]
      if (firstParagraph && firstParagraph.length < 300 && !firstParagraph.startsWith('#')) {
        summary = firstParagraph.replace(/\*\*SUMMARY:\*\*\s*/i, '').trim()
      }
    }

    console.log(`[Digest API] Parsed summary (${summary.length} chars) and content (${content.length} chars)`)

    const totalDuration = Date.now() - startTime

    // Save the digest to database (upserts - replaces existing for same edition/date)
    const digest = await saveDigest({
      edition,
      summary,
      content,
      dataSnapshot: digestData,
      generationTimeMs: totalDuration
    })

    if (!digest) {
      // Still return the digest even if save failed
      console.error('[Digest API] Failed to save digest to database')
      return NextResponse.json({
        success: true,
        digest: {
          id: 'unsaved',
          edition,
          date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }),
          summary,
          content,
          dataSnapshot: digestData,
          generationTimeMs: totalDuration,
          createdAt: new Date().toISOString()
        },
        warning: 'Digest generated but not saved'
      })
    }

    // Prune old digests asynchronously (don't block response)
    pruneOldDigests(30).catch(err =>
      console.error('[Digest API] Failed to prune old digests:', err)
    )

    console.log(`[Digest API] ${edition} edition generated successfully in ${totalDuration}ms`)

    return NextResponse.json({
      success: true,
      digest
    })
  } catch (error) {
    console.error('[Digest API] Error generating digest:', error)
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/digest
 * Get the latest digest or digest history (public - no auth required)
 *
 * Query params:
 * - edition: 'morning' | 'midday' | 'evening' - Get today's specific edition
 * - id: Get a specific digest by ID
 * - history: '1' to get recent history instead of just latest
 * - limit: Number of historical digests to return (default 14)
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const edition = searchParams.get('edition') as DigestEdition | null
    const digestId = searchParams.get('id')
    const wantHistory = searchParams.get('history') === '1'
    const limit = Math.min(parseInt(searchParams.get('limit') || '14', 10), 50)

    // If specific ID requested
    if (digestId) {
      const digest = await getDigestById(digestId)
      if (!digest) {
        return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
      }
      return NextResponse.json({ digest })
    }

    // If specific edition for today requested
    if (edition && ['morning', 'midday', 'evening'].includes(edition)) {
      const digest = await getTodaysDigest(edition)
      return NextResponse.json({
        digest,
        available: !!digest
      })
    }

    // If history requested
    if (wantHistory) {
      const digests = await getRecentDigests(limit)
      return NextResponse.json({
        digests,
        hasMore: digests.length === limit
      })
    }

    // Default: return the latest digest
    const digest = await getLatestDigest()
    return NextResponse.json({
      digest,
      available: !!digest
    })
  } catch (error) {
    console.error('[Digest API] Error fetching digest:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digest' },
      { status: 500 }
    )
  }
}
