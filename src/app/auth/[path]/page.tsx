'use client'

import { use } from 'react'
import { AuthView } from '@neondatabase/auth/react/ui'

/**
 * Authentication pages for sign-in, sign-up, and sign-out
 * Routes:
 * - /auth/sign-in
 * - /auth/sign-up
 * - /auth/sign-out
 * - /auth/forgot-password
 * - /auth/reset-password
 */
export default function Auth({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthView pathname={`/auth/${path}`} />
    </div>
  )
}
