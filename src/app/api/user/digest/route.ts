import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { getCurrentUser } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db'
import {
  getLatestDigest,
  getRecentDigests,
  getTodaysDigest,
  getTodaysDigestVersions,
  getDigestById,
  setActiveDigest,
  getDigestsByDate,
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
      try {
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
      } catch (pollError) {
        // Handle WorkflowRunNotFoundError - common in local dev when state is lost
        const errorMessage = pollError instanceof Error ? pollError.message : String(pollError)
        if (errorMessage.includes('not found') || errorMessage.includes('WorkflowRunNotFoundError')) {
          console.warn('[Digest API] Workflow run lost (common in local dev), checking if digest was created...')

          // Check if a digest was created recently for this edition
          const recentDigest = await getTodaysDigest(edition)
          if (recentDigest) {
            const createdRecently = Date.now() - new Date(recentDigest.createdAt).getTime() < 60000 // Within last minute
            if (createdRecently) {
              return NextResponse.json({
                success: true,
                digest: recentDigest,
                workflowRunId: run.runId,
                message: 'Workflow state lost but digest was saved successfully'
              })
            }
          }

          // Workflow state lost and no digest found
          return NextResponse.json({
            success: false,
            error: 'Workflow state lost (local dev issue). Please restart dev server and try again.',
            workflowRunId: run.runId
          }, { status: 500 })
        }
        throw pollError // Re-throw other errors
      }
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
 * - versions: '1' to get all versions for an edition today (admin)
 * - date: Get all digests for a specific date (YYYY-MM-DD)
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
    const wantVersions = searchParams.get('versions') === '1'
    const activeOnly = searchParams.get('activeOnly') !== '0' // Default to active only
    const date = searchParams.get('date')
    const limit = Math.min(parseInt(searchParams.get('limit') || '14', 10), 50)

    // If specific ID requested
    if (digestId) {
      const digest = await getDigestById(digestId)
      if (!digest) {
        return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
      }
      return NextResponse.json({ digest })
    }

    // If requesting all digests for a specific date
    if (date) {
      const digests = await getDigestsByDate(date)
      return NextResponse.json({ digests })
    }

    // If requesting all versions for an edition today (admin feature)
    if (wantVersions && edition && ['morning', 'midday', 'evening'].includes(edition)) {
      const digests = await getTodaysDigestVersions(edition)
      return NextResponse.json({
        digests,
        count: digests.length
      })
    }

    // If specific edition for today requested (returns active only)
    if (edition && ['morning', 'midday', 'evening'].includes(edition)) {
      const digest = await getTodaysDigest(edition)
      return NextResponse.json({
        digest,
        available: !!digest
      })
    }

    // If history requested
    if (wantHistory) {
      const digests = await getRecentDigests(limit, activeOnly)
      return NextResponse.json({
        digests,
        hasMore: digests.length === limit
      })
    }

    // Default: return the latest active digest
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

/**
 * PATCH /api/user/digest
 * Set a specific digest as active (admin only)
 */
export async function PATCH(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    // Auth check - require admin
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for admin role
    const userRole = (user as { role?: string }).role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { digestId } = body

    if (!digestId) {
      return NextResponse.json({ error: 'digestId required' }, { status: 400 })
    }

    const success = await setActiveDigest(digestId)
    if (!success) {
      return NextResponse.json({ error: 'Failed to set active digest' }, { status: 500 })
    }

    const digest = await getDigestById(digestId)
    return NextResponse.json({
      success: true,
      digest
    })
  } catch (error) {
    console.error('[Digest API] Error setting active digest:', error)
    return NextResponse.json(
      { error: 'Failed to set active digest' },
      { status: 500 }
    )
  }
}
