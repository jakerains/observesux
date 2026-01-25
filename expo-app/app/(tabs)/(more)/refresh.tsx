/**
 * Refresh Interval Settings Screen
 * Controls how frequently data refreshes
 */

import { View, Text, Pressable, PlatformColor } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useSettings, type Settings } from '../../../lib/contexts';

type RefreshMultiplier = Settings['refreshMultiplier'];

interface RefreshOptionProps {
  value: RefreshMultiplier;
  label: string;
  description: string;
  sfSymbol: string;
  isSelected: boolean;
  onSelect: () => void;
}

function RefreshOption({ label, description, sfSymbol, isSelected, onSelect }: RefreshOptionProps) {
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

export default function RefreshScreen() {
  const { settings, updateSetting } = useSettings();

  const options: {
    value: RefreshMultiplier;
    label: string;
    description: string;
    sfSymbol: string;
  }[] = [
    {
      value: 0.5,
      label: 'Fast',
      description: 'Refresh twice as often',
      sfSymbol: 'hare.fill',
    },
    {
      value: 1,
      label: 'Normal',
      description: 'Default refresh rate',
      sfSymbol: 'arrow.clockwise',
    },
    {
      value: 2,
      label: 'Battery Saver',
      description: 'Refresh half as often',
      sfSymbol: 'battery.100percent',
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
        {options.map((option) => (
          <RefreshOption
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            sfSymbol={option.sfSymbol}
            isSelected={settings.refreshMultiplier === option.value}
            onSelect={() => updateSetting('refreshMultiplier', option.value)}
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
        Faster refresh rates provide more up-to-date information but use more battery and data.
        Battery Saver mode is recommended when you want to conserve power.
      </Text>
    </View>
  );
}
