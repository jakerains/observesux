import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { getUserById, getUserActivity, updateUserRole, deleteUserAppData } from '@/lib/db/users'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Check if current user is an admin and return their ID
 */
async function isAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const user = await getCurrentUser()
  if (!user) return { isAdmin: false }
  const isAdminUser = (user as { role?: string }).role === 'admin'
  return { isAdmin: isAdminUser, userId: user.id }
}

interface RouteParams {
  params: Promise<{ userId: string }>
}

/**
 * GET /api/admin/users/[userId]
 * Get user details and activity
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const { userId } = await params

    // Fetch user and activity in parallel
    const [user, activity] = await Promise.all([
      getUserById(userId),
      getUserActivity(userId)
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user,
      activity
    })
  } catch (error) {
    console.error('[Admin Users] Get user failed:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * Update user role
 *
 * Body: { role: 'admin' | 'user' }
 *
 * Security:
 * - Admin cannot demote themselves
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { isAdmin: isAdminUser, userId: adminUserId } = await isAdmin()

  if (!isAdminUser || !adminUserId) {
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
    const { userId } = await params
    const body = await request.json()
    const { role } = body

    // Validate role
    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      )
    }

    // Prevent self-demotion
    if (userId === adminUserId && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove your own admin role' },
        { status: 403 }
      )
    }

    const result = await updateUserRole(userId, role, adminUserId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update role' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`
    })
  } catch (error) {
    console.error('[Admin Users] Update role failed:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete user and all associated data
 *
 * Security:
 * - Admin cannot delete themselves
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { isAdmin: isAdminUser, userId: adminUserId } = await isAdmin()

  if (!isAdminUser || !adminUserId) {
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
    const { userId } = await params

    // Prevent self-deletion
    if (userId === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    const result = await deleteUserAppData(userId, adminUserId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedCounts: result.deletedCounts
    })
  } catch (error) {
    console.error('[Admin Users] Delete user failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
