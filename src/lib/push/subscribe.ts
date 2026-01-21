'use client'

/**
 * Client-side push notification subscription utilities
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported')
  }
  return Notification.requestPermission()
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers not supported')
  }

  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/'
  })

  // Wait for the service worker to be ready
  await navigator.serviceWorker.ready

  return registration
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported')
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key not configured')
  }

  // Request permission if not granted
  const permission = await requestPermission()
  if (permission !== 'granted') {
    return null
  }

  // Register service worker
  const registration = await registerServiceWorker()

  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
  }

  return subscription
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    return subscription.unsubscribe()
  }

  return false
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/**
 * Save subscription to server
 */
export async function saveSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/user/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    })

    return response.ok
  } catch (error) {
    console.error('Failed to save subscription:', error)
    return false
  }
}

/**
 * Remove subscription from server
 */
export async function removeSubscriptionFromServer(
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/user/push-subscription', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint })
    })

    return response.ok
  } catch (error) {
    console.error('Failed to remove subscription:', error)
    return false
  }
}

/**
 * Full subscription flow: request permission, subscribe, and save to server
 */
export async function enablePushNotifications(): Promise<{
  success: boolean
  subscription?: PushSubscription
  error?: string
}> {
  try {
    if (!isPushSupported()) {
      return { success: false, error: 'Push notifications not supported in this browser' }
    }

    const subscription = await subscribeToPush()

    if (!subscription) {
      return { success: false, error: 'Permission denied' }
    }

    const saved = await saveSubscriptionToServer(subscription)

    if (!saved) {
      return { success: false, error: 'Failed to save subscription' }
    }

    return { success: true, subscription }
  } catch (error) {
    console.error('Push subscription error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Full unsubscription flow: unsubscribe and remove from server
 */
export async function disablePushNotifications(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription()

    if (subscription) {
      await removeSubscriptionFromServer(subscription.endpoint)
      await unsubscribeFromPush()
    }

    return true
  } catch (error) {
    console.error('Push unsubscription error:', error)
    return false
  }
}
