import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

import {
  useWeatherAlerts,
  useNotifications,
  useAlertSubscriptions,
  type AlertType,
} from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth';
import { WeatherAlertItem } from '@/components/ui';
import { Colors } from '@/constants';

interface AlertCategory {
  id: AlertType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const ALERT_CATEGORIES: AlertCategory[] = [
  {
    id: 'weather',
    label: 'Weather Alerts',
    icon: 'thunderstorm',
    description: 'Severe weather, storms, winter weather',
  },
  {
    id: 'river',
    label: 'Flood Warnings',
    icon: 'water',
    description: 'River levels, flood watches, flood warnings',
  },
  {
    id: 'air_quality',
    label: 'Air Quality',
    icon: 'cloud',
    description: 'AQI alerts, unhealthy conditions',
  },
  {
    id: 'traffic',
    label: 'Traffic Incidents',
    icon: 'car',
    description: 'Road closures, major accidents',
  },
];

export default function AlertsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { isAuthenticated } = useAuthStore();
  const { data: alertsData, isLoading: alertsLoading, refetch } = useWeatherAlerts();
  const alerts = alertsData?.data || [];

  const {
    isEnabled: notificationsEnabled,
    isLoading: notificationsLoading,
    enableNotifications,
    disableNotifications,
    error: notificationError,
  } = useNotifications();

  const {
    isAlertEnabled,
    toggleAlert,
    isLoading: subscriptionsLoading,
    isUpdating,
  } = useAlertSubscriptions();

  const [refreshing, setRefreshing] = useState(false);

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleTogglePushNotifications = async () => {
    triggerHaptic();

    if (notificationsEnabled) {
      Alert.alert(
        'Disable Notifications',
        'Are you sure you want to disable push notifications? You will no longer receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await disableNotifications();
            },
          },
        ]
      );
    } else {
      const success = await enableNotifications();
      if (!success && notificationError) {
        Alert.alert('Error', notificationError);
      }
    }
  };

  const handleToggleCategory = async (categoryId: AlertType) => {
    triggerHaptic();

    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to manage your alert subscriptions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => {} },
        ]
      );
      return;
    }

    if (!notificationsEnabled) {
      Alert.alert(
        'Enable Notifications',
        'Please enable push notifications first to receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              await enableNotifications();
            },
          },
        ]
      );
      return;
    }

    try {
      await toggleAlert(categoryId);
    } catch (error) {
      console.error('Failed to toggle alert:', error);
      Alert.alert('Error', 'Failed to update alert subscription. Please try again.');
    }
  };

  const openNotificationSettings = () => {
    Linking.openSettings();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        gap: 16,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {/* Active Alerts Section */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Active Alerts
        </Text>
        {alertsLoading ? (
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderCurve: 'continuous',
            padding: 24,
            alignItems: 'center',
          }}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : alerts.length === 0 ? (
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderCurve: 'continuous',
            padding: 24,
            alignItems: 'center',
          }}>
            <Ionicons name="checkmark-circle" size={48} color={colors.tint} />
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.text, marginTop: 12 }}>
              All Clear
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
              No active weather alerts for Sioux City area
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {alerts.map((alert) => (
              <WeatherAlertItem
                key={alert.id}
                event={alert.event}
                severity={alert.severity}
                headline={alert.headline}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Push Notification Toggle */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Push Notifications
        </Text>

        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}>
          <Pressable
            onPress={handleTogglePushNotifications}
            disabled={notificationsLoading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{
                height: 40,
                width: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: notificationsEnabled ? `${colors.tint}20` : colors.border,
              }}>
                <Ionicons
                  name={notificationsEnabled ? 'notifications' : 'notifications-off'}
                  size={20}
                  color={notificationsEnabled ? colors.tint : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {notificationsEnabled
                    ? 'You will receive push notifications'
                    : 'Enable to receive alert notifications'}
                </Text>
              </View>
            </View>
            {notificationsLoading ? (
              <ActivityIndicator color={colors.tint} size="small" />
            ) : (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleTogglePushNotifications}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
              />
            )}
          </Pressable>

          {!notificationsEnabled && (
            <Pressable
              onPress={openNotificationSettings}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Ionicons name="settings-outline" size={16} color={colors.tint} />
              <Text style={{ fontSize: 14, color: colors.tint, marginLeft: 8 }}>
                Open System Settings
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Alert Subscriptions */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Alert Subscriptions
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
          {isAuthenticated
            ? 'Choose which alerts you want to receive push notifications for.'
            : 'Sign in to customize your alert subscriptions.'}
        </Text>

        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}>
          {ALERT_CATEGORIES.map((category, index) => {
            const isEnabled = isAlertEnabled(category.id);
            const isDisabled = !notificationsEnabled || !isAuthenticated || isUpdating;

            return (
              <Pressable
                key={category.id}
                onPress={() => handleToggleCategory(category.id)}
                disabled={isDisabled}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: index < ALERT_CATEGORIES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <View style={{
                  height: 40,
                  width: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isEnabled && !isDisabled ? `${colors.tint}20` : colors.border,
                }}>
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={isEnabled && !isDisabled ? colors.tint : colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                    {category.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {category.description}
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggleCategory(category.id)}
                  disabled={isDisabled}
                  trackColor={{ false: colors.border, true: colors.tint }}
                  thumbColor="#fff"
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Alert History */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Recent Alerts
        </Text>

        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          borderCurve: 'continuous',
          padding: 24,
          alignItems: 'center',
        }}>
          <Ionicons name="time-outline" size={32} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            Alert history coming soon
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
