/**
 * Tab layout for Siouxland Online
 * Uses NativeTabs from expo-router for native iOS 26 tab bar
 */

import { NativeTabs } from 'expo-router/unstable-native-tabs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const suxIcon = require('../../assets/sux-icon.png');

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor="#170d08"
      iconColor={{ default: '#8b7e6d', selected: '#e69c3a' }}
    >
      <NativeTabs.Trigger name="(0-home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(map)">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(sux)">
        <NativeTabs.Trigger.Icon src={suxIcon} renderingMode="original" />
        <NativeTabs.Trigger.Label>SUX</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(cameras)">
        <NativeTabs.Trigger.Icon sf={{ default: 'video', selected: 'video.fill' }} />
        <NativeTabs.Trigger.Label>Cameras</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(more)">
        <NativeTabs.Trigger.Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} />
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* Weather tab — hidden from tab bar but still routable */}
      <NativeTabs.Trigger name="(weather)" hidden>
        <NativeTabs.Trigger.Icon sf={{ default: 'cloud.sun', selected: 'cloud.sun.fill' }} />
        <NativeTabs.Trigger.Label>Weather</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
