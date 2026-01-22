/**
 * Push Notifications Service using expo-notifications
 *
 * Handles:
 * - Permission requests
 * - Push token registration
 * - Notification listeners
 * - Background/foreground handlers
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type?: 'weather' | 'river' | 'air_quality' | 'traffic';
  alertId?: string;
  url?: string;
}

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

/**
 * Request notification permissions from the user
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permissions not granted');
    return false;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    });

    // High-priority channel for severe weather
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Weather Alerts',
      description: 'Severe weather and emergency alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#ef4444',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push tokens require a physical device');
    return null;
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    return null;
  }

  try {
    // Get the project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Register the push token with the backend
 */
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    await apiClient.post(API_ENDPOINTS.pushSubscription, {
      subscription: {
        type: 'expo',
        token,
        platform: Platform.OS,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return false;
  }
}

/**
 * Unregister the push token from the backend
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    await apiClient.delete(API_ENDPOINTS.pushSubscription, {
      data: { endpoint: token },
    });
    return true;
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    return false;
  }
}

/**
 * Schedule a local notification (useful for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  seconds: number = 1
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as Record<string, unknown>,
      sound: 'default',
    },
    trigger: { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

/**
 * Add a listener for received notifications (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification responses (when user taps)
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (useful for handling deep links on app launch)
 * Note: This is synchronous in SDK 54+
 */
export function getLastNotificationResponse(): Notifications.NotificationResponse | null {
  return Notifications.getLastNotificationResponse();
}

export { Notifications };
