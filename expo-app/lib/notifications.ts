/**
 * Push Notifications utilities
 * Handles permission requests and Expo push token registration
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_BASE_URL } from './api';

type NotificationData = Record<string, unknown> | null | undefined;

/**
 * Configure notification handler
 * Call this in your root layout
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Must be a physical device for push notifications
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('No project ID found for push notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Check if notifications are currently enabled
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Register push token with the server
 */
export async function registerPushTokenWithServer(
  pushToken: string,
  authToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/mobile-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Unregister push token from server
 */
export async function unregisterPushToken(authToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/mobile-push`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

/**
 * Add listener for incoming notifications
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add listener for notification interactions (taps)
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Get the last notification that opened the app
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

function normalizeNotificationPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return normalizeNotificationPath(`${url.pathname}${url.search}${url.hash}`);
    } catch {
      return null;
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function getStringValue(data: NotificationData, key: string): string | null {
  const value = data?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function getNotificationNavigationPath(data: NotificationData): string | null {
  const directUrl = getStringValue(data, 'url') ?? getStringValue(data, 'pathname');
  if (directUrl) {
    return normalizeNotificationPath(directUrl);
  }

  const type = getStringValue(data, 'type');
  const digestId = getStringValue(data, 'digestId');
  const meetingId = getStringValue(data, 'meetingId');

  if (type === 'digest' && digestId) {
    return `/digest/${digestId}`;
  }

  if (type === 'council_meeting' && meetingId) {
    return `/council/${meetingId}`;
  }

  return null;
}

export function getNotificationNavigationPathFromResponse(
  response: Notifications.NotificationResponse | null
): string | null {
  const data = response?.notification.request.content.data as NotificationData;
  return getNotificationNavigationPath(data);
}
