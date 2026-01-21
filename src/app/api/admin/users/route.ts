import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { listUsers } from '@/lib/db/users'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Check if current user is an admin
 */
async function isAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const user = await getCurrentUser()
  if (!user) return { isAdmin: false }
  const isAdminUser = (user as { role?: string }).role === 'admin'
  return { isAdmin: isAdminUser, userId: user.id }
}

/**
 * GET /api/admin/users
 * List users with pagination, search, and role filtering
 *
 * Query params:
 * - search: string (optional) - filter by email or name
 * - role: 'admin' | 'user' (optional) - filter by role
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const { isAdmin: isAdminUser } = await isAdmin()

  if (!isAdminUser) {
    return NextResponse.json(
      { error: 'Unauthorized - admin access required' },
      { status: 401 }
    )
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const roleParam = searchParams.get('role')
    const role = roleParam === 'admin' || roleParam === 'user' ? roleParam : undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const result = await listUsers({ search, role, limit, offset })

    return NextResponse.json({
      users: result.users,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    console.error('[Admin Users] List failed:', error)
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    )
  }
}
