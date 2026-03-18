import { useEffect } from 'react';
import { usePathname, useSegments } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

/**
 * Automatically captures a PostHog screen event on every navigation change.
 * Call once in a component that is always mounted (e.g. AppShell).
 */
export function usePostHogScreenTracking() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (!posthog || !pathname) return;

    // Build a readable screen name from segments, stripping group prefixes
    const screenName = segments
      .filter((s) => !s.startsWith('(') || !s.endsWith(')'))
      .join('/') || 'Home';

    posthog.screen(screenName, { path: pathname });
  }, [posthog, pathname, segments]);
}
