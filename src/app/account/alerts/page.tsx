'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bell } from 'lucide-react'
import { MyAlertsPanel } from '@/components/alerts/MyAlertsPanel'

export default function AlertsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Alerts</h1>
              <p className="text-sm text-muted-foreground">
                Manage your notification preferences
              </p>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <MyAlertsPanel />
      </div>
    </main>
  )
}
