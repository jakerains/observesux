/**
 * Push Notifications Hook
 *
 * Manages push notification state, permissions, and listeners
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EventSubscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  getExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
  requestPermissions,
  type NotificationData,
} from '@/lib/notifications';
import { useAuthStore } from '@/lib/auth';
import { storage } from '@/lib/storage';

const PUSH_TOKEN_KEY = 'push_token';

interface UseNotificationsResult {
  /** Current Expo push token */
  expoPushToken: string | null;
  /** Whether notifications are enabled */
  isEnabled: boolean;
  /** Whether we're loading the notification state */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Enable push notifications */
  enableNotifications: () => Promise<boolean>;
  /** Disable push notifications */
  disableNotifications: () => Promise<void>;
  /** Most recent notification received */
  notification: Notifications.Notification | null;
}

export function useNotifications(): UseNotificationsResult {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  // Load stored token on mount
  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = storage.getString(PUSH_TOKEN_KEY);
        if (storedToken) {
          setExpoPushToken(storedToken);
          setIsEnabled(true);
        }
      } catch (e) {
        console.error('Failed to load stored push token:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  // Handle notification navigation
  const handleNotificationNavigation = useCallback(
    (data: NotificationData) => {
      if (!data) return;

      switch (data.type) {
        case 'weather':
          router.push('/(tabs)');
          break;
        case 'river':
          router.push('/(tabs)');
          break;
        case 'air_quality':
          router.push('/(tabs)');
          break;
        case 'traffic':
          router.push('/(tabs)/map');
          break;
        default:
          if (data.url) {
            router.push(data.url as any);
          }
      }
    },
    [router]
  );

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for when user interacts with a notification
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      handleNotificationNavigation(data);
    });

    // Check for notification that launched the app (sync in SDK 54+)
    const lastResponse = getLastNotificationResponse();
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data as NotificationData;
      handleNotificationNavigation(data);
    }

    return () => {
      // Use .remove() method on subscriptions
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [handleNotificationNavigation]);

  // Re-register token when user logs in
  useEffect(() => {
    if (isAuthenticated && expoPushToken) {
      registerPushToken(expoPushToken).catch(console.error);
    }
  }, [isAuthenticated, expoPushToken]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    setError(null);

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('Notification permissions not granted');
        return false;
      }

      const token = await getExpoPushToken();
      if (!token) {
        setError('Failed to get push token');
        return false;
      }

      // Register with backend if logged in
      if (isAuthenticated) {
        const registered = await registerPushToken(token);
        if (!registered) {
          console.warn('Failed to register token with backend, but continuing anyway');
        }
      }

      // Store token locally
      storage.set(PUSH_TOKEN_KEY, token);
      setExpoPushToken(token);
      setIsEnabled(true);

      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      return false;
    }
  }, [isAuthenticated]);

  const disableNotifications = useCallback(async (): Promise<void> => {
    try {
      if (expoPushToken && isAuthenticated) {
        await unregisterPushToken(expoPushToken);
      }

      storage.delete(PUSH_TOKEN_KEY);
      setExpoPushToken(null);
      setIsEnabled(false);
    } catch (e) {
      console.error('Failed to disable notifications:', e);
    }
  }, [expoPushToken, isAuthenticated]);

  return {
    expoPushToken,
    isEnabled,
    isLoading,
    error,
    enableNotifications,
    disableNotifications,
    notification,
  };
}
