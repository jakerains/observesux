import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
 * Triggers council meeting ingestion by calling the SSE ingest endpoint.
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
    console.log('[Council Cron] Triggering council meeting ingestion')

    // Call our own SSE ingestion endpoint and consume the stream
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/workflow/council-ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CRON_SECRET && {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        }),
      },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      throw new Error(`Ingest endpoint returned ${res.status}`)
    }

    // Consume the SSE stream to get the final result
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response stream')

    const decoder = new TextDecoder()
    let buffer = ''
    let finalResult = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Look for complete event
      const completeMatch = buffer.match(/event: complete\ndata: (.+?)\n\n/)
      if (completeMatch) {
        finalResult = JSON.parse(completeMatch[1])
        break
      }
    }

    console.log('[Council Cron] Ingestion complete:', finalResult)

    return NextResponse.json({
      success: true,
      result: finalResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Council Cron] Error:', error)
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

export async function POST(request: NextRequest) {
  return GET(request)
}
