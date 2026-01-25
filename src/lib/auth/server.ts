import { createAuthServer, neonAuth } from '@neondatabase/auth/next/server'

/**
 * Neon Auth server instance for use in server components and API routes
 *
 * Usage:
 *   import { authServer } from '@/lib/auth/server'
 *   const { data: session } = await authServer.getSession()
 */
export const authServer = createAuthServer()

/**
 * Helper to get the current user on the server
 * Uses the neonAuth() utility for quick session access
 */
export async function getCurrentUser() {
  const { user } = await neonAuth()
  return user
}

/**
 * Validate a Bearer token by calling the Neon Auth API directly
 *
 * @param token - The Bearer token to validate
 * @returns User object or null if invalid
 */
async function validateBearerToken(token: string) {
  const authBaseUrl = process.env.NEON_AUTH_BASE_URL
  if (!authBaseUrl) {
    console.error('NEON_AUTH_BASE_URL not configured')
    return null
  }

  try {
    // Call the Neon Auth get-session endpoint with the Bearer token
    const response = await fetch(`${authBaseUrl}/api/auth/get-session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data?.user || null
  } catch (error) {
    console.error('Failed to validate Bearer token:', error)
    return null
  }
}

/**
 * Get current user from cookies OR Bearer token (for mobile)
 *
 * Mobile apps can't use cookies like web browsers, so they send
 * Bearer tokens in the Authorization header instead.
 *
 * @param request - The incoming Request object
 * @returns User object or null if not authenticated
 */
export async function getCurrentUserFromRequest(request: Request) {
  // First try cookie-based auth (web)
  const { user } = await neonAuth()
  if (user) return user

  // Fallback to Bearer token (mobile)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return validateBearerToken(token)
  }

  return null
}

/**
 * Helper to require authentication (throws if not authenticated)
 */
export async function requireAuth() {
  const { user, session } = await neonAuth()
  if (!user || !session) {
    throw new Error('Unauthorized')
  }
  return { user, session }
}

/**
 * Require authentication from request (supports both cookies and Bearer tokens)
 *
 * @param request - The incoming Request object
 * @throws Error if not authenticated
 */
export async function requireAuthFromRequest(request: Request) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return { user }
}

/**
 * Get full session data
 */
export async function getSession() {
  return neonAuth()
}
