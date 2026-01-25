/**
 * Units Settings Screen
 * Temperature (F/C) and Distance (mi/km) preferences
 */

import { View, Text, Pressable, PlatformColor } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useSettings, type Settings } from '../../../lib/contexts';

interface OptionProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function Option({ label, isSelected, onSelect }: OptionProps) {
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
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: PlatformColor('separator'),
      }}
    >
      <Text style={{ fontSize: 17, color: PlatformColor('label') }}>{label}</Text>
      {isSelected && (
        <SymbolView name="checkmark" tintColor={PlatformColor('systemBlue')} size={20} />
      )}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        color: PlatformColor('secondaryLabel'),
      }}
    >
      {title}
    </Text>
  );
}

export default function UnitsScreen() {
  const { settings, updateSetting } = useSettings();

  const temperatureUnits: { value: Settings['temperatureUnit']; label: string }[] = [
    { value: 'F', label: 'Fahrenheit (°F)' },
    { value: 'C', label: 'Celsius (°C)' },
  ];

  const distanceUnits: { value: Settings['distanceUnit']; label: string }[] = [
    { value: 'mi', label: 'Miles' },
    { value: 'km', label: 'Kilometers' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: PlatformColor('systemBackground'), padding: 16 }}>
      <SectionHeader title="TEMPERATURE" />
      <View
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: PlatformColor('secondarySystemBackground'),
        }}
      >
        {temperatureUnits.map((unit) => (
          <Option
            key={unit.value}
            label={unit.label}
            isSelected={settings.temperatureUnit === unit.value}
            onSelect={() => updateSetting('temperatureUnit', unit.value)}
          />
        ))}
      </View>

      <SectionHeader title="DISTANCE" />
      <View
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: PlatformColor('secondarySystemBackground'),
        }}
      >
        {distanceUnits.map((unit) => (
          <Option
            key={unit.value}
            label={unit.label}
            isSelected={settings.distanceUnit === unit.value}
            onSelect={() => updateSetting('distanceUnit', unit.value)}
          />
        ))}
      </View>

      <Text
        style={{
          marginTop: 16,
          marginHorizontal: 4,
          fontSize: 13,
          color: PlatformColor('secondaryLabel'),
          lineHeight: 18,
        }}
      >
        These settings affect how weather temperatures and distances are displayed throughout the
        app.
      </Text>
    </View>
  );
}
