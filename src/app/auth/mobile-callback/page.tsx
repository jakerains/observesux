'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Mobile Auth Callback Content
 * Separated to allow Suspense boundary for useSearchParams
 */
function MobileCallbackContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const redirectUrl = searchParams.get('redirect') || 'siouxland://auth/callback'

  useEffect(() => {
    async function getMobileToken() {
      try {
        // Call server API to get token from HTTP-only cookie session
        const response = await fetch('/api/auth/mobile-token')

        if (response.ok) {
          const { token } = await response.json()
          setRedirecting(true)

          // Small delay to show the redirecting message
          setTimeout(() => {
            window.location.href = `${redirectUrl}?token=${encodeURIComponent(token)}`
          }, 500)
        } else {
          // No session - user may not have completed sign in
          setError('No active session. Please try signing in again.')
        }
      } catch {
        setError('Failed to get authentication token.')
      }
    }

    getMobileToken()
  }, [redirectUrl])

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
 * It calls the server API to get the session token (from HTTP-only cookies)
 * and redirects back to the mobile app with the token via deep link.
 */
export default function MobileCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MobileCallbackContent />
    </Suspense>
  )
}
