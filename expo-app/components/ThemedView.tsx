/**
 * Themed View component with automatic dark/light mode
 */

import { View, type ViewProps } from 'react-native';
import { useThemeColors } from '@/lib/hooks/useColorScheme';

export type ThemedViewProps = ViewProps & {
  variant?: 'default' | 'secondary' | 'card';
};

export function ThemedView({
  style,
  variant = 'default',
  ...otherProps
}: ThemedViewProps) {
  const colors = useThemeColors();

  const backgroundColor = {
    default: colors.background,
    secondary: colors.backgroundSecondary,
    card: colors.card,
  }[variant];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
