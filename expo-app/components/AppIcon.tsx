import React from 'react';
import { Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { iconMap } from '@/lib/iconMap';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
}

export function AppIcon({ name, size = 20, color, style }: AppIconProps) {
  if (Platform.OS === 'ios') {
    // iOS: use SF Symbols via expo-image (preserves current behavior exactly)
    return (
      <Image
        source={`sf:${name}`}
        style={[{ width: size, height: size }, style]}
        tintColor={color}
      />
    );
  }

  // Android: look up the icon map and render via @expo/vector-icons
  const mapping = iconMap[name];
  if (!mapping) {
    // Fallback: render a placeholder icon and warn in dev
    console.warn(`AppIcon: No Android mapping for SF Symbol "${name}"`);
    return (
      <Ionicons
        name="help-circle-outline"
        size={size}
        color={color}
        style={style}
      />
    );
  }

  if (mapping.family === 'MaterialCommunityIcons') {
    return (
      <MaterialCommunityIcons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name={mapping.name as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return (
    <Ionicons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name={mapping.name as any}
      size={size}
      color={color}
      style={style}
    />
  );
}
