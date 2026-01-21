import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { getUserProfile, upsertUserProfile } from '@/lib/db/profiles'

/**
 * GET /api/user/profile
 * Get the current user's profile
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(user.id)

    return NextResponse.json({
      profile: profile || { userId: user.id, firstName: null, lastName: null },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

/**
 * PUT /api/user/profile
 * Update the current user's profile
 */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName } = body

    // Validate input
    if (firstName !== undefined && typeof firstName !== 'string') {
      return NextResponse.json({ error: 'firstName must be a string' }, { status: 400 })
    }
    if (lastName !== undefined && typeof lastName !== 'string') {
      return NextResponse.json({ error: 'lastName must be a string' }, { status: 400 })
    }

    // Sanitize: trim whitespace and limit length
    const sanitizedFirstName = firstName?.trim().slice(0, 50) || null
    const sanitizedLastName = lastName?.trim().slice(0, 50) || null

    const profile = await upsertUserProfile(user.id, {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
    })

    if (!profile) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
