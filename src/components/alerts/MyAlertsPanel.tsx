'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Bell, BellOff, BellRing } from 'lucide-react'
import {
  getPermissionStatus,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push/subscribe'

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

const PREF_LABELS: Record<keyof BrowserPrefs, string> = {
  notifyWeather: 'Severe Weather',
  notifyRiver: 'River Flooding',
  notifyAirQuality: 'Air Quality',
  notifyTraffic: 'Traffic Incidents',
  notifyDigest: 'Daily Digest',
  notifyCouncilMeeting: 'Council Meetings',
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

export function MyAlertsPanel() {
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
      getCurrentSubscription().then(sub => {
        setBrowserPushEnabled(!!sub && Notification.permission === 'granted')
      })
    }
  }, [])

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

  if (!pushSupported) return null

  return (
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
  )
}
