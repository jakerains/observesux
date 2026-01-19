import { NextRequest, NextResponse } from 'next/server'
import { start, getRun } from 'workflow/api'
import { gasPricesWorkflow } from '@/workflows/gas-prices'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Helper to get workflow run status and result
 * Note: Run properties like status and returnValue are async getters
 */
async function getRunStatus(runId: string) {
  const run = getRun(runId)
  const status = await run.status

  // Only fetch result if completed
  let result = null
  if (status === 'completed') {
    try {
      result = await run.returnValue
    } catch {
      // Result may not be available yet
    }
  }

  return {
    runId: run.runId,
    status,
    result
  }
}

/**
 * Admin endpoint to manually trigger gas price scraping workflow
 * POST /api/admin/gas-scrape
 * Requires admin password authentication
 */
export async function POST(request: NextRequest) {
  // Verify admin password
  const { password, runId } = await request.json().catch(() => ({ password: '', runId: null }))

  // If runId provided, check status of existing run
  if (runId) {
    try {
      const status = await getRunStatus(runId)
      return NextResponse.json(status)
    } catch {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }
  }

  // Verify password for new workflow starts
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Gas Prices Admin] Starting workflow...')

    // Start the durable workflow
    const run = await start(gasPricesWorkflow, [])

    return NextResponse.json({
      success: true,
      runId: run.runId,
      status: 'started',
      message: 'Gas prices workflow started. Use runId to check status.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gas Prices Admin] Failed to start workflow:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check workflow status
 */
export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get('runId')

  if (!runId) {
    return NextResponse.json({ error: 'runId required' }, { status: 400 })
  }

  try {
    const status = await getRunStatus(runId)
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }
}
