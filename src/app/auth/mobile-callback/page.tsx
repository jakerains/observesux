'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth/client'

/**
 * Mobile Auth Callback Content
 * Separated to allow Suspense boundary for useSearchParams
 */
function MobileCallbackContent() {
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const redirectUrl = searchParams.get('redirect') || 'siouxland://auth/callback'

  useEffect(() => {
    if (isPending) return

    if (session?.session?.token) {
      // We have a session, redirect to mobile app with token
      setRedirecting(true)
      const mobileUrl = `${redirectUrl}?token=${encodeURIComponent(session.session.token)}`

      // Small delay to show the redirecting message
      setTimeout(() => {
        window.location.href = mobileUrl
      }, 500)
    } else if (!isPending) {
      // No session - user may not have completed sign in
      setError('No active session. Please try signing in again.')
    }
  }, [session, isPending, redirectUrl])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-xl font-semibold text-foreground">Sign In Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <a
            href="/auth/sign-in"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Try Again
          </a>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">Success!</h1>
          <p className="text-muted-foreground">Returning to the app...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

/**
 * Loading fallback for Suspense
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Mobile Auth Callback Page
 *
 * This page handles the redirect after a user signs in from the mobile app.
 * It checks for an active session and redirects back to the mobile app
 * with the session token via deep link.
 */
export default function MobileCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MobileCallbackContent />
    </Suspense>
  )
}
