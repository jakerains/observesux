import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { getAllUserEvents, getUserEventStats } from '@/lib/db/userEvents'
import type { EventSubmissionStatus } from '@/types'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return (user as { role?: string }).role === 'admin'
}

export async function GET(request: NextRequest) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') as EventSubmissionStatus | null
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const statsOnly = searchParams.get('stats') === 'true'

  if (statsOnly) {
    const stats = await getUserEventStats()
    return NextResponse.json(stats)
  }

  const events = await getAllUserEvents({
    status: status || undefined,
    limit,
    offset,
  })

  const stats = await getUserEventStats()

  return NextResponse.json({ events, stats })
}
