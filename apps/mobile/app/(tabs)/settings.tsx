import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  useColorScheme,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { Colors } from '@/constants';
import { mmkvStorage, STORAGE_KEYS, storage } from '@/lib/storage';
import { useAuthStore } from '@/lib/auth';
import { useNotifications } from '@/lib/hooks';

interface SettingsItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  subtitle?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const { user, isAuthenticated, signOut } = useAuthStore();
  const { isEnabled: notificationsEnabled, enableNotifications, disableNotifications } = useNotifications();

  const [autoRefresh, setAutoRefresh] = useState(
    storage.getBoolean(STORAGE_KEYS.AUTO_REFRESH) ?? true
  );

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleOpenWeb = async () => {
    triggerHaptic();
    await WebBrowser.openBrowserAsync('https://observesux.vercel.app');
  };

  const handleFeedback = async () => {
    triggerHaptic();
    await WebBrowser.openBrowserAsync('https://observesux.vercel.app/suggest');
  };

  const handleClearCache = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and refresh the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            mmkvStorage.clearAll();
            Alert.alert('Cache Cleared', 'All cached data has been cleared.');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleToggleAutoRefresh = (value: boolean) => {
    triggerHaptic();
    setAutoRefresh(value);
    storage.set(STORAGE_KEYS.AUTO_REFRESH, value);
  };

  const handleToggleNotifications = async (value: boolean) => {
    triggerHaptic();
    if (value) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: isAuthenticated
        ? ([
            {
              id: 'profile',
              label: user?.name || user?.email || 'Account',
              icon: 'person-circle',
              type: 'navigation',
              subtitle: user?.email,
              onPress: () => triggerHaptic(),
            },
            {
              id: 'sign-out',
              label: 'Sign Out',
              icon: 'log-out',
              type: 'action',
              destructive: true,
              onPress: handleSignOut,
            },
          ] as SettingsItem[])
        : ([
            {
              id: 'sign-in',
              label: 'Sign In',
              icon: 'person-circle',
              type: 'navigation',
              subtitle: 'Sync your settings across devices',
              onPress: () => {
                triggerHaptic();
                router.push('/auth/sign-in');
              },
            },
          ] as SettingsItem[]),
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          label: 'Push Notifications',
          icon: 'notifications',
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: handleToggleNotifications,
        },
        {
          id: 'alerts',
          label: 'Manage Alerts',
          icon: 'alert-circle',
          type: 'navigation',
          subtitle: 'Configure alert subscriptions',
          onPress: () => {
            triggerHaptic();
            router.push('/(tabs)/alerts');
          },
        },
      ] as SettingsItem[],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          label: 'Theme',
          icon: 'color-palette',
          type: 'navigation',
          subtitle: isDark ? 'Dark (System)' : 'Light (System)',
        },
      ] as SettingsItem[],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'refresh',
          label: 'Auto Refresh',
          icon: 'refresh',
          type: 'toggle',
          value: autoRefresh,
          onToggle: handleToggleAutoRefresh,
        },
        {
          id: 'cache',
          label: 'Clear Cache',
          icon: 'trash',
          type: 'action',
          onPress: handleClearCache,
        },
      ] as SettingsItem[],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          label: 'Version',
          icon: 'information-circle',
          type: 'navigation',
          subtitle: APP_VERSION,
        },
        {
          id: 'web',
          label: 'Open Web Version',
          icon: 'globe',
          type: 'action',
          onPress: handleOpenWeb,
        },
        {
          id: 'feedback',
          label: 'Send Feedback',
          icon: 'chatbubble',
          type: 'action',
          onPress: handleFeedback,
        },
      ] as SettingsItem[],
    },
  ];

  const renderSettingsItem = (item: SettingsItem, isLast: boolean) => {
    return (
      <Pressable
        key={item.id}
        onPress={item.type === 'toggle' ? undefined : item.onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
          opacity: pressed && item.onPress && item.type !== 'toggle' ? 0.7 : 1,
        })}
      >
        <View
          style={{
            height: 32,
            width: 32,
            borderRadius: 8,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.destructive ? 'rgba(239, 68, 68, 0.1)' : colors.card,
          }}
        >
          <Ionicons
            name={item.icon}
            size={18}
            color={item.destructive ? '#ef4444' : colors.textMuted}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, color: item.destructive ? '#ef4444' : colors.text }}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.type === 'navigation' && (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.border, true: colors.tint }}
            thumbColor="#fff"
          />
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        gap: 24,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Card */}
      {isAuthenticated && user && (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: 'continuous',
          padding: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              height: 64,
              width: 64,
              borderRadius: 32,
              backgroundColor: `${colors.tint}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={{ height: 64, width: 64, borderRadius: 32 }}
                />
              ) : (
                <Ionicons name="person" size={32} color={colors.tint} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                {user.name || 'Welcome'}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>{user.email}</Text>
            </View>
          </View>
        </View>
      )}

      {settingsSections.map((section) => (
        <View key={section.title}>
          <Text style={{
            fontSize: 12,
            fontWeight: '500',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
            marginLeft: 4,
          }}>
            {section.title}
          </Text>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderCurve: 'continuous',
            overflow: 'hidden',
          }}>
            {section.items.map((item, index) =>
              renderSettingsItem(item, index === section.items.length - 1)
            )}
          </View>
        </View>
      ))}

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>ObserveSUX</Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
          Sioux City Observability Dashboard
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 16 }}>
          Made with love for Siouxland
        </Text>
      </View>
    </ScrollView>
  );
}
