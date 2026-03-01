'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Loader2,
  RefreshCw,
  Send,
  Play,
  Smartphone,
  Globe,
  CheckCircle2,
  XCircle,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PushStats {
  webPush: number
  expoPush: { ios: number; android: number }
  devicePush: {
    total: number
    ios: number
    android: number
    perType: Record<string, number>
  }
  browserPush: number
}

interface AlertCheckResult {
  success: boolean
  results?: Record<string, { checked: number; matched: number; notified: number }>
  cleanedUp?: number
  error?: string
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  weather: 'Weather',
  river: 'River',
  air_quality: 'Air Quality',
  traffic: 'Traffic',
}

export function PushNotificationsPanel() {
  const [stats, setStats] = useState<PushStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [testingChannel, setTestingChannel] = useState<'web' | 'expo' | 'both' | 'device' | null>(null)
  const [testResult, setTestResult] = useState<{ channel: 'web' | 'expo' | 'both' | 'device'; web: { sent: number; failed: number }; expo: { sent: number; failed: number }; device: { sent: number; failed: number }; total: { sent: number; failed: number } } | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const [alertCheckLoading, setAlertCheckLoading] = useState(false)
  const [alertCheckResult, setAlertCheckResult] = useState<AlertCheckResult | null>(null)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const res = await fetch('/api/admin/push/stats')
      if (!res.ok) throw new Error('Failed to load stats')
      setStats(await res.json())
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const sendTestNotification = async (channel: 'web' | 'expo' | 'both' | 'device') => {
    setTestingChannel(channel)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await fetch('/api/admin/push/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setTestResult({ channel, web: data.web, expo: data.expo, device: data.device, total: data.total })
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setTestingChannel(null)
    }
  }

  const runAlertCheck = async () => {
    setAlertCheckLoading(true)
    setAlertCheckResult(null)
    try {
      const res = await fetch('/api/admin/push/run-check', { method: 'POST' })
      setAlertCheckResult(await res.json())
    } catch (err) {
      setAlertCheckResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setAlertCheckLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Push Notifications</h2>
          <p className="text-sm text-muted-foreground">Subscription stats and test tools</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={statsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading stats...</span>
        </div>
      ) : statsError ? (
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-4 w-4" />
          <span>{statsError}</span>
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Web push (auth) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Web Push
              </CardTitle>
              <p className="text-xs text-muted-foreground">Browser (signed in)</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.webPush}</div>
            </CardContent>
          </Card>

          {/* Expo push (auth) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-500" />
                Expo Push
              </CardTitle>
              <p className="text-xs text-muted-foreground">Mobile (signed in)</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.expoPush.ios + stats.expoPush.android}</div>
              <div className="text-xs text-muted-foreground mt-1">
                iOS: {stats.expoPush.ios} · Android: {stats.expoPush.android}
              </div>
            </CardContent>
          </Card>

          {/* Device push (anon) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-orange-500" />
                Device Push
              </CardTitle>
              <p className="text-xs text-muted-foreground">Mobile (anonymous)</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.devicePush.total}</div>
              <div className="text-xs text-muted-foreground mt-1">
                iOS: {stats.devicePush.ios} · Android: {stats.devicePush.android}
              </div>
              {stats.devicePush.total > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(stats.devicePush.perType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{ALERT_TYPE_LABELS[type] || type}</span>
                      <Badge variant="secondary" className="text-xs h-4">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browser push (anon) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-500" />
                Browser Push
              </CardTitle>
              <p className="text-xs text-muted-foreground">Browser (anonymous)</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.browserPush}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test tools */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Send test to self */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Test to Yourself
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sends a test push to your own subscriptions. Choose which channel to test.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => sendTestNotification('web')} disabled={testingChannel !== null} size="sm" variant="outline">
                {testingChannel === 'web' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2 text-blue-500" />}
                Browser
              </Button>
              <Button onClick={() => sendTestNotification('device')} disabled={testingChannel !== null} size="sm" variant="outline">
                {testingChannel === 'device' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2 text-orange-500" />}
                All Devices
              </Button>
              <Button onClick={() => sendTestNotification('both')} disabled={testingChannel !== null} size="sm">
                {testingChannel === 'both' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
                Both
              </Button>
            </div>
            {testResult && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Test sent</span>
                </div>
                {(testResult.channel === 'web' || testResult.channel === 'both') && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span>Browser — sent: {testResult.web.sent} · failed: {testResult.web.failed}</span>
                  </div>
                )}
                {testResult.channel === 'device' && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Smartphone className="h-3 w-3" />
                    <span>All Devices — sent: {testResult.device.sent} · failed: {testResult.device.failed}</span>
                  </div>
                )}
              </div>
            )}
            {testError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span>{testError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Run alert check */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4" />
              Run Alert Check Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Triggers the cron alert check immediately across all 4 alert types.
            </p>
            <Button onClick={runAlertCheck} disabled={alertCheckLoading} size="sm" variant="outline">
              {alertCheckLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Check
            </Button>
            {alertCheckResult && (
              <div className="space-y-1">
                {alertCheckResult.success ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Complete</span>
                    </div>
                    {alertCheckResult.results && Object.entries(alertCheckResult.results).map(([type, r]) => (
                      <div key={type} className="flex justify-between text-xs text-muted-foreground">
                        <span>{ALERT_TYPE_LABELS[type] || type}</span>
                        <span>checked: {r.checked} · matched: {r.matched} · notified: {r.notified}</span>
                      </div>
                    ))}
                    {alertCheckResult.cleanedUp !== undefined && (
                      <div className="text-xs text-muted-foreground">Cleaned up: {alertCheckResult.cleanedUp} old alerts</div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>{alertCheckResult.error || 'Check failed'}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
