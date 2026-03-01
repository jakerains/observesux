'use client'

import { Button } from '@/components/ui/button'
import { BellRing } from 'lucide-react'

/**
 * Public dashboard header button — always shows the Bell linking to /account/alerts.
 * Session state is irrelevant here; the site is fully anonymous.
 * Admin login lives at /admin only.
 */
export function UserMenu() {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
      <a href="/account/alerts" aria-label="Notification settings">
        <BellRing className="h-4 w-4" />
      </a>
    </Button>
  )
}
