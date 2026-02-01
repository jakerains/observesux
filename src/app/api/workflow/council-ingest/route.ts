import { NextRequest, NextResponse } from 'next/server'
import { start, getRun } from 'workflow/api'
import { councilIngestWorkflow } from '@/../workflows/council-ingest-workflow'
import type { CouncilWorkflowInput } from '@/types/council-meetings'
import { getCouncilIngestStats, getRecentMeetings } from '@/lib/db/council-meetings'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Verify the request is authorized
 */
function verifyRequest(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isDev = process.env.NODE_ENV === 'development'

  return isVercelCron || hasValidSecret || isDev
}

/**
 * POST /api/workflow/council-ingest
 * Start a new council meeting ingestion workflow
 */
export async function POST(request: NextRequest) {
  if (!verifyRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let input: CouncilWorkflowInput | undefined

    try {
      const body = await request.json()
      if (body.force) {
        input = { force: true }
      }
    } catch {
      // Empty body is fine
    }

    console.log('[Council Workflow API] Starting council ingest workflow', input?.force ? '(forced)' : '')

    const run = await start(councilIngestWorkflow, input ? [input] : [{}])

    return NextResponse.json({
      success: true,
      workflowRunId: run.runId,
      message: 'Council ingestion workflow started',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Council Workflow API] Error starting workflow:', error)
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

/**
 * GET /api/workflow/council-ingest
 * - No params: returns stats and recent meetings
 * - ?runId=xxx: returns workflow run status
 */
export async function GET(request: NextRequest) {
  if (!verifyRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runId = request.nextUrl.searchParams.get('runId')

  // If runId provided, check workflow status
  if (runId) {
    try {
      const run = await getRun(runId)

      const [status, startedAt, completedAt] = await Promise.all([
        run.status,
        run.startedAt,
        run.completedAt,
      ])

      let output = undefined
      if (status === 'completed') {
        try {
          output = await run.returnValue
        } catch {
          // returnValue may fail if not yet available
        }
      }

      return NextResponse.json({
        runId,
        status,
        output,
        startedAt,
        completedAt,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[Council Workflow API] Error getting status:', error)
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }

  // No runId: return stats and recent meetings
  try {
    const [stats, recentMeetings] = await Promise.all([
      getCouncilIngestStats(),
      getRecentMeetings(20),
    ])

    return NextResponse.json({
      stats,
      recentMeetings,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Council Workflow API] Error getting stats:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
