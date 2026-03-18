/**
 * Weather Alert Detail Modal
 */

import { View, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
import { useWeatherAlerts } from '@/lib/hooks/useDataFetching';
import { LoadingSpinner } from '@/components/LoadingState';

const severityColors: Record<string, { bg: string; text: string }> = {
  Extreme: { bg: '#7f1d1d', text: '#ffffff' },
  Severe: { bg: '#ef4444', text: '#ffffff' },
  Moderate: { bg: '#f97316', text: '#ffffff' },
  Minor: { bg: '#f59e0b', text: '#000000' },
  Unknown: { bg: '#64748b', text: '#ffffff' },
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useWeatherAlerts();
  const alerts = Array.isArray(data?.data) ? data.data : [];
  const alert = alerts.find((a) => a.id === id);
  const title = alert?.event ?? 'Alert';

  return (
    <View style={{ flex: 1, backgroundColor: '#120905' }}>
      <Stack.Screen
        options={{
          title,
        }}
      />

      {isLoading ? (
        <LoadingSpinner message="Loading alert..." />
      ) : !alert ? (
        <View style={{ flex: 1, backgroundColor: '#120905', justifyContent: 'center', alignItems: 'center' }}>
          <AppIcon name="exclamationmark.circle" size={64} color={platformColor('tertiaryLabel')} />
          <Text style={{ marginTop: 16, color: platformColor('secondaryLabel') }}>
            Alert not found
          </Text>
        </View>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        >
          {/* Severity Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderCurve: 'continuous',
              marginBottom: 16,
              gap: 8,
              backgroundColor: severityColors[alert.severity]?.bg || severityColors.Unknown.bg,
            }}
          >
            <AppIcon
              name="exclamationmark.triangle.fill"
              size={20}
              color={severityColors[alert.severity]?.text || severityColors.Unknown.text}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: severityColors[alert.severity]?.text || severityColors.Unknown.text,
              }}
            >
              {alert.severity} - {alert.event}
            </Text>
          </View>

          {/* Headline */}
          <Text selectable style={{ fontSize: 17, fontWeight: '600', marginBottom: 16, color: platformColor('label') }}>
            {alert.headline}
          </Text>

          {/* Time Info */}
          <View
            style={{
              borderRadius: 12,
              borderCurve: 'continuous',
              padding: 16,
              marginBottom: 20,
              backgroundColor: '#1f130c',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcon name="clock" size={18} color={platformColor('secondaryLabel')} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: platformColor('secondaryLabel') }}>Onset</Text>
                <Text style={{ fontWeight: '500', color: platformColor('label') }}>
                  {format(new Date(alert.onset), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            </View>
            <View style={{ height: 0.5, backgroundColor: platformColor('separator'), marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcon name="timer" size={18} color={platformColor('secondaryLabel')} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: platformColor('secondaryLabel') }}>Expires</Text>
                <Text style={{ fontWeight: '500', color: platformColor('label') }}>
                  {format(new Date(alert.expires), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            </View>
          </View>

          {/* Area */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AppIcon name="location" size={18} color="#e69c3a" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: platformColor('label') }}>Affected Area</Text>
            </View>
            <Text selectable style={{ color: platformColor('secondaryLabel'), lineHeight: 20 }}>{alert.areaDesc}</Text>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AppIcon name="doc.text" size={18} color="#e69c3a" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: platformColor('label') }}>Description</Text>
            </View>
            <Text selectable style={{ color: platformColor('secondaryLabel'), lineHeight: 22 }}>{alert.description}</Text>
          </View>

          {/* Instructions */}
          {alert.instruction && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AppIcon name="shield.checkered" size={18} color="#e69c3a" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: platformColor('label') }}>Safety Instructions</Text>
              </View>
              <View
                style={{
                  padding: 16,
                  borderRadius: 10,
                  borderCurve: 'continuous',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                }}
              >
                <Text selectable style={{ color: '#e69c3a', lineHeight: 20 }}>{alert.instruction}</Text>
              </View>
            </View>
          )}

          {/* Meta Info */}
          <View style={{ paddingTop: 16, borderTopWidth: 0.5, borderTopColor: platformColor('separator') }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: platformColor('secondaryLabel') }}>Urgency:</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: platformColor('secondaryLabel') }}>{alert.urgency}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: platformColor('secondaryLabel') }}>Certainty:</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: platformColor('secondaryLabel') }}>{alert.certainty}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
