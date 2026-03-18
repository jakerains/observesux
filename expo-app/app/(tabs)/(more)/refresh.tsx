/**
 * Refresh Interval Settings Screen
 * Controls how frequently data refreshes
 */

import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
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
    <View style={{ flex: 1, backgroundColor: '#120905' }}>
      <View
        style={{
          margin: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1f130c',
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
          color: platformColor('secondaryLabel'),
          lineHeight: 18,
        }}
      >
        Faster refresh rates provide more up-to-date information but use more battery and data.
        Battery Saver mode is recommended when you want to conserve power.
      </Text>
    </View>
  );
}
