/**
 * More Screen - Settings, account, and additional sections
 */

import { useCallback } from 'react';
import { View, ScrollView, Pressable, Linking, Switch, Text, PlatformColor, Alert } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useAuth, useSettings, getThemeLabel, getUnitsLabel, getRefreshLabel } from '../../../lib/contexts';
import {
  registerForPushNotifications,
  registerPushTokenWithServer,
  unregisterPushToken,
} from '../../../lib/notifications';

interface MenuItemProps {
  sfSymbol: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  tintColor?: string;
}

function MenuItem({
  sfSymbol,
  label,
  subtitle,
  onPress,
  rightElement,
  tintColor,
}: MenuItemProps) {
  const iconColor = tintColor || PlatformColor('systemBlue');

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 0.5,
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
        <SymbolView name={sfSymbol as SymbolViewProps['name']} tintColor={iconColor} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: PlatformColor('label') }}>{label}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, marginTop: 2, color: PlatformColor('secondaryLabel') }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <SymbolView name="chevron.right" tintColor={PlatformColor('tertiaryLabel')} size={16} />)}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          marginBottom: 8,
          marginLeft: 4,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
          color: PlatformColor('secondaryLabel'),
        }}
      >
        {title}
      </Text>
      <View
        style={{
          borderRadius: 12,
          borderCurve: 'continuous',
          overflow: 'hidden',
          backgroundColor: PlatformColor('secondarySystemBackground'),
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const { user, isAuthenticated, signOut, token } = useAuth();
  const { settings, updateSetting } = useSettings();

  const version = Constants.expoConfig?.version || '1.0.0';

  const openWebsite = () => {
    Linking.openURL('https://siouxland.online');
  };

  const handleSignIn = useCallback(() => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to native sign-in screen
    router.push('/auth/sign-in');
  }, []);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Unregister push token before signing out
            if (token && settings.notificationsEnabled) {
              await unregisterPushToken(token);
            }
            await signOut();
          },
        },
      ]
    );
  }, [signOut, token, settings.notificationsEnabled]);

  const handleNotificationToggle = useCallback(async (enabled: boolean) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (enabled) {
      // Request permission and register
      const pushToken = await registerForPushNotifications();

      if (pushToken) {
        // If user is authenticated, register with server
        if (token) {
          const registered = await registerPushTokenWithServer(pushToken, token);
          if (!registered) {
            Alert.alert(
              'Notification Setup',
              'Notifications enabled locally but could not sync with server. Some alerts may not be delivered.'
            );
          }
        }
        await updateSetting('notificationsEnabled', true);
      } else {
        // Permission denied
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device Settings to receive alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } else {
      // Disable notifications
      if (token) {
        await unregisterPushToken(token);
      }
      await updateSetting('notificationsEnabled', false);
    }
  }, [token, updateSetting]);

  return (
    <ScrollView
      style={{ backgroundColor: PlatformColor('systemBackground') }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Account Section */}
      <MenuSection title="ACCOUNT">
        {isAuthenticated ? (
          <MenuItem
            sfSymbol="person.fill"
            label={user?.name || user?.email || 'Signed In'}
            subtitle={user?.email || 'Tap to sign out'}
            onPress={handleSignOut}
            tintColor="#22c55e"
          />
        ) : (
          <MenuItem
            sfSymbol="person"
            label="Sign In"
            subtitle="Sync settings across devices"
            onPress={handleSignIn}
          />
        )}
        <MenuItem
          sfSymbol="bell"
          label="Notifications"
          subtitle="Weather alerts, traffic updates"
          rightElement={
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotificationToggle}
            />
          }
        />
      </MenuSection>

      {/* Data Sources Section */}
      <MenuSection title="DATA SOURCES">
        <MenuItem
          sfSymbol="cloud.sun.fill"
          label="Weather"
          subtitle="National Weather Service"
          tintColor="#f59e0b"
        />
        <MenuItem
          sfSymbol="bus.fill"
          label="Transit"
          subtitle="Sioux City Transit"
          tintColor="#22c55e"
        />
        <MenuItem
          sfSymbol="video.fill"
          label="Cameras"
          subtitle="Iowa DOT, KTIV"
          tintColor="#3b82f6"
        />
        <MenuItem
          sfSymbol="newspaper.fill"
          label="News"
          subtitle="KTIV, Siouxland Proud, SC Journal"
          tintColor="#8b5cf6"
        />
      </MenuSection>

      {/* Preferences Section */}
      <MenuSection title="PREFERENCES">
        <MenuItem
          sfSymbol="moon"
          label="Appearance"
          subtitle={getThemeLabel(settings.theme)}
          onPress={() => router.push('/(tabs)/(more)/appearance')}
        />
        <MenuItem
          sfSymbol="thermometer"
          label="Units"
          subtitle={getUnitsLabel(settings.temperatureUnit, settings.distanceUnit)}
          onPress={() => router.push('/(tabs)/(more)/units')}
        />
        <MenuItem
          sfSymbol="arrow.clockwise"
          label="Refresh Interval"
          subtitle={getRefreshLabel(settings.refreshMultiplier)}
          onPress={() => router.push('/(tabs)/(more)/refresh')}
        />
      </MenuSection>

      {/* About Section */}
      <MenuSection title="ABOUT">
        <MenuItem
          sfSymbol="info.circle"
          label="About Siouxland Online"
          onPress={() => router.push('/(tabs)/(more)/about')}
        />
        <MenuItem
          sfSymbol="globe"
          label="Website"
          subtitle="siouxland.online"
          onPress={openWebsite}
        />
        <MenuItem
          sfSymbol="chevron.left.forwardslash.chevron.right"
          label="Version"
          subtitle={version}
        />
      </MenuSection>

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Text style={{ fontSize: 12, color: PlatformColor('tertiaryLabel'), marginBottom: 4 }}>
          Real-time data for Sioux City, Iowa
        </Text>
        <Text style={{ fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
          Data refreshes automatically
        </Text>
      </View>
    </ScrollView>
  );
}
