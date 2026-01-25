/**
 * Appearance Settings Screen
 * Theme picker: Light, Dark, System
 */

import { View, Text, Pressable, PlatformColor } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
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
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onSelect();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: PlatformColor('separator'),
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: PlatformColor('tertiarySystemFill'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <SymbolView name={sfSymbol as SymbolViewProps['name']} tintColor={PlatformColor('systemBlue')} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, color: PlatformColor('label') }}>{label}</Text>
        <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel'), marginTop: 2 }}>
          {description}
        </Text>
      </View>
      {isSelected && (
        <SymbolView name="checkmark" tintColor={PlatformColor('systemBlue')} size={20} />
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
    <View style={{ flex: 1, backgroundColor: PlatformColor('systemBackground') }}>
      <View
        style={{
          margin: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: PlatformColor('secondarySystemBackground'),
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
          color: PlatformColor('secondaryLabel'),
          lineHeight: 18,
        }}
      >
        When set to System, the app will automatically switch between light and dark mode based on
        your device settings.
      </Text>
    </View>
  );
}
