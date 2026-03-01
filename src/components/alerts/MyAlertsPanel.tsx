'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Bell, AlertTriangle, BellOff, BellRing } from 'lucide-react'
import { AlertTypeCard } from './AlertTypeCard'
import { PushPermissionButton } from './PushPermissionButton'
import { useSession } from '@/lib/auth/client'
import {
  getPermissionStatus,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push/subscribe'
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
  traffic: { severities: ['major', 'critical'] },
  council_meeting: {}
}

const BROWSER_PREFS_KEY = 'sux_browser_prefs'
const BROWSER_ID_KEY = 'sux_browser_id'

type BrowserPrefs = {
  notifyWeather: boolean
  notifyRiver: boolean
  notifyAirQuality: boolean
  notifyTraffic: boolean
  notifyDigest: boolean
  notifyCouncilMeeting: boolean
}

const DEFAULT_BROWSER_PREFS: BrowserPrefs = {
  notifyWeather: true,
  notifyRiver: true,
  notifyAirQuality: true,
  notifyTraffic: true,
  notifyDigest: true,
  notifyCouncilMeeting: true,
}

function getBrowserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(BROWSER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(BROWSER_ID_KEY, id)
  }
  return id
}

function loadBrowserPrefs(): BrowserPrefs {
  if (typeof window === 'undefined') return DEFAULT_BROWSER_PREFS
  try {
    const stored = localStorage.getItem(BROWSER_PREFS_KEY)
    if (stored) return { ...DEFAULT_BROWSER_PREFS, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return DEFAULT_BROWSER_PREFS
}

function saveBrowserPrefs(prefs: BrowserPrefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BROWSER_PREFS_KEY, JSON.stringify(prefs))
}

const PREF_LABELS: Record<keyof BrowserPrefs, string> = {
  notifyWeather: 'Severe Weather',
  notifyRiver: 'River Flooding',
  notifyAirQuality: 'Air Quality',
  notifyTraffic: 'Traffic Incidents',
  notifyDigest: 'Daily Digest',
  notifyCouncilMeeting: 'Council Meetings',
}

export function MyAlertsPanel() {
  const { data: session, isPending } = useSession()
  const [subscriptions, setSubscriptions] = useState<Record<string, AlertSubscription>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Browser push state
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [browserPushEnabled, setBrowserPushEnabled] = useState(false)
  const [browserPrefs, setBrowserPrefs] = useState<BrowserPrefs>(DEFAULT_BROWSER_PREFS)
  const [browserPushLoading, setBrowserPushLoading] = useState(false)

  useEffect(() => {
    const supported = isPushSupported()
    setPushSupported(supported)
    if (supported) {
      setPushPermission(getPermissionStatus())
      setBrowserPrefs(loadBrowserPrefs())
      // Check if already subscribed
      getCurrentSubscription().then(sub => {
        setBrowserPushEnabled(!!sub && Notification.permission === 'granted')
      })
    }
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

  const syncBrowserPushToServer = useCallback(async (prefs: BrowserPrefs) => {
    const sub = await getCurrentSubscription()
    if (!sub) return
    const browserId = getBrowserId()
    const json = sub.toJSON()
    await fetch('/api/push/browser-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        browserId,
        subscription: {
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        },
        preferences: prefs,
      }),
    })
  }, [])

  const handleBrowserPushToggle = async (enabled: boolean) => {
    if (!pushSupported) return
    setBrowserPushLoading(true)
    try {
      if (enabled) {
        const sub = await subscribeToPush()
        if (sub) {
          setBrowserPushEnabled(true)
          setPushPermission(Notification.permission)
          await syncBrowserPushToServer(browserPrefs)
        }
      } else {
        const sub = await getCurrentSubscription()
        if (sub) {
          await fetch('/api/push/browser-register', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
        }
        await unsubscribeFromPush()
        setBrowserPushEnabled(false)
      }
    } catch (err) {
      console.error('Browser push toggle error:', err)
    } finally {
      setBrowserPushLoading(false)
    }
  }

  const handlePrefToggle = async (key: keyof BrowserPrefs, value: boolean) => {
    const updated = { ...browserPrefs, [key]: value }
    setBrowserPrefs(updated)
    saveBrowserPrefs(updated)
    if (browserPushEnabled) {
      await syncBrowserPushToServer(updated)
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
          [alertType]: { ...prev[alertType], enabled }
        }))
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err)
    }
  }

  // Always show browser push section first (even when logged out)
  const BrowserPushSection = pushSupported ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Browser Notifications
        </CardTitle>
        <CardDescription>
          Get push alerts in this browser — no account required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pushPermission === 'denied' ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
            <BellOff className="h-4 w-4 shrink-0" />
            Notifications are blocked in your browser settings. Enable them to use browser alerts.
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {browserPushEnabled ? (
                <BellRing className="h-4 w-4 text-green-500" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {browserPushEnabled ? 'Push notifications enabled' : 'Enable push notifications'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {browserPushEnabled
                    ? 'You will receive alerts on this browser'
                    : 'Receive weather, flood, and traffic alerts'}
                </p>
              </div>
            </div>
            {browserPushLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={browserPushEnabled}
                onCheckedChange={handleBrowserPushToggle}
              />
            )}
          </div>
        )}

        {/* Per-type toggles — only shown when enabled */}
        {browserPushEnabled && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alert types</p>
            {(Object.keys(PREF_LABELS) as Array<keyof BrowserPrefs>).map(key => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`pref-${key}`} className="text-sm font-normal cursor-pointer">
                  {PREF_LABELS[key]}
                </Label>
                <Switch
                  id={`pref-${key}`}
                  checked={browserPrefs[key]}
                  onCheckedChange={val => handlePrefToggle(key, val)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  ) : null

  // Not logged in — browser push section only (anonymous mode, no sign-in prompt)
  if (!isPending && !session?.user) {
    return <div className="space-y-4">{BrowserPushSection}</div>
  }

  if (isLoading || isPending) {
    return (
      <div className="space-y-4">
        {BrowserPushSection}
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        {BrowserPushSection}
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Browser push always first */}
      {BrowserPushSection}

      {/* Auth-based alert subscriptions */}
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
          {/* Auth web push status */}
          {pushSupported && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-4">
              <div>
                <p className="font-medium text-sm">Account Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {pushPermission === 'granted'
                    ? 'Enabled — synced to your account'
                    : pushPermission === 'denied'
                      ? 'Blocked — enable in browser settings'
                      : 'Enable to receive account-linked alerts'}
                </p>
              </div>
              <PushPermissionButton showLabel={false} />
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
