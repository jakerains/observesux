import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { getCurrentUser } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db'
import {
  getLatestDigest,
  getRecentDigests,
  getTodaysDigest,
  getDigestById,
} from '@/lib/db/digest'
import { digestWorkflow } from '@/../workflows/digest-workflow'
import { getCurrentEdition, type DigestEdition } from '@/lib/digest/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for starting workflow

/**
 * POST /api/user/digest
 * Trigger digest generation workflow for an edition
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get edition and force flag from request body
    let edition: DigestEdition = getCurrentEdition()
    let force = false
    try {
      const body = await request.json()
      if (body.edition && ['morning', 'midday', 'evening'].includes(body.edition)) {
        edition = body.edition
      }
      if (body.force === true) {
        force = true
      }
    } catch {
      // No body or invalid JSON - use auto-detected edition
    }

    console.log(`[Digest API] Starting ${edition} edition workflow${force ? ' (forced)' : ''}`)

    // Start the durable workflow
    const run = await start(digestWorkflow, [{ edition, force }])

    console.log(`[Digest API] Workflow started with run ID: ${run.runId}`)

    // Wait for the workflow to complete (poll status)
    // This allows the admin UI to get a synchronous response
    const maxWaitMs = 55_000 // Leave buffer for response
    const pollIntervalMs = 2_000
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      const status = await run.status

      if (status === 'completed') {
        // Get the result
        const result = await run.returnValue

        if (result.success && result.digestId) {
          // Fetch the saved digest to return
          const digest = await getDigestById(result.digestId)
          return NextResponse.json({
            success: true,
            digest,
            workflowRunId: run.runId,
            generationTimeMs: result.generationTimeMs
          })
        } else if (result.skipped) {
          // Edition already exists
          const digest = result.digestId ? await getDigestById(result.digestId) : null
          return NextResponse.json({
            success: true,
            skipped: true,
            message: result.message,
            digest
          })
        } else {
          return NextResponse.json({
            success: false,
            error: result.error || 'Workflow completed without success'
          }, { status: 500 })
        }
      }

      if (status === 'failed' || status === 'cancelled') {
        return NextResponse.json({
          success: false,
          error: `Workflow ${status}`,
          workflowRunId: run.runId
        }, { status: 500 })
      }

      // Still running - wait and poll again
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
    }

    // Workflow is still running after max wait
    return NextResponse.json({
      success: true,
      pending: true,
      message: 'Workflow started but still running',
      workflowRunId: run.runId
    })
  } catch (error) {
    console.error('[Digest API] Error starting workflow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start digest workflow' },
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
