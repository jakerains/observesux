/**
 * More Screen - Settings, account, and additional sections
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useColorScheme } from '@/lib/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  iconColor?: string;
}

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
  iconColor,
}: MenuItemProps) {
  const colors = useThemeColors();

  const content = (
    <View style={[styles.menuItem, { borderColor: colors.separator }]}>
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.accent) + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor || colors.accent} />
      </View>
      <View style={styles.menuItemContent}>
        <ThemedText weight="medium">{label}</ThemedText>
        {subtitle && (
          <ThemedText variant="muted" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
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
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      <ThemedText variant="caption" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  const openWebsite = () => {
    Linking.openURL('https://siouxland.online');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <MenuSection title="ACCOUNT">
          <MenuItem
            icon="person-outline"
            label="Sign In"
            subtitle="Sync settings across devices"
            onPress={() => {}}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            subtitle="Weather alerts, traffic updates"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.separator, true: colors.accent }}
              />
            }
          />
        </MenuSection>

        {/* Data Sources Section */}
        <MenuSection title="DATA SOURCES">
          <MenuItem
            icon="partly-sunny-outline"
            label="Weather"
            subtitle="National Weather Service"
            iconColor="#f59e0b"
          />
          <MenuItem
            icon="bus-outline"
            label="Transit"
            subtitle="Sioux City Transit"
            iconColor="#22c55e"
          />
          <MenuItem
            icon="videocam-outline"
            label="Cameras"
            subtitle="Iowa DOT, KTIV"
            iconColor="#3b82f6"
          />
          <MenuItem
            icon="newspaper-outline"
            label="News"
            subtitle="KTIV, Siouxland Proud, SC Journal"
            iconColor="#8b5cf6"
          />
        </MenuSection>

        {/* Preferences Section */}
        <MenuSection title="PREFERENCES">
          <MenuItem
            icon="moon-outline"
            label="Appearance"
            subtitle={colorScheme === 'dark' ? 'Dark' : 'Light'}
          />
          <MenuItem
            icon="speedometer-outline"
            label="Units"
            subtitle="Fahrenheit, Miles"
          />
          <MenuItem
            icon="refresh-outline"
            label="Refresh Interval"
            subtitle="Default"
          />
        </MenuSection>

        {/* About Section */}
        <MenuSection title="ABOUT">
          <MenuItem
            icon="information-circle-outline"
            label="About Siouxland Online"
            onPress={() => {}}
          />
          <MenuItem
            icon="globe-outline"
            label="Website"
            subtitle="siouxland.online"
            onPress={openWebsite}
          />
          <MenuItem
            icon="code-slash-outline"
            label="Version"
            subtitle="1.0.0"
          />
        </MenuSection>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText variant="caption" style={styles.footerText}>
            Real-time data for Sioux City, Iowa
          </ThemedText>
          <ThemedText variant="caption" style={styles.footerText}>
            Data refreshes automatically
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    opacity: 0.6,
    marginBottom: 4,
  },
});
