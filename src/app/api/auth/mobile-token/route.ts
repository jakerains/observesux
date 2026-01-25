import { neonAuth } from '@neondatabase/auth/next/server'

/**
 * GET /api/auth/mobile-token
 *
 * Returns a session token for mobile app authentication.
 * This endpoint reads the authenticated session from HTTP-only cookies
 * (which can only be accessed server-side) and returns a token that
 * the mobile app can use for Bearer authentication.
 *
 * Flow:
 * 1. User signs in via web (creates HTTP-only cookie session)
 * 2. Mobile callback page calls this endpoint
 * 3. Server reads session from cookie, returns token
 * 4. Mobile app stores token for future API calls
 */
export async function GET() {
  try {
    const { user, session } = await neonAuth()

    if (!user || !session) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Return session token and user data for mobile
    return Response.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    })
  } catch (error) {
    console.error('Failed to get mobile token:', error)
    return Response.json(
      { error: 'Failed to get authentication token' },
      { status: 500 }
    )
  }
}
