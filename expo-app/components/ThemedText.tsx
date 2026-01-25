/**
 * Themed Text component with automatic dark/light mode
 */

import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColors } from '@/lib/hooks/useColorScheme';

export type ThemedTextProps = TextProps & {
  variant?: 'default' | 'secondary' | 'muted' | 'title' | 'subtitle' | 'caption';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
};

export function ThemedText({
  style,
  variant = 'default',
  weight = 'normal',
  ...rest
}: ThemedTextProps) {
  const colors = useThemeColors();

  const color = {
    default: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    title: colors.text,
    subtitle: colors.textSecondary,
    caption: colors.textMuted,
  }[variant];

  const variantStyle = {
    default: styles.default,
    secondary: styles.secondary,
    muted: styles.muted,
    title: styles.title,
    subtitle: styles.subtitle,
    caption: styles.caption,
  }[variant];

  const fontWeight = {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  }[weight];

  return (
    <Text
      style={[
        variantStyle,
        { color, fontWeight },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
});
