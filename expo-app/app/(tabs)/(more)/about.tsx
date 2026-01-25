/**
 * About Screen
 * App information, version, and links
 */

import { View, Text, Pressable, PlatformColor, Linking, Image } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoImage = require('../../../assets/logo.png');

interface LinkItemProps {
  sfSymbol: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  tintColor?: string;
}

function LinkItem({ sfSymbol, label, subtitle, onPress, tintColor }: LinkItemProps) {
  const iconColor = tintColor || PlatformColor('systemBlue');

  return (
    <Pressable
      onPress={() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: PlatformColor('separator'),
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: PlatformColor('tertiarySystemFill'),
        }}
      >
        <SymbolView name={sfSymbol as SymbolViewProps['name']} tintColor={iconColor} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: PlatformColor('label') }}>{label}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, marginTop: 2, color: PlatformColor('secondaryLabel') }}>
            {subtitle}
          </Text>
        )}
      </View>
      <SymbolView name="chevron.right" tintColor={PlatformColor('tertiaryLabel')} size={16} />
    </Pressable>
  );
}

export default function AboutScreen() {
  const version = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || '1';

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: PlatformColor('systemBackground') }}>
      {/* App Header */}
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            overflow: 'hidden',
          }}
        >
          <Image
            source={logoImage}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
            accessibilityLabel="Siouxland Online logo"
          />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '600', color: PlatformColor('label') }}>
          Siouxland Online
        </Text>
        <Text style={{ fontSize: 15, color: PlatformColor('secondaryLabel'), marginTop: 4 }}>
          Version {version} ({buildNumber})
        </Text>
      </View>

      {/* Description */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text
          style={{
            fontSize: 15,
            color: PlatformColor('secondaryLabel'),
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Real-time observability dashboard for Sioux City, Iowa. Get live weather, traffic,
          transit, and local news all in one place.
        </Text>
      </View>

      {/* Links */}
      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: PlatformColor('secondarySystemBackground'),
        }}
      >
        <LinkItem
          sfSymbol="globe"
          label="Website"
          subtitle="siouxland.online"
          onPress={() => openURL('https://siouxland.online')}
        />
        <LinkItem
          sfSymbol="envelope"
          label="Contact"
          subtitle="Send feedback"
          onPress={() => openURL('mailto:hello@siouxland.online')}
        />
        <LinkItem
          sfSymbol="doc.text"
          label="Privacy Policy"
          onPress={() => openURL('https://siouxland.online/privacy')}
        />
        <LinkItem
          sfSymbol="doc.text.fill"
          label="Terms of Service"
          onPress={() => openURL('https://siouxland.online/terms')}
        />
      </View>

      {/* Data Sources */}
      <Text
        style={{
          marginTop: 32,
          marginBottom: 8,
          marginLeft: 20,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
          color: PlatformColor('secondaryLabel'),
        }}
      >
        DATA SOURCES
      </Text>
      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: PlatformColor('secondarySystemBackground'),
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel'), lineHeight: 20 }}>
          Weather data from National Weather Service. Traffic cameras from Iowa DOT and KTIV. Transit
          data from Sioux City Transit. News from local news sources. Air quality from AirNow.
        </Text>
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Text style={{ fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
          Made with care in Sioux City
        </Text>
      </View>
    </View>
  );
}
