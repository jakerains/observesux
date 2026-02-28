/**
 * Alert Subscriptions Settings Screen
 * Manage weather, river, air quality, and traffic alert subscriptions
 */

import { View, Text, Switch, ActivityIndicator, Pressable, ScrollView, PlatformColor } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../lib/contexts';
import {
  useAlertSubscriptions,
  useToggleAlertSubscription,
  useUpsertAlertSubscription,
} from '../../../lib/hooks/useDataFetching';
import type { AlertType } from '../../../lib/types';

interface AlertConfig {
  alertType: AlertType;
  label: string;
  sfSymbol: string;
  description: string;
  defaultConfig: Record<string, unknown>;
}

const ALERT_CONFIGS: AlertConfig[] = [
  {
    alertType: 'weather',
    label: 'Weather',
    sfSymbol: 'cloud.bolt',
    description: 'Severe weather warnings and watches',
    defaultConfig: { severities: ['Moderate', 'Severe', 'Extreme'] },
  },
  {
    alertType: 'river',
    label: 'River',
    sfSymbol: 'drop',
    description: 'Flood stage and action stage alerts',
    defaultConfig: { stages: ['action', 'flood'] },
  },
  {
    alertType: 'air_quality',
    label: 'Air Quality',
    sfSymbol: 'aqi.medium',
    description: 'Unhealthy AQI threshold alerts',
    defaultConfig: { minAqi: 101 },
  },
  {
    alertType: 'traffic',
    label: 'Traffic',
    sfSymbol: 'car.side.rear.and.collision.and.car.side.front',
    description: 'Major incidents and road closures',
    defaultConfig: { severities: ['major', 'critical'] },
  },
];

interface AlertRowProps {
  config: AlertConfig;
  subscription: { enabled: boolean; config: Record<string, unknown> } | null;
  onToggle: (alertType: AlertType, enabled: boolean) => void;
  isToggling: boolean;
}

function AlertRow({ config, subscription, onToggle, isToggling }: AlertRowProps) {
  const isEnabled = subscription?.enabled ?? false;

  const handleToggle = (value: boolean) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(config.alertType, value);
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          borderBottomWidth: isEnabled ? 0 : 0.5,
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
            source={`sf:${config.sfSymbol}`}
            style={{ width: 20, height: 20 }}
            tintColor="#e69c3a"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '500', color: PlatformColor('label') }}>{config.label}</Text>
          <Text style={{ fontSize: 12, marginTop: 2, color: PlatformColor('secondaryLabel') }}>
            {config.description}
          </Text>
        </View>
        {isToggling ? (
          <ActivityIndicator size="small" color="#e69c3a" />
        ) : (
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: undefined, true: '#e69c3a' }}
          />
        )}
      </View>

      {isEnabled && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: 'rgba(230, 156, 58, 0.08)',
            borderBottomWidth: 0.5,
            borderBottomColor: PlatformColor('separator'),
          }}
        >
          <AlertConfigDetails alertType={config.alertType} subscriptionConfig={subscription?.config ?? config.defaultConfig} />
        </View>
      )}
    </View>
  );
}

interface AlertConfigDetailsProps {
  alertType: AlertType;
  subscriptionConfig: Record<string, unknown>;
}

function AlertConfigDetails({ alertType, subscriptionConfig }: AlertConfigDetailsProps) {
  if (alertType === 'weather') {
    const severities = (subscriptionConfig.severities as string[]) ?? ['Moderate', 'Severe', 'Extreme'];
    return (
      <View>
        <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel'), marginBottom: 6 }}>
          Alert on severity:
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['Moderate', 'Severe', 'Extreme'].map((level) => (
            <View
              key={level}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: severities.includes(level) ? 'rgba(230, 156, 58, 0.25)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: severities.includes(level) ? '#e69c3a' : PlatformColor('tertiaryLabel'),
                }}
              >
                {level}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (alertType === 'river') {
    return (
      <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
        Alerts when river reaches action or flood stage
      </Text>
    );
  }

  if (alertType === 'air_quality') {
    const minAqi = (subscriptionConfig.minAqi as number) ?? 101;
    return (
      <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
        Alert when AQI exceeds {minAqi} (Unhealthy for Sensitive Groups)
      </Text>
    );
  }

  if (alertType === 'traffic') {
    const severities = (subscriptionConfig.severities as string[]) ?? ['major', 'critical'];
    return (
      <View>
        <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel'), marginBottom: 6 }}>
          Alert on severity:
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['minor', 'moderate', 'major', 'critical'].map((level) => (
            <View
              key={level}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: severities.includes(level) ? 'rgba(230, 156, 58, 0.25)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: severities.includes(level) ? '#e69c3a' : PlatformColor('tertiaryLabel'),
                  textTransform: 'capitalize',
                }}
              >
                {level}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
}

export default function AlertsScreen() {
  const { token, isAuthenticated } = useAuth();
  const { data, isLoading } = useAlertSubscriptions(token);
  const toggleMutation = useToggleAlertSubscription(token);
  const upsertMutation = useUpsertAlertSubscription(token);

  const handleToggle = async (alertType: AlertType, enabled: boolean) => {
    const existing = data?.subscriptions?.[alertType];

    if (enabled && !existing) {
      // Create new subscription with defaults
      const defaultConfig = ALERT_CONFIGS.find((c) => c.alertType === alertType)?.defaultConfig ?? {};
      await upsertMutation.mutateAsync({ alertType, config: defaultConfig, enabled: true });
    } else {
      await toggleMutation.mutateAsync({ alertType, enabled });
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#120905', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Image source="sf:bell.badge" style={{ width: 48, height: 48, marginBottom: 16 }} tintColor="#e69c3a" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: PlatformColor('label'),
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Sign in to manage alerts
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: PlatformColor('secondaryLabel'),
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          Create an account to subscribe to weather, river, air quality, and traffic alerts.
        </Text>
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/auth/sign-in');
          }}
          style={{
            backgroundColor: '#e69c3a',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#120905', fontWeight: '600', fontSize: 16 }}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#120905', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#e69c3a" />
        <Text style={{ marginTop: 12, color: PlatformColor('secondaryLabel'), fontSize: 14 }}>
          Loading subscriptions...
        </Text>
      </View>
    );
  }

  const isTogglingType =
    (toggleMutation.isPending || upsertMutation.isPending)
      ? ((toggleMutation.variables as { alertType: AlertType } | undefined)?.alertType ||
         (upsertMutation.variables as { alertType: AlertType } | undefined)?.alertType)
      : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#120905' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
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
        ALERT TYPES
      </Text>
      <View
        style={{
          borderRadius: 12,
          borderCurve: 'continuous',
          overflow: 'hidden',
          backgroundColor: '#1f130c',
          marginBottom: 16,
        }}
      >
        {ALERT_CONFIGS.map((config) => (
          <AlertRow
            key={config.alertType}
            config={config}
            subscription={data?.subscriptions?.[config.alertType] ?? null}
            onToggle={handleToggle}
            isToggling={isTogglingType === config.alertType}
          />
        ))}
      </View>

      <Text
        style={{
          marginHorizontal: 4,
          fontSize: 13,
          color: PlatformColor('secondaryLabel'),
          lineHeight: 18,
        }}
      >
        Alert notifications are delivered via push notification. Make sure notifications are enabled
        in your device settings and in the More tab.
      </Text>
    </ScrollView>
  );
}
