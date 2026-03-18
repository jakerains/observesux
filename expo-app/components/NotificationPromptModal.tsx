/**
 * NotificationPromptModal
 *
 * In-app prompt asking users to enable push notifications. Shown on first
 * launch (after a short delay) and re-shown after 3 days if the user tapped
 * "Not Now". Permanently dismissed once the user makes an OS-level decision.
 *
 * Three outcomes:
 *  1. Allow → OS grants → register token with server, permanently dismiss
 *  2. Allow → OS denies → show "Open Settings" state, permanently dismiss
 *  3. Not Now → snooze for 3 days, prompt again on next qualifying launch
 */

import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Brand } from '@/constants/BrandColors';
import { AppIcon } from '@/components/AppIcon';
import { API_BASE_URL } from '@/lib/api';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

const SNOOZE_DAYS = 3;
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;

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

/** Permanently dismiss — user made a real OS-level decision */
const markPermanentlyDismissed = () =>
  setStorageItem(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN, true);

/** Snooze — user tapped "Not Now", try again in SNOOZE_DAYS days */
const snooze = () =>
  setStorageItem(STORAGE_KEYS.NOTIFICATION_SNOOZE_UNTIL, Date.now() + SNOOZE_MS);

async function shouldShowPrompt(): Promise<boolean> {
  // Permanently dismissed (user already made an OS decision)
  const shown = await getStorageItem<boolean>(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN);
  if (shown) return false;

  // Check if currently snoozed
  const snoozeUntil = await getStorageItem<number>(STORAGE_KEYS.NOTIFICATION_SNOOZE_UNTIL);
  if (snoozeUntil && Date.now() < snoozeUntil) return false;

  return true;
}

type ModalState = 'prompt' | 'denied';

interface Props {
  /** Called after the prompt is dismissed (either accepted or skipped) */
  onDismiss: (enabled: boolean) => void;
}

export function NotificationPromptModal({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('prompt');
  const [slideAnim] = useState(() => new Animated.Value(300));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    shouldShowPrompt().then((show) => {
      if (show) {
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
  }, [fadeAnim, slideAnim]);

  const handleAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await registerWithServer();
      await markPermanentlyDismissed();
      dismiss(true);
    } else {
      // OS returned denied — user either denied now, or had denied previously.
      // Show the Settings redirect state instead of silently closing.
      await markPermanentlyDismissed();
      setLoading(false);
      setModalState('denied');
    }
  };

  const handleNotNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await snooze();
    dismiss(false);
  };

  const handleOpenSettings = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openSettings();
    dismiss(false);
  };

  const dismiss = (enabled: boolean) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setModalState('prompt');
      onDismiss(enabled);
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

      <View style={styles.sheetContainer} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

          {modalState === 'prompt' ? (
            <>
              {/* Header icon */}
              <View style={styles.iconRow}>
                <View style={styles.iconBadge}>
                  <AppIcon name="bell.badge.fill" size={32} color={Brand.amber} />
                </View>
              </View>

              <Text style={styles.title}>Stay in the loop on Siouxland</Text>
              <Text style={styles.subtitle}>
                Get real-time alerts the moment something happens in Sioux City. Most users get fewer than 5 notifications a day — no noise, just what matters.
              </Text>

              <View style={styles.typeList}>
                {ALERT_TYPES.map((t) => (
                  <View key={t.symbol} style={styles.typeRow}>
                    <View style={[styles.typeIconBadge, { backgroundColor: t.color + '22' }]}>
                      <AppIcon name={t.symbol} size={16} color={t.color} />
                    </View>
                    <Text style={styles.typeLabel}>{t.label}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [styles.allowBtn, pressed && { opacity: 0.85 }]}
                onPress={handleAllow}
                disabled={loading}
              >
                <Text style={styles.allowBtnText}>
                  {loading ? 'Enabling…' : 'Turn On Notifications'}
                </Text>
              </Pressable>

              <Pressable onPress={handleNotNow} style={styles.laterBtn} disabled={loading}>
                <Text style={styles.laterBtnText}>Not Now</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Denied state — redirect to Settings */}
              <View style={styles.iconRow}>
                <View style={[styles.iconBadge, styles.iconBadgeDenied]}>
                  <AppIcon name="bell.slash.fill" size={32} color={Brand.muted} />
                </View>
              </View>

              <Text style={styles.title}>Notifications are off</Text>
              <Text style={styles.subtitle}>
                To receive Siouxland alerts, enable notifications for this app in your iPhone settings.
              </Text>

              <Text style={styles.settingsHint}>
                Settings → Siouxland Online → Notifications → Allow
              </Text>

              <Pressable
                style={({ pressed }) => [styles.allowBtn, pressed && { opacity: 0.85 }]}
                onPress={handleOpenSettings}
              >
                <Text style={styles.allowBtnText}>Open Settings</Text>
              </Pressable>

              <Pressable onPress={() => dismiss(false)} style={styles.laterBtn}>
                <Text style={styles.laterBtnText}>Maybe Later</Text>
              </Pressable>
            </>
          )}

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
  iconBadgeDenied: {
    backgroundColor: 'rgba(255,255,255,0.07)',
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
  settingsHint: {
    fontSize: 13,
    color: Brand.amber,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    letterSpacing: 0.2,
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
