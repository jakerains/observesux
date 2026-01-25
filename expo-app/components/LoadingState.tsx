/**
 * Loading state components - skeletons and spinners
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { ThemedText } from './ThemedText';

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
  const colors = useThemeColors();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
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
          backgroundColor: colors.separator,
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
  const colors = useThemeColors();

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={colors.accent} />
      {message && (
        <ThemedText variant="muted" style={styles.spinnerMessage}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

interface CardSkeletonProps {
  lines?: number;
}

export function CardSkeleton({ lines = 3 }: CardSkeletonProps) {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton width="60%" height={24} style={styles.skeletonTitle} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height={16}
          style={styles.skeletonLine}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinnerMessage: {
    marginTop: 12,
  },
  cardSkeleton: {
    padding: 16,
  },
  skeletonTitle: {
    marginBottom: 16,
  },
  skeletonLine: {
    marginBottom: 8,
  },
});
