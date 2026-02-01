import { NextRequest, NextResponse } from 'next/server'
import { start, getRun } from 'workflow/api'
import { digestWorkflow, type DigestWorkflowInput } from '@/../workflows/digest-workflow'
import type { DigestEdition } from '@/lib/digest/types'
import { getCurrentUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Allow up to 2 minutes for workflow operations

/**
 * Verify the request is from Vercel Cron or authorized
 */
async function verifyRequest(request: NextRequest): Promise<boolean> {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isDev = process.env.NODE_ENV === 'development'

  if (isVercelCron || hasValidSecret || isDev) return true

  // Check for authenticated admin user (cookie-based session from admin panel)
  const user = await getCurrentUser()
  if (user && (user as { role?: string }).role === 'admin') return true

  return false
}

/**
 * POST /api/workflow/digest
 * Start a new digest generation workflow
 *
 * Body (optional):
 * - edition: 'morning' | 'midday' | 'evening' (auto-detects if not provided)
 */
export async function POST(request: NextRequest) {
  if (!(await verifyRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse optional body
    let input: DigestWorkflowInput | undefined

    try {
      const body = await request.json()
      if (body.edition && ['morning', 'midday', 'evening'].includes(body.edition)) {
        input = { edition: body.edition as DigestEdition }
      }
    } catch {
      // Empty body is fine, will auto-detect edition
    }

    console.log('[Workflow API] Starting digest workflow', input ? `(${input.edition} edition)` : '(auto-detect)')

    // Start the workflow
    const run = await start(digestWorkflow, input ? [input] : [{}])

    return NextResponse.json({
      success: true,
      workflowRunId: run.runId,
      message: 'Digest workflow started',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Workflow API] Error starting workflow:', error)
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

/**
 * GET /api/workflow/digest?runId=xxx
 * Check the status of a workflow run
 */
export async function GET(request: NextRequest) {
  if (!(await verifyRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runId = request.nextUrl.searchParams.get('runId')

  if (!runId) {
    return NextResponse.json(
      { error: 'Missing runId parameter' },
      { status: 400 }
    )
  }

  try {
    const run = await getRun(runId)

    // Fetch run details in parallel
    const [status, startedAt, completedAt] = await Promise.all([
      run.status,
      run.startedAt,
      run.completedAt
    ])

    // Only fetch return value if completed
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
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Workflow API] Error getting status:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
