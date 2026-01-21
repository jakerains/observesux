'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Bell, AlertTriangle } from 'lucide-react'
import { AlertTypeCard } from './AlertTypeCard'
import { PushPermissionButton } from './PushPermissionButton'
import { useSession } from '@/lib/auth/client'
import { getPermissionStatus, isPushSupported } from '@/lib/push/subscribe'
import type { AlertType } from '@/lib/db/alerts'

interface AlertSubscription {
  id: string
  userId: string
  alertType: AlertType
  config: Record<string, unknown>
  enabled: boolean
}

const ALERT_TYPES: AlertType[] = ['weather', 'river', 'air_quality', 'traffic']

const DEFAULT_CONFIGS: Record<AlertType, Record<string, unknown>> = {
  weather: { severities: ['Severe', 'Extreme'] },
  river: { stages: ['minor', 'moderate', 'major'] },
  air_quality: { minAqi: 101 },
  traffic: { severities: ['major', 'critical'] }
}

export function MyAlertsPanel() {
  const { data: session, isPending } = useSession()
  const [subscriptions, setSubscriptions] = useState<Record<string, AlertSubscription>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    setPushSupported(isPushSupported())
    setPushPermission(getPermissionStatus())
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptions()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/alerts')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || {})
      } else if (response.status !== 401) {
        setError('Failed to load alert settings')
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err)
      setError('Failed to load alert settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (alertType: AlertType, config: Record<string, unknown>, enabled: boolean) => {
    try {
      const response = await fetch('/api/user/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertType, config, enabled })
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptions(prev => ({
          ...prev,
          [alertType]: data.subscription
        }))
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      console.error('Failed to save subscription:', err)
      throw err
    }
  }

  const handleToggle = async (alertType: AlertType, enabled: boolean) => {
    try {
      // If enabling and no subscription exists, create one with defaults
      if (enabled && !subscriptions[alertType]) {
        await handleSave(alertType, DEFAULT_CONFIGS[alertType], true)
        return
      }

      const response = await fetch('/api/user/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertType, enabled })
      })

      if (response.ok) {
        setSubscriptions(prev => ({
          ...prev,
          [alertType]: {
            ...prev[alertType],
            enabled
          }
        }))
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err)
    }
  }

  // Not logged in
  if (!isPending && !session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            My Alerts
          </CardTitle>
          <CardDescription>
            Sign in to set up personalized alerts for weather, flooding, air quality, and traffic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/auth/sign-in">Sign in to Enable Alerts</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading
  if (isLoading || isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            My Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            My Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchSubscriptions} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            My Alerts
          </CardTitle>
          <CardDescription>
            Get notified about weather, flooding, air quality, and traffic in Siouxland.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Push notification status */}
          {pushSupported ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-4">
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {pushPermission === 'granted'
                    ? 'Enabled - you will receive alerts on this device'
                    : pushPermission === 'denied'
                      ? 'Blocked - enable in browser settings'
                      : 'Enable to receive alerts on this device'}
                </p>
              </div>
              <PushPermissionButton showLabel={false} />
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/50 mb-4">
              <p className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser. Alerts will still be logged.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert type cards */}
      {ALERT_TYPES.map(type => (
        <AlertTypeCard
          key={type}
          type={type}
          config={subscriptions[type]?.config || DEFAULT_CONFIGS[type]}
          enabled={subscriptions[type]?.enabled || false}
          onSave={(config, enabled) => handleSave(type, config, enabled)}
          onToggle={(enabled) => handleToggle(type, enabled)}
        />
      ))}
    </div>
  )
}
