'use client'

import { createAuthClient } from '@neondatabase/auth/next'

/**
 * Neon Auth client for use in client components
 *
 * Usage:
 *   import { authClient, useSession } from '@/lib/auth/client'
 */
export const authClient = createAuthClient()

// Re-export hooks and methods for convenience
export const useSession = authClient.useSession
export const signIn = authClient.signIn
export const signUp = authClient.signUp
export const signOut = authClient.signOut
