import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Admin endpoint to manually trigger gas price scraping
 * POST /api/admin/gas-scrape
 * Requires admin password authentication
 *
 * This simply proxies to the cron endpoint with proper auth
 */
export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: '' }))

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Gas Prices Admin] Triggering manual scrape...')

    // Call the cron endpoint directly (it will run in this same request)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const cronSecret = process.env.CRON_SECRET

    const response = await fetch(`${baseUrl}/api/cron/gas-prices`, {
      method: 'GET',
      headers: cronSecret
        ? { 'Authorization': `Bearer ${cronSecret}` }
        : {}
    })

    const result = await response.json()

    return NextResponse.json({
      ...result,
      triggeredBy: 'admin',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gas Prices Admin] Failed:', error)
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
 * GET endpoint - just returns instructions
 */
export async function GET() {
  return NextResponse.json({
    message: 'Use POST with { password: "your-admin-password" } to trigger gas price scrape',
    endpoint: '/api/admin/gas-scrape'
  })
}
