import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import { logCronRun } from '@/lib/db/historical'
import { verifyCronRequest } from '@/lib/utils/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

  const startedAt = new Date()

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
    let finalResult: Record<string, unknown> | null = null

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

    if (finalResult) {
      await logCronRun('ingest-meetings', 'success', startedAt, {
        processed: finalResult.processed,
        skipped: finalResult.skipped,
        failed: finalResult.failed,
        noCaptions: finalResult.noCaptions,
      })
    } else {
      await logCronRun('ingest-meetings', 'error', startedAt, undefined, 'Stream ended without complete event')
    }

    return NextResponse.json({
      success: true,
      result: finalResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Council Cron] Error:', error)
    await logCronRun('ingest-meetings', 'error', startedAt, undefined, error instanceof Error ? error.message : 'Unknown error')
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
