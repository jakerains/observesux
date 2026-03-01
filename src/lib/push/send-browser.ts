import { sendPushNotification, type PushPayload } from './send'
import { deactivateBrowserPushSubscription } from '@/lib/db/browser-push'

export interface BrowserPushTarget {
  browserId: string
  endpoint: string
  p256dh: string
  authKey: string
}

/**
 * Send a web push notification to a list of anonymous browser subscriptions.
 * Deactivates expired subscriptions (HTTP 410/404) automatically.
 */
export async function sendBrowserPushToSubscribers(
  subscriptions: BrowserPushTarget[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.authKey },
      payload
    )

    if (result.success) {
      sent++
    } else {
      failed++
      if (result.error === 'Subscription expired') {
        await deactivateBrowserPushSubscription(sub.endpoint)
      }
    }
  }

  return { sent, failed }
}
