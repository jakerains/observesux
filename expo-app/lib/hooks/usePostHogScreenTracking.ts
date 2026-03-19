import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname, useSegments } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

/**
 * Automatically captures a PostHog screen event on every navigation change
 * and an app_opened event on first mount.
 * Call once in a component that is always mounted (e.g. AppShell).
 */
export function usePostHogScreenTracking() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const segments = useSegments();
  const identifiedRef = useRef(false);

  // Capture an app_opened event once the SDK is ready
  useEffect(() => {
    if (!posthog || identifiedRef.current) return;
    identifiedRef.current = true;

    try {
      posthog.capture('app_opened', {
        platform: Platform.OS,
      });
    } catch (error) {
      console.warn('PostHog app_opened capture failed', error);
    }
  }, [posthog]);

  // Track screen views on navigation
  useEffect(() => {
    if (!posthog || !pathname) return;

    // Strip Expo Router group segments like (tabs), (0-home), etc.
    const screenName = segments
      .filter((s) => !(s.startsWith('(') && s.endsWith(')')))
      .join('/') || 'Home';

    try {
      posthog.screen(screenName, { path: pathname });
    } catch (error) {
      console.warn('PostHog screen tracking failed', error);
    }
  }, [posthog, pathname, segments]);
}
