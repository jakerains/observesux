import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, PlatformColor } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Brand } from '@/constants/BrandColors';
import { SunWidget } from '@/components/widgets/SunWidget';
import { useSunTimes } from '@/lib/hooks/useDataFetching';
import { buildSunLiveActivityPayload } from '@/lib/sun';
import {
  endSunLiveActivity,
  getSunLiveActivityState,
  startSunLiveActivity,
  type SunLiveActivityState,
} from '@/lib/native/sunDaylightActivity';

const initialState: SunLiveActivityState = {
  isSupported: false,
  areActivitiesEnabled: false,
  activeActivityId: null,
  phase: null,
  targetDate: null,
  staleDate: null,
};

function ActionButton({
  title,
  icon,
  onPress,
  tone = 'primary',
  disabled = false,
  loading = false,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}) {
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 46,
        borderRadius: 12,
        borderCurve: 'continuous',
        paddingHorizontal: 16,
        backgroundColor: isPrimary ? Brand.amber : Brand.secondary,
        opacity: disabled ? 0.55 : pressed ? 0.88 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Brand.background : Brand.amber} />
      ) : (
        <Image
          source={`sf:${icon}`}
          style={{ width: 16, height: 16 }}
          tintColor={isPrimary ? Brand.background : Brand.amber}
        />
      )}
      <Text style={{ color: isPrimary ? Brand.background : Brand.amber, fontWeight: '700', fontSize: 15 }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function SunWidgetsScreen() {
  const { data, isLoading, refetch, isFetching } = useSunTimes();
  const sun = data?.data;
  const [activityState, setActivityState] = useState<SunLiveActivityState>(initialState);
  const [pendingAction, setPendingAction] = useState<'start' | 'stop' | null>(null);

  const refreshActivityState = useCallback(async () => {
    const state = await getSunLiveActivityState();
    setActivityState(state);
  }, []);

  useFocusEffect(useCallback(() => {
    void refreshActivityState();
  }, [refreshActivityState]));

  useEffect(() => {
    void refreshActivityState();
  }, [refreshActivityState]);

  const handleStart = async () => {
    if (!sun || pendingAction) {
      return;
    }

    if (process.env.EXPO_OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setPendingAction('start');
    try {
      const nextState = await startSunLiveActivity(buildSunLiveActivityPayload(sun));
      setActivityState(nextState);
    } finally {
      setPendingAction(null);
    }
  };

  const handleStop = async () => {
    if (pendingAction) {
      return;
    }

    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setPendingAction('stop');
    try {
      const nextState = await endSunLiveActivity();
      setActivityState(nextState);
    } finally {
      setPendingAction(null);
    }
  };

  const phaseLabel = activityState.phase === 'daylight' ? 'Daylight countdown is active' : 'Sunrise countdown is active';

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      >
        <SunWidget />

        <View
          style={{
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: Brand.card,
            padding: 18,
            gap: 14,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ color: Brand.foreground, fontSize: 19, fontWeight: '700' }}>
              Live Activity
            </Text>
            <Text style={{ color: Brand.muted, fontSize: 14, lineHeight: 20 }}>
              Pin the daylight countdown to the Lock Screen and Dynamic Island while the sun is up,
              or keep a sunrise countdown ready overnight.
            </Text>
          </View>

          <View
            style={{
              borderRadius: 14,
              borderCurve: 'continuous',
              padding: 14,
              gap: 6,
              backgroundColor: Brand.secondary,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: activityState.activeActivityId ? '#22c55e' : '#6b7280',
                }}
              />
              <Text style={{ color: Brand.foreground, fontWeight: '600', fontSize: 14 }}>
                {activityState.activeActivityId ? phaseLabel : 'No active Live Activity'}
              </Text>
            </View>
            <Text style={{ color: Brand.muted, fontSize: 13 }}>
              {activityState.targetDate
                ? `Target updates at ${new Date(activityState.targetDate).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}.`
                : 'Start tracking to publish the current daylight window to iPhone surfaces.'}
            </Text>
            <Text style={{ color: Brand.muted, fontSize: 13 }}>
              {activityState.isSupported
                ? activityState.areActivitiesEnabled
                  ? 'Live Activities are enabled on this device.'
                  : 'Live Activities are turned off for this device or app.'
                : 'This runtime does not support Live Activities.'}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <ActionButton
              title="Track Daylight"
              icon="sun.max.fill"
              onPress={handleStart}
              disabled={!sun || !activityState.areActivitiesEnabled || isLoading}
              loading={pendingAction === 'start'}
            />
            <ActionButton
              title="Stop Live Activity"
              icon="xmark.circle.fill"
              tone="secondary"
              onPress={handleStop}
              disabled={!activityState.activeActivityId}
              loading={pendingAction === 'stop'}
            />
          </View>

          <Pressable
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              void refetch();
              void refreshActivityState();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {isFetching ? (
              <ActivityIndicator color={Brand.amber} />
            ) : (
              <Image source="sf:arrow.clockwise" style={{ width: 14, height: 14 }} tintColor={Brand.amber} />
            )}
            <Text style={{ color: Brand.amber, fontSize: 14, fontWeight: '600' }}>
              Refresh live state
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: Brand.card,
            padding: 18,
            gap: 10,
          }}
        >
          <Text style={{ color: Brand.foreground, fontSize: 16, fontWeight: '700' }}>
            Widget notes
          </Text>
          <Text style={{ color: Brand.muted, fontSize: 14, lineHeight: 20 }}>
            The iPhone widgets and this Live Activity fetch their own data natively from
            `siouxland.online`, so they can refresh even when the Expo app is not open.
          </Text>
          <Text style={{ color: PlatformColor('secondaryLabel'), fontSize: 13, lineHeight: 18 }}>
            Home Screen and Lock Screen widgets are backed by WidgetKit. This screen lives under
            More so the setup tools feel like a device preference instead of part of the main
            dashboard flow.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
