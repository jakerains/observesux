/**
 * Loading state components - skeletons and spinners
 */

import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Animated, Easing, Text, PlatformColor } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: PlatformColor('tertiarySystemFill'),
          opacity,
        },
        style,
      ]}
    />
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'large', message }: LoadingSpinnerProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: PlatformColor('systemBackground') }}>
      <ActivityIndicator size={size} color={PlatformColor('systemBlue')} />
      {message && (
        <Text style={{ marginTop: 12, color: PlatformColor('secondaryLabel') }}>{message}</Text>
      )}
    </View>
  );
}

interface CardSkeletonProps {
  lines?: number;
}

export function CardSkeleton({ lines = 3 }: CardSkeletonProps) {
  return (
    <View style={{ padding: 16 }}>
      <Skeleton width="60%" height={24} style={{ marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height={16}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  );
}
