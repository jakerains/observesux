/**
 * Appearance Settings Screen
 * Theme picker: Light, Dark, System
 */

import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
import { useSettings, type Settings } from '../../../lib/contexts';

type Theme = Settings['theme'];

interface ThemeOptionProps {
  label: string;
  description: string;
  sfSymbol: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeOption({ label, description, sfSymbol, isSelected, onSelect }: ThemeOptionProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: platformColor('separator'),
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: platformColor('tertiarySystemFill'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <AppIcon name={sfSymbol} size={22} color="#e69c3a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, color: platformColor('label') }}>{label}</Text>
        <Text style={{ fontSize: 13, color: platformColor('secondaryLabel'), marginTop: 2 }}>
          {description}
        </Text>
      </View>
      {isSelected && (
        <AppIcon name="checkmark" size={20} color="#e69c3a" />
      )}
    </Pressable>
  );
}

export default function AppearanceScreen() {
  const { settings, updateSetting } = useSettings();

  const themes: { value: Theme; label: string; description: string; sfSymbol: string }[] = [
    {
      value: 'system',
      label: 'System',
      description: 'Match device appearance',
      sfSymbol: 'gear',
    },
    {
      value: 'light',
      label: 'Light',
      description: 'Always use light mode',
      sfSymbol: 'sun.max.fill',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Always use dark mode',
      sfSymbol: 'moon.fill',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#120905' }}>
      <View
        style={{
          margin: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1f130c',
        }}
      >
        {themes.map((theme) => (
          <ThemeOption
            key={theme.value}
            label={theme.label}
            description={theme.description}
            sfSymbol={theme.sfSymbol}
            isSelected={settings.theme === theme.value}
            onSelect={() => updateSetting('theme', theme.value)}
          />
        ))}
      </View>
      <Text
        style={{
          marginHorizontal: 20,
          fontSize: 13,
          color: platformColor('secondaryLabel'),
          lineHeight: 18,
        }}
      >
        When set to System, the app will automatically switch between light and dark mode based on
        your device settings.
      </Text>
    </View>
  );
}
