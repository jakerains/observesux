/**
 * Notification Preferences Screen
 * Master toggle + per-type notification preferences
 * Registers push token anonymously with the backend on enable/change.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, ScrollView, Pressable, Linking, PlatformColor, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { useSettings } from '../../../lib/contexts';
import { Brand } from '@/constants/BrandColors';
import { API_BASE_URL } from '@/lib/api';

interface NotificationTypeConfig {
  key: 'notifyWeather' | 'notifyRiver' | 'notifyAirQuality' | 'notifyTraffic' | 'notifyDigest';
  label: string;
  description: string;
  sfSymbol: string;
  tintColor: string;
}

const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    key: 'notifyWeather',
    label: 'Weather Alerts',
    description: 'Severe weather warnings and watches from NWS',
    sfSymbol: 'cloud.bolt.fill',
    tintColor: '#f59e0b',
  },
  {
    key: 'notifyRiver',
    label: 'River & Flood',
    description: 'Big Sioux and Missouri River stage alerts',
    sfSymbol: 'drop.fill',
    tintColor: '#3b82f6',
  },
  {
    key: 'notifyAirQuality',
    label: 'Air Quality',
    description: 'Unhealthy AQI threshold notifications',
    sfSymbol: 'aqi.medium',
    tintColor: '#22c55e',
  },
  {
    key: 'notifyTraffic',
    label: 'Traffic Incidents',
    description: 'Major incidents and road closures',
    sfSymbol: 'car.side.rear.and.collision.and.car.side.front',
    tintColor: '#ef4444',
  },
  {
    key: 'notifyDigest',
    label: 'Daily Digest',
    description: 'Morning, Midday & Evening — three times daily',
    sfSymbol: 'newspaper.fill',
    tintColor: '#8b5cf6',
  },
];

/**
 * Request OS notification permission.
 * Returns 'granted' | 'denied' | 'simulator'
 */
