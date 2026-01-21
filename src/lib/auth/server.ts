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
 * Get full session data
 */
export async function getSession() {
  return neonAuth()
}
