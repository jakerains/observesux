import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { gasPricesWorkflow } from '@/workflows/gas-prices'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Cron just starts the workflow, doesn't wait

/**
 * Cron endpoint to start gas price scraping workflow
 * Runs daily at 6 AM CST (12:00 UTC) via Vercel Cron
 *
 * GET /api/cron/gas-prices (Vercel cron sends GET)
 * Vercel automatically authenticates cron requests
 */
function verifyCronRequest(request: NextRequest): boolean {
  // Method 1: Vercel cron sends this header automatically
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  // Method 2: Check CRON_SECRET if configured (for manual testing)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  // Method 3: Allow in development
  const isDev = process.env.NODE_ENV === 'development'

  console.log('[Gas Prices Cron] Auth check:', {
    isVercelCron,
    hasValidSecret: !!hasValidSecret,
    isDev,
  })

  return isVercelCron || hasValidSecret || isDev
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    console.warn('[Gas Prices Cron] Unauthorized request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Gas Prices Cron] Starting workflow...')

    // Start the durable workflow - it will handle retries automatically
    const run = await start(gasPricesWorkflow, [])

    console.log('[Gas Prices Cron] Workflow started:', run.runId)

    return NextResponse.json({
      success: true,
      runId: run.runId,
      message: 'Gas prices workflow started',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gas Prices Cron] Failed to start workflow:', error)
    return NextResponse.json(
      {
        error: 'Failed to start workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
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
