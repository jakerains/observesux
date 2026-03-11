'use client'

import { Suspense } from 'react'
import { Loader2, ShieldX } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { ContentStudioLayout } from '@/components/admin/content-studio/ContentStudioLayout'

function AccessDenied({ reason }: { reason: 'not-logged-in' | 'not-admin' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <ShieldX className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          {reason === 'not-logged-in'
            ? 'Please sign in to access the Content Studio.'
            : 'You need admin privileges to access this page.'}
        </p>
      </div>
    </div>
  )
}

function ContentStudioPage() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return <AccessDenied reason="not-logged-in" />
  }

  const userRole = (session.user as { role?: string }).role
  if (userRole !== 'admin') {
    return <AccessDenied reason="not-admin" />
  }

  return <ContentStudioLayout />
}

export default function ContentStudioWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ContentStudioPage />
    </Suspense>
  )
}
