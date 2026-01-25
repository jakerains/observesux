import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { digestWorkflow } from '@/../workflows/digest-workflow'
import { isDatabaseConfigured } from '@/lib/db'
import { getCurrentEdition } from '@/lib/digest/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for starting the workflow

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
 * Triggers the digest generation workflow based on current time of day
 *
 * This endpoint is called by Vercel Cron at scheduled times.
 * Instead of executing the digest generation inline (which caused timeouts),
 * it now starts a durable workflow that handles retries and persistence.
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
    console.log(`[Digest Cron] Triggering ${edition} edition workflow`)

    // Start the durable workflow
    const run = await start(digestWorkflow, [{ edition }])

    console.log(`[Digest Cron] Workflow started with run ID: ${run.runId}`)

    return NextResponse.json({
      success: true,
      edition,
      workflowRunId: run.runId,
      message: `${edition} edition workflow started`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Digest Cron] Error starting workflow:', error)
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
