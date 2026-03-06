import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingExpoPushReceipts,
  updateExpoPushReceiptStatus,
  deactivateExpoPushToken,
  cleanupOldExpoPushReceipts,
} from '@/lib/db/expo-push'
import { logCronRun } from '@/lib/db/historical'
import { chunkExpoPushReceiptIds, getExpoPushReceipts } from '@/lib/push/send-expo'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function verifyCronRequest(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isDev = process.env.NODE_ENV === 'development'
  return isVercelCron || hasValidSecret || isDev
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date()

  try {
    // Get pending receipts older than 30 minutes
    const pendingReceipts = await getPendingExpoPushReceipts(30)

    if (pendingReceipts.length === 0) {
      const cleaned = await cleanupOldExpoPushReceipts()
      await logCronRun('check-expo-receipts', 'skipped', startedAt, { checked: 0, ok: 0, errors: 0, deactivated: 0, cleaned })
      return NextResponse.json({ checked: 0, ok: 0, errors: 0, deactivated: 0, cleaned })
    }

    let checked = 0, okCount = 0, errorCount = 0, deactivated = 0

    // Chunk receipt IDs (max 300 per request)
    const receiptIds = pendingReceipts.map(r => r.receiptId)
    const chunks = chunkExpoPushReceiptIds(receiptIds)

    for (const chunk of chunks) {
      const receipts = await getExpoPushReceipts(chunk)

      for (const receiptId of chunk) {
        const receipt = receipts[receiptId]
        if (!receipt) continue

        // Find the pending record to get the token
        const pending = pendingReceipts.find(r => r.receiptId === receiptId)
        checked++

        if (receipt.status === 'ok') {
          okCount++
          await updateExpoPushReceiptStatus(receiptId, 'ok')
        } else if (receipt.status === 'error') {
          errorCount++
          const errorType = receipt.details?.error
          await updateExpoPushReceiptStatus(receiptId, 'error', errorType, receipt.message)

          if (errorType === 'DeviceNotRegistered' && pending?.expoPushToken) {
            await deactivateExpoPushToken(pending.expoPushToken)
            deactivated++
          }
        }
      }
    }

    const cleaned = await cleanupOldExpoPushReceipts()

    await logCronRun('check-expo-receipts', 'success', startedAt, { checked, ok: okCount, errors: errorCount, deactivated, cleaned })

    return NextResponse.json({
      success: true,
      checked,
      ok: okCount,
      errors: errorCount,
      deactivated,
      cleaned,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Expo Receipt Check] Error:', error)
    await logCronRun('check-expo-receipts', 'error', startedAt, undefined, error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
