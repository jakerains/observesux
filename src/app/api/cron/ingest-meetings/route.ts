import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { councilIngestWorkflow } from '@/../workflows/council-ingest-workflow'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
 * GET /api/cron/ingest-meetings
 * Triggers the council meeting ingestion workflow.
 * Called by Vercel Cron on Monday night and Tuesday morning.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    console.warn('[Council Cron] Unauthorized request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    console.log('[Council Cron] Triggering council meeting ingestion workflow')

    const run = await start(councilIngestWorkflow, [{}])

    console.log(`[Council Cron] Workflow started with run ID: ${run.runId}`)

    return NextResponse.json({
      success: true,
      workflowRunId: run.runId,
      message: 'Council meeting ingestion workflow started',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Council Cron] Error starting workflow:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// POST also supported for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}
