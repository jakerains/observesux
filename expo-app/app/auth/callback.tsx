/**
 * Auth Callback Screen
 * Handles deep link callbacks from OAuth flow
 * This screen is shown briefly while processing the auth token
 */

import { useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, PlatformColor } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../lib/contexts';

export default function AuthCallbackScreen() {
  const { token, error } = useLocalSearchParams<{ token?: string; error?: string }>();
  const { signIn } = useAuth();

  const handleCallback = useCallback(async () => {
    if (error) {
      console.error('Auth error:', error);
      // Navigate back to more screen after a brief delay
      setTimeout(() => {
        router.replace('/(tabs)/(more)');
      }, 1500);
      return;
    }

    if (token) {
      try {
        await signIn(token);
        // Navigate to more screen on success
        router.replace('/(tabs)/(more)');
      } catch (e) {
        console.error('Sign in error:', e);
        router.replace('/(tabs)/(more)');
      }
    } else {
      // No token or error - just go back
      router.replace('/(tabs)/(more)');
    }
  }, [token, error, signIn]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PlatformColor('systemBackground'),
      }}
    >
      {error ? (
        <>
          <Text style={{ color: PlatformColor('systemRed'), fontSize: 18, marginBottom: 8 }}>
            Sign In Failed
          </Text>
          <Text style={{ color: PlatformColor('secondaryLabel'), textAlign: 'center', paddingHorizontal: 20 }}>
            {error}
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={PlatformColor('systemBlue')} />
          <Text style={{ color: PlatformColor('secondaryLabel'), marginTop: 16 }}>
            Completing sign in...
          </Text>
        </>
      )}
    </View>
  );
}
