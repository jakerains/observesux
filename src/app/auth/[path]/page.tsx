'use client'

import { use } from 'react'
import { AuthView } from '@neondatabase/auth/react/ui'
import { SignUpForm } from '@/components/auth/SignUpForm'

/**
 * Authentication pages for sign-in, sign-up, and sign-out
 * Routes:
 * - /auth/sign-in - Neon Auth
 * - /auth/sign-up - Custom form with first/last name
 * - /auth/sign-out - Neon Auth
 * - /auth/forgot-password - Neon Auth
 * - /auth/reset-password - Neon Auth
 */
export default function Auth({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params)

  // Use custom sign-up form to collect first/last name
  if (path === 'sign-up') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <SignUpForm />
      </div>
    )
  }

  // Use Neon Auth for all other auth flows
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthView pathname={`/auth/${path}`} />
    </div>
  )
}