async function requestPermission(): Promise<'granted' | 'denied' | 'simulator'> {
  if (!Device.isDevice) return 'simulator';
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return 'granted';
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

/**
 * Get current OS permission status without prompting.
 */
async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined' | 'simulator'> {
  if (!Device.isDevice) return 'simulator';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Get (or create) a stable device ID.
 * On iOS this is Application.iosIdForVendorAsync(), Android uses androidId.
 */
async function getDeviceId(): Promise<string> {
  if (!Device.isDevice) return 'simulator-device';
  if (process.env.EXPO_OS === 'ios') {
    return (await Application.getIosIdForVendorAsync()) ?? 'ios-unknown';
  }
  return Application.getAndroidId() ?? 'android-unknown';
}

/**
 * Get the Expo push token for this device.
 * Returns null if it can't be obtained (simulator, no projectId, etc).
 */
async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/**
 * Register (or update) this device's push token and preferences with the backend.
 * Fire-and-forget — failures are logged but don't block the UI.
 */
async function syncWithServer(prefs: {
  notifyWeather: boolean;
  notifyRiver: boolean;
  notifyAirQuality: boolean;
  notifyTraffic: boolean;
  notifyDigest: boolean;
}): Promise<void> {
  try {
    const [deviceId, token] = await Promise.all([getDeviceId(), getExpoPushToken()]);
    if (!token) return; // Simulator or token unavailable — skip silently

    await fetch(`${API_BASE_URL}/api/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        expoPushToken: token,
        platform: process.env.EXPO_OS === 'android' ? 'android' : 'ios',
        ...prefs,
      }),
    });
  } catch (error) {
    console.log('[Notifications] Failed to sync with server:', error);
  }
}

export default function NotificationsScreen() {
  const { settings, updateSetting } = useSettings();
  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'undetermined' | 'simulator' | null>(null);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    getPermissionStatus().then(setPermStatus);
  }, []);

  const currentPrefs = {
    notifyWeather: settings.notifyWeather,
    notifyRiver: settings.notifyRiver,
    notifyAirQuality: settings.notifyAirQuality,
    notifyTraffic: settings.notifyTraffic,
    notifyDigest: settings.notifyDigest,
  };

  const handleMasterToggle = async (enabled: boolean) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (enabled) {
      setEnabling(true);
      const result = await requestPermission();
      setPermStatus(result === 'simulator' ? 'simulator' : result === 'granted' ? 'granted' : 'denied');

      if (result === 'denied') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications for Siouxland Online in your device Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        setEnabling(false);
        return;
      }

      await updateSetting('notificationsEnabled', true);
      // Register with backend (non-blocking)
      syncWithServer(currentPrefs);
      setEnabling(false);
    } else {
      await updateSetting('notificationsEnabled', false);
    }
  };

  const handleTypeToggle = async (
    key: NotificationTypeConfig['key'],
    value: boolean
  ) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updateSetting(key, value);
    // Sync updated preferences to server
    syncWithServer({ ...currentPrefs, [key]: value });
  };

  const isOsGranted = permStatus === 'granted' || permStatus === 'simulator';
  const masterEnabled = settings.notificationsEnabled;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Brand.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      {/* OS permission warning */}
      {permStatus === 'denied' && (
        <Pressable
          onPress={() => Linking.openSettings()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: 12,
            backgroundColor: 'rgba(239,68,68,0.12)',
            borderWidth: 0.5,
            borderColor: 'rgba(239,68,68,0.35)',
            marginBottom: 20,
          }}
        >
          <Image source="sf:exclamationmark.triangle.fill" style={{ width: 18, height: 18 }} tintColor="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>
              Notifications blocked in Settings
            </Text>
            <Text style={{ fontSize: 12, color: Brand.muted, marginTop: 2 }}>
              Tap to open device Settings and enable notifications for this app.
            </Text>
          </View>
          <Image source="sf:arrow.up.right" style={{ width: 12, height: 12 }} tintColor="#ef4444" />
        </Pressable>
      )}

      {/* Master toggle */}
      <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.5, color: Brand.muted, marginBottom: 8, marginLeft: 4 }}>
        PUSH NOTIFICATIONS
      </Text>
      <View
        style={{
          borderRadius: 12,
          borderCurve: 'continuous',
          overflow: 'hidden',
          backgroundColor: Brand.card,
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              backgroundColor: masterEnabled ? 'rgba(230,156,58,0.15)' : PlatformColor('tertiarySystemFill'),
            }}
          >
            <Image
              source={`sf:${masterEnabled ? 'bell.badge.fill' : 'bell.slash'}`}
              style={{ width: 20, height: 20 }}
              tintColor={masterEnabled ? Brand.amber : Brand.muted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: PlatformColor('label'), fontSize: 15 }}>
              Enable Notifications
            </Text>
            <Text style={{ fontSize: 12, marginTop: 2, color: PlatformColor('secondaryLabel') }}>
              {masterEnabled ? 'Receiving selected alert types' : 'No notifications will be sent'}
            </Text>
          </View>
          <Switch
            value={masterEnabled && (isOsGranted || permStatus === null)}
            onValueChange={handleMasterToggle}
            disabled={enabling}
            trackColor={{ false: undefined, true: Brand.amber }}
          />
        </View>
      </View>

      {/* Per-type toggles — only shown when master is on */}
      {masterEnabled && (
        <>
          <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.5, color: Brand.muted, marginBottom: 8, marginLeft: 4 }}>
            ALERT TYPES
          </Text>
          <View
            style={{
              borderRadius: 12,
              borderCurve: 'continuous',
              overflow: 'hidden',
              backgroundColor: Brand.card,
              marginBottom: 20,
            }}
          >
            {NOTIFICATION_TYPES.map((type, index) => (
              <View
                key={type.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderBottomWidth: index < NOTIFICATION_TYPES.length - 1 ? 0.5 : 0,
                  borderBottomColor: PlatformColor('separator'),
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    backgroundColor: PlatformColor('tertiarySystemFill'),
                  }}
                >
                  <Image
                    source={`sf:${type.sfSymbol}`}
                    style={{ width: 20, height: 20 }}
                    tintColor={type.tintColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '500', color: PlatformColor('label') }}>{type.label}</Text>
                  <Text style={{ fontSize: 12, marginTop: 2, color: PlatformColor('secondaryLabel') }}>
                    {type.description}
                  </Text>
                </View>
                <Switch
                  value={settings[type.key]}
                  onValueChange={(v) => handleTypeToggle(type.key, v)}
                  trackColor={{ false: undefined, true: Brand.amber }}
                />
              </View>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: Brand.muted, lineHeight: 19, marginHorizontal: 4 }}>
            Push notifications are delivered in real-time as events happen in Sioux City. You can
            adjust these preferences at any time.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
