/**
 * More Screen - Settings and additional sections
 */

import { View, ScrollView, Pressable, Linking, Text, PlatformColor } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useSettings, getThemeLabel, getUnitsLabel, getRefreshLabel } from '../../../lib/contexts';

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
  const iconColor = tintColor || '#e69c3a';

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
        <Image source={`sf:${sfSymbol}`} style={{ width: 20, height: 20 }} tintColor={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: PlatformColor('label') }}>{label}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, marginTop: 2, color: PlatformColor('secondaryLabel') }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <Image source="sf:chevron.right" style={{ width: 16, height: 16 }} tintColor={PlatformColor('tertiaryLabel')} />)}
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
          backgroundColor: '#1f130c',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function getNotificationSubtitle(enabled: boolean, settings: ReturnType<typeof useSettings>['settings']): string {
  if (!enabled) return 'Tap to enable';
  const types = [
    settings.notifyWeather && 'Weather',
    settings.notifyRiver && 'River',
    settings.notifyAirQuality && 'Air Quality',
    settings.notifyTraffic && 'Traffic',
    settings.notifyDigest && 'Digest',
  ].filter(Boolean);
  if (types.length === 0) return 'Enabled — no types selected';
  if (types.length === 5) return 'All alerts enabled';
  return `${types.join(', ')}`;
}

export default function MoreScreen() {
  const { settings } = useSettings();

  const version = Constants.expoConfig?.version || '1.0.0';

  const openWebsite = () => {
    Linking.openURL('https://siouxland.online');
  };

  return (
    <ScrollView
      style={{ backgroundColor: '#120905' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Notifications Section */}
      <MenuSection title="NOTIFICATIONS">
        <MenuItem
          sfSymbol="bell"
          label="Notifications"
          subtitle={getNotificationSubtitle(settings.notificationsEnabled, settings)}
          onPress={() => router.push('/(tabs)/(more)/notifications')}
          rightElement={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: settings.notificationsEnabled ? '#22c55e' : '#6b7280',
                }}
              />
              <Image source="sf:chevron.right" style={{ width: 16, height: 16 }} tintColor={PlatformColor('tertiaryLabel')} />
            </View>
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
