import { authApiHandler } from '@neondatabase/auth/next/server'

/**
 * Auth API handler for Neon Auth
 * Handles all auth-related API routes like:
 * - /api/auth/signin
 * - /api/auth/signup
 * - /api/auth/signout
 * - /api/auth/callback
 * - /api/auth/session
 */
export const { GET, POST, PUT, DELETE, PATCH } = authApiHandler()
