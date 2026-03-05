/**
 * NotificationPromptModal
 *
 * One-time in-app prompt shown on first launch asking users to enable push
 * notifications. Appears after a short delay so the app feels loaded. Tapping
 * "Turn On Notifications" triggers the real OS permission dialog, then registers
 * the device token with the server. "Maybe Later" dismisses without asking the OS
 * so the user can still grant later from More → Notifications.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  PlatformColor,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Brand } from '@/constants/BrandColors';
import { API_BASE_URL } from '@/lib/api';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

const ALERT_TYPES = [
  { symbol: 'cloud.bolt.fill', color: '#f59e0b', label: 'Severe weather warnings' },
  { symbol: 'drop.fill', color: '#3b82f6', label: 'River & flood alerts' },
  { symbol: 'newspaper.fill', color: '#8b5cf6', label: 'Siouxland Digest — morning, midday & evening' },
  { symbol: 'building.columns.fill', color: '#0ea5e9', label: 'City Council recaps with AI summaries' },
];

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

async function getDeviceId(): Promise<string> {
  if (!Device.isDevice) return 'simulator-device';
  if (process.env.EXPO_OS === 'ios') {
    return (await Application.getIosIdForVendorAsync()) ?? 'ios-unknown';
  }
  return Application.getAndroidId() ?? 'android-unknown';
}

async function registerWithServer(): Promise<void> {
  try {
    const [deviceId, token] = await Promise.all([getDeviceId(), getExpoPushToken()]);
    if (!token) return;
    await fetch(`${API_BASE_URL}/api/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        expoPushToken: token,
        platform: process.env.EXPO_OS === 'android' ? 'android' : 'ios',
        notifyWeather: true,
        notifyRiver: true,
        notifyAirQuality: true,
        notifyTraffic: true,
        notifyDigest: true,
        notifyCouncilMeeting: true,
      }),
    });
  } catch {
    // Fire and forget — don't block the UI
  }
}

interface Props {
  /** Called after the prompt is dismissed (either accepted or skipped) */
  onDismiss: (enabled: boolean) => void;
}

export function NotificationPromptModal({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if we've shown this before; show after a brief delay
    let timer: ReturnType<typeof setTimeout>;
    getStorageItem<boolean>(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN).then((shown) => {
      if (!shown) {
        timer = setTimeout(() => {
          setVisible(true);
          Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();
        }, 1500);
      }
    });
    return () => clearTimeout(timer);
  }, []);

  const markShown = () => setStorageItem(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN, true);

  const handleAllow = async () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);

    // Request OS permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await registerWithServer();
    }

    await markShown();
    dismiss(finalStatus === 'granted');
  };

  const handleLater = async () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await markShown();
    dismiss(false);
  };

  const dismiss = (enabled: boolean) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      onDismiss(enabled);
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

      <View style={styles.sheetContainer} pointerEvents="box-none">
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header icon */}
          <View style={styles.iconRow}>
            <View style={styles.iconBadge}>
              <Image source="sf:bell.badge.fill" style={{ width: 32, height: 32 }} tintColor={Brand.amber} />
            </View>
          </View>

          <Text style={styles.title}>Stay in the loop on Siouxland</Text>
          <Text style={styles.subtitle}>
            Get real-time alerts the moment something happens in Sioux City — no refreshing needed.
          </Text>

          {/* Alert type list */}
          <View style={styles.typeList}>
            {ALERT_TYPES.map((t) => (
              <View key={t.symbol} style={styles.typeRow}>
                <View style={[styles.typeIconBadge, { backgroundColor: t.color + '22' }]}>
                  <Image source={`sf:${t.symbol}`} style={{ width: 16, height: 16 }} tintColor={t.color} />
                </View>
                <Text style={styles.typeLabel}>{t.label}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.allowBtn, pressed && { opacity: 0.85 }]}
            onPress={handleAllow}
            disabled={loading}
          >
            <Text style={styles.allowBtnText}>
              {loading ? 'Enabling…' : 'Turn On Notifications'}
            </Text>
          </Pressable>

          <Pressable onPress={handleLater} style={styles.laterBtn} disabled={loading}>
            <Text style={styles.laterBtnText}>Maybe Later</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1c1007',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 48,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: 'rgba(230,156,58,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ece3d6',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Brand.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  typeList: {
    gap: 12,
    marginBottom: 28,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    color: '#d4c8b8',
    fontWeight: '500',
  },
  allowBtn: {
    backgroundColor: Brand.amber,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  allowBtnText: {
    color: '#120905',
    fontSize: 16,
    fontWeight: '700',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  laterBtnText: {
    color: Brand.muted,
    fontSize: 15,
  },
});
