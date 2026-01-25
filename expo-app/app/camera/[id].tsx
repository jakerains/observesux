/**
 * Camera Detail Modal - Full-screen camera view
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

export default function CameraDetailScreen() {
  const { id, name, imageUrl } = useLocalSearchParams<{
    id: string;
    name: string;
    imageUrl: string;
  }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Auto-refresh the image every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setImageKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setImageError(false);
    setImageKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Add cache-busting to the URL
  const refreshedImageUrl = imageUrl
    ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${imageKey}`
    : '';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: name || 'Camera',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={isRefreshing}
              style={styles.headerButton}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="refresh" size={22} color={colors.accent} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="videocam-off-outline" size={64} color={colors.textMuted} />
            <ThemedText variant="muted" style={styles.errorText}>
              Unable to load camera feed
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.accent }]}
              onPress={handleRefresh}
            >
              <ThemedText style={{ color: colors.accentForeground }}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <Image
            key={imageKey}
            source={{ uri: refreshedImageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
            onError={() => setImageError(true)}
          />
        )}
      </View>

      {/* Camera Info */}
      <View style={[styles.infoBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.infoRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <ThemedText variant="caption" weight="semibold" style={styles.liveText}>
              LIVE
            </ThemedText>
          </View>
          <ThemedText variant="caption">Auto-refreshes every 30s</ThemedText>
        </View>

        <ThemedText variant="muted" style={styles.cameraName}>
          {name}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: width * 0.75, // 4:3 aspect ratio
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoBar: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 11,
  },
  cameraName: {
    fontSize: 13,
  },
});
