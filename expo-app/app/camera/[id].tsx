/**
 * Camera Detail Modal - Full-screen camera view with optional live streaming
 */

import { useState, useEffect } from 'react';
import { View, Pressable, Text, PlatformColor, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

type ViewMode = 'snapshot' | 'live';

export default function CameraDetailScreen() {
  const { id, name, imageUrl, streamUrl } = useLocalSearchParams<{
    id: string;
    name: string;
    imageUrl: string;
    streamUrl?: string;
  }>();
  const hasLiveStream = !!streamUrl;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<ViewMode>('snapshot');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);

  // Auto-refresh the image every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setImageKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRefreshing(true);
    setImageError(false);
    setImageKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Add cache-busting to the URL
  const refreshedImageUrl = imageUrl
    ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${imageKey}`
    : '';

  // HTML for native iOS HLS playback - iOS Safari supports HLS natively
  // Using source element with type for better compatibility
  const videoPlayerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#000;overflow:hidden}
    body{display:flex;justify-content:center;align-items:center}
    video{width:100%;height:100%;object-fit:contain;background:#000}
    .error{color:#fff;text-align:center;padding:20px;font-family:-apple-system,system-ui,sans-serif}
  </style>
</head>
<body>
  <video id="player" playsinline controls>
    <source src="${streamUrl}" type="application/x-mpegURL">
    <source src="${streamUrl}" type="application/vnd.apple.mpegurl">
  </video>
  <script>
    var video = document.getElementById('player');
    video.muted = true;

    video.addEventListener('loadedmetadata', function() {
      video.play().catch(function(e) { console.log('Play error:', e); });
    });

    video.addEventListener('error', function(e) {
      document.body.innerHTML = '<div class="error">Stream unavailable</div>';
    });

    // Try to load
    video.load();
  </script>
</body>
</html>`;

  const toggleViewMode = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setViewMode((prev) => (prev === 'snapshot' ? 'live' : 'snapshot'));
    setStreamLoading(true);
    setStreamError(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#120905' }}>
      <Stack.Screen
        options={{
          title: name || 'Camera',
          headerRight: () =>
            viewMode === 'snapshot' ? (
              <Pressable
                onPress={handleRefresh}
                disabled={isRefreshing}
                style={{ padding: 8 }}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={'#e69c3a'} />
                ) : (
                  <Image source="sf:arrow.clockwise" style={{ width: 22, height: 22 }} tintColor={'#e69c3a'} />
                )}
              </Pressable>
            ) : null,
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        {viewMode === 'snapshot' ? (
          // Snapshot View
          imageError ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#1f130c',
              }}
            >
              <Image source="sf:video.slash" style={{ width: 64, height: 64 }} tintColor={PlatformColor('tertiaryLabel')} />
              <Text style={{ marginTop: 16, marginBottom: 20, color: PlatformColor('secondaryLabel') }}>
                Unable to load camera feed
              </Text>
              <Pressable
                onPress={handleRefresh}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: '#e69c3a',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <Image
              key={imageKey}
              source={{ uri: refreshedImageUrl }}
              style={{ width: width, height: width * 0.75 }}
              contentFit="contain"
              transition={200}
              onError={() => setImageError(true)}
            />
          )
        ) : (
          // Live Stream View
          <View style={{ flex: 1, width: '100%' }}>
            {streamLoading && !streamError && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1,
                }}
              >
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={{ color: '#ffffff', marginTop: 12, fontSize: 14 }}>Loading live stream...</Text>
              </View>
            )}
            {streamError ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#1f130c',
                }}
              >
                <Image source="sf:video.slash" style={{ width: 64, height: 64 }} tintColor={PlatformColor('tertiaryLabel')} />
                <Text style={{ marginTop: 16, marginBottom: 8, color: PlatformColor('label'), fontWeight: '600' }}>
                  Stream Unavailable
                </Text>
                <Text style={{ marginBottom: 20, color: PlatformColor('secondaryLabel'), textAlign: 'center', paddingHorizontal: 32 }}>
                  The live video stream could not be loaded. Try the snapshot view instead.
                </Text>
                <Pressable
                  onPress={toggleViewMode}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderCurve: 'continuous',
                    backgroundColor: '#e69c3a',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>View Snapshot</Text>
                </Pressable>
              </View>
            ) : (
              <WebView
                source={{
                  html: videoPlayerHtml,
                  baseUrl: 'https://siouxland.online',
                }}
                style={{ flex: 1, backgroundColor: '#000000' }}
                allowsInlineMediaPlayback
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                originWhitelist={['*']}
                allowsLinkPreview={false}
                bounces={false}
                scrollEnabled={false}
                contentMode="mobile"
                onLoadEnd={() => setStreamLoading(false)}
                onError={() => {
                  setStreamLoading(false);
                  setStreamError(true);
                }}
                onMessage={(event) => {
                  // Handle messages from WebView if needed
                  console.log('WebView message:', event.nativeEvent.data);
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* Camera Info & Controls */}
      <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        {/* View Mode Toggle (only show if live stream available) */}
        {hasLiveStream && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: PlatformColor('tertiarySystemFill'),
              borderRadius: 8,
              padding: 4,
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={() => viewMode !== 'snapshot' && toggleViewMode()}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                borderRadius: 6,
                gap: 6,
                backgroundColor: viewMode === 'snapshot' ? '#120905' : 'transparent',
              }}
            >
              <Image
                source="sf:photo"
                style={{ width: 16, height: 16 }}
                tintColor={viewMode === 'snapshot' ? PlatformColor('label') : PlatformColor('secondaryLabel')}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: viewMode === 'snapshot' ? '600' : '400',
                  color: viewMode === 'snapshot' ? PlatformColor('label') : PlatformColor('secondaryLabel'),
                }}
              >
                Snapshot
              </Text>
            </Pressable>
            <Pressable
              onPress={() => viewMode !== 'live' && toggleViewMode()}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                borderRadius: 6,
                gap: 6,
                backgroundColor: viewMode === 'live' ? '#120905' : 'transparent',
              }}
            >
              <Image
                source="sf:video.fill"
                style={{ width: 16, height: 16 }}
                tintColor={viewMode === 'live' ? '#ef4444' : PlatformColor('secondaryLabel')}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: viewMode === 'live' ? '600' : '400',
                  color: viewMode === 'live' ? PlatformColor('label') : PlatformColor('secondaryLabel'),
                }}
              >
                Live Video
              </Text>
            </Pressable>
          </View>
        )}

        {/* Status Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: viewMode === 'live' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: viewMode === 'live' ? '#ef4444' : '#22c55e',
                marginRight: 6,
              }}
            />
            <Text
              style={{
                color: viewMode === 'live' ? '#ef4444' : '#22c55e',
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {viewMode === 'live' ? 'STREAMING' : 'LIVE'}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
            {viewMode === 'live' ? 'Real-time video feed' : 'Auto-refreshes every 30s'}
          </Text>
        </View>

        <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel') }}>{name}</Text>
      </View>
    </View>
  );
}
