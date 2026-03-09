import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/push/run-check
 * Triggers the alert check cron as an admin action.
 * Adds the CRON_SECRET server-side so the browser never needs it.
 */
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronSecret = process.env.CRON_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cronSecret) headers['Authorization'] = `Bearer ${cronSecret}`

  const res = await fetch(`${baseUrl}/api/cron/check-alerts`, {
    method: 'POST',
    headers,
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
