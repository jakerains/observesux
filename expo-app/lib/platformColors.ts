import { Platform, PlatformColor } from 'react-native';

// Android dark-mode equivalents for iOS semantic colors.
// The app forces dark mode (userInterfaceStyle: "dark"), so we only need dark values.
const androidColors: Record<string, string> = {
  // Text colors
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
  placeholderText: 'rgba(235, 235, 245, 0.3)',

  // Background colors
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',

  // Fill colors
  systemFill: 'rgba(120, 120, 128, 0.36)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
  tertiarySystemFill: 'rgba(120, 120, 128, 0.24)',
  quaternarySystemFill: 'rgba(120, 120, 128, 0.18)',

  // Separator
  separator: 'rgba(84, 84, 88, 0.6)',
  opaqueSeparator: '#38383A',

  // System colors
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemRed: '#FF453A',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemTeal: '#64D2FF',
  systemIndigo: '#5E5CE6',
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
};

/**
 * Cross-platform replacement for PlatformColor().
 * iOS: returns PlatformColor(name) for native dynamic colors.
 * Android: returns a hardcoded dark-mode hex string equivalent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function platformColor(name: string): any {
  if (Platform.OS === 'ios') {
    return PlatformColor(name);
  }
  return androidColors[name] ?? '#FFFFFF';
}
