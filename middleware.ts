import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for route protection
 *
 * Currently configured to allow public access to most routes.
 * Protected routes (those requiring authentication) can be added here.
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/account',       // Account settings
  '/api/user',      // User-specific API endpoints
]

// Routes that should be excluded from middleware entirely
const EXCLUDED_ROUTES = [
  '/_workflow',     // Vercel Workflow internal routes
  '/api/workflow',  // Workflow API endpoints
]

// Routes that should redirect logged-in users away
const AUTH_ROUTES = [
  '/auth/sign-in',
  '/auth/sign-up',
]

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Skip middleware for excluded routes (workflow internal routes, etc.)
  const isExcludedRoute = EXCLUDED_ROUTES.some(route => pathname.startsWith(route))
  if (isExcludedRoute) {
    return NextResponse.next()
  }

  // For protected routes, check for session cookie
  // Neon Auth uses 'better-auth.session_token' cookie
  const sessionCookie = request.cookies.get('better-auth.session_token')
  const hasSession = !!sessionCookie?.value

  // Check if there's a pending mobile callback and user is now authenticated
  // This catches the redirect after successful sign-in
  const mobileCallback = request.cookies.get('mobile_callback_url')?.value
  if (hasSession && mobileCallback && !pathname.startsWith('/auth/mobile-callback')) {
    // User just signed in and has a pending mobile callback - redirect to it
    const redirectUrl = new URL(mobileCallback, request.url)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.delete('mobile_callback_url')
    return response
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !hasSession) {
    // Redirect to sign-in page
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Handle auth routes
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  if (isAuthRoute) {
    // Check if this is a mobile app sign-in request
    const isMobile = searchParams.get('mobile') === 'true'
    const callbackUrl = searchParams.get('callbackUrl')

    if (isMobile && callbackUrl) {
      // Store mobile callback URL in a cookie for later use
      const response = NextResponse.next()
      response.cookies.set('mobile_callback_url', callbackUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      })
      return response
    }

    // Redirect authenticated users away from auth pages
    if (hasSession) {
      // Regular web redirect to home (mobile callback already handled above)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - _workflow (Vercel Workflow internal routes)
     */
    '/((?!_next/static|_next/image|_workflow|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
