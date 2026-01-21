'use client'

import { AccountView } from '@neondatabase/auth/react/ui'

/**
 * Account settings pages for user profile management
 * Routes:
 * - /account/profile
 * - /account/security
 * - /account/sessions
 */
export default function Account() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <AccountView />
      </div>
    </div>
  )
}
