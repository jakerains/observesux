'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import {
  isPushSupported,
  getPermissionStatus,
  enablePushNotifications,
  disablePushNotifications,
  getCurrentSubscription
} from '@/lib/push/subscribe'

interface PushPermissionButtonProps {
  className?: string
  showLabel?: boolean
}

export function PushPermissionButton({
  className,
  showLabel = true
}: PushPermissionButtonProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check support and current status
    const checkStatus = async () => {
      const supported = isPushSupported()
      setIsSupported(supported)

      if (supported) {
        setPermission(getPermissionStatus())
        const subscription = await getCurrentSubscription()
        setIsSubscribed(!!subscription)
      }
    }

    checkStatus()
  }, [])

  const handleToggle = async () => {
    setIsLoading(true)

    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await disablePushNotifications()
        if (success) {
          setIsSubscribed(false)
        }
      } else {
        // Subscribe
        const result = await enablePushNotifications()
        if (result.success) {
          setIsSubscribed(true)
          setPermission('granted')
        } else if (result.error === 'Permission denied') {
          setPermission('denied')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  // Permission was denied - show disabled state
  if (permission === 'denied') {
    return (
      <Button
        variant="outline"
        size={showLabel ? 'default' : 'icon'}
        disabled
        className={className}
        title="Notifications blocked. Enable in browser settings."
      >
        <BellOff className="h-4 w-4" />
        {showLabel && <span className="ml-2">Notifications Blocked</span>}
      </Button>
    )
  }

  return (
    <Button
      variant={isSubscribed ? 'default' : 'outline'}
      size={showLabel ? 'default' : 'icon'}
      onClick={handleToggle}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isLoading
            ? 'Loading...'
            : isSubscribed
              ? 'Notifications On'
              : 'Enable Notifications'}
        </span>
      )}
    </Button>
  )
}
