/**
 * Map Screen - Interactive map with cameras, buses, traffic
 */

import { useState, useRef, useMemo } from 'react';
import { View, Pressable, ScrollView, Text, PlatformColor, useColorScheme, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCameras, useTransit, useTrafficEvents, useGasPrices } from '@/lib/hooks/useDataFetching';

const SIOUX_CITY_CENTER: Region = {
  latitude: 42.4963,
  longitude: -96.4049,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

type LayerType = 'cameras' | 'buses' | 'traffic' | 'gas';

function LayerToggle({
  sfSymbol,
  label,
  active,
  onPress,
  count,
}: {
  sfSymbol: string;
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        backgroundColor: active ? '#e69c3a' : '#1f130c',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Image source={`sf:${sfSymbol}`} style={{ width: 18, height: 18 }} tintColor={active ? '#fff' : PlatformColor('label')} />
      <Text style={{ fontSize: 12, fontWeight: active ? '600' : '400', color: active ? '#fff' : PlatformColor('label') }}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            backgroundColor: active ? '#fff' : '#e69c3a',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#e69c3a' : '#fff' }}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set(['cameras', 'buses']));

  const { data: camerasData } = useCameras();
  const { data: transitData } = useTransit();
  const { data: trafficData } = useTrafficEvents();
  const { data: gasData } = useGasPrices();

  const cameras = Array.isArray(camerasData?.data) ? camerasData.data : [];

  // Transit API returns { buses: [...], routes: [...] } at top level — no data wrapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = transitData as any;
  const buses: {
    vehicleId: string; routeId: string; routeName: string; routeColor: string;
    latitude: number; longitude: number; heading: number; nextStop: string;
  }[] = Array.isArray(raw?.buses) ? raw.buses : [];

  const trafficEvents = Array.isArray(trafficData?.data) ? trafficData.data : [];

  // Gas API returns { data: { stations: [...], stats: {} } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGas = gasData?.data as any;
  const gasStations: {
    id: string|number; brandName?: string; name?: string; streetAddress?: string;
    address?: string; latitude: number; longitude: number;
    prices: { fuelType: string; price: number }[] | Record<string, number>;
  }[] = Array.isArray(rawGas) ? rawGas : Array.isArray(rawGas?.stations) ? rawGas.stations : [];

  const toggleLayer = (layer: LayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const resetMapView = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    mapRef.current?.animateToRegion(SIOUX_CITY_CENTER, 500);
  };

  const mapStyle = useMemo(() => {
    if (colorScheme === 'dark') {
      return [
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      ];
    }
    return [];
  }, [colorScheme]);

  return (
    <View style={{ flex: 1, backgroundColor: '#120905' }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={SIOUX_CITY_CENTER}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={mapStyle}
      >
        {activeLayers.has('cameras') &&
          cameras.map((camera) => (
            <Marker
              key={`camera-${camera.id}`}
              coordinate={{ latitude: camera.latitude, longitude: camera.longitude }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  backgroundColor: '#3b82f6',
                }}
              >
                <Image source="sf:video.fill" style={{ width: 14, height: 14 }} tintColor="#fff" />
              </View>
              <Callout
                tooltip
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push({
                    pathname: '/camera/[id]',
                    params: {
                      id: camera.id,
                      name: camera.name,
                      imageUrl: camera.snapshotUrl,
                      streamUrl: camera.streamUrl || '',
                    },
                  });
                }}
              >
                <View
                  style={{
                    width: 200,
                    borderRadius: 12,
                    borderCurve: 'continuous',
                    overflow: 'hidden',
                    backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Camera Preview Image */}
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: camera.snapshotUrl }}
                      style={{ width: 200, height: 120 }}
                      contentFit="cover"
                      transition={200}
                    />
                    {/* Video badge */}
                    {camera.streamUrl && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(59, 130, 246, 0.9)',
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                          borderRadius: 4,
                          gap: 4,
                        }}
                      >
                        <Image source="sf:video.fill" style={{ width: 10, height: 10 }} tintColor="#ffffff" />
                        <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '600' }}>VIDEO</Text>
                      </View>
                    )}
                  </View>
                  {/* Camera Info */}
                  <View style={{ padding: 10 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colorScheme === 'dark' ? '#ffffff' : '#000000',
                        marginBottom: 4,
                      }}
                    >
                      {camera.name}
                    </Text>
                    {camera.roadway && (
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 11,
                          color: colorScheme === 'dark' ? '#8e8e93' : '#6b7280',
                        }}
                      >
                        {camera.roadway}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#3b82f6',
                          fontWeight: '500',
                        }}
                      >
                        Tap for full view
                      </Text>
                      <Image source="sf:chevron.right" style={{ width: 10, height: 10, marginLeft: 2 }} tintColor="#3b82f6" />
                    </View>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}

        {activeLayers.has('buses') &&
          buses.map((bus) => (
            <Marker
              key={`bus-${bus.vehicleId}`}
              coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
              title={bus.routeName || `Route ${bus.routeId}`}
              description={bus.nextStop ? `Next: ${bus.nextStop}` : undefined}
              rotation={bus.heading}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  backgroundColor: bus.routeColor || '#22c55e',
                }}
              >
                <Image source="sf:bus.fill" style={{ width: 12, height: 12 }} tintColor="#fff" />
              </View>
            </Marker>
          ))}

        {activeLayers.has('gas') &&
          gasStations.map((station) => {
            // Normalise prices to [{label, price, color}]
            const rawPrices = station.prices;
            const fuelColors: Record<string, string> = {
              regular: '#22c55e',
              midgrade: '#3b82f6',
              mid: '#3b82f6',
              'mid-grade': '#3b82f6',
              premium: '#8b5cf6',
              diesel: '#f59e0b',
              e85: '#14b8a6',
            };
            const fuelLabels: Record<string, string> = {
              regular: 'Regular',
              midgrade: 'Mid',
              mid: 'Mid',
              'mid-grade': 'Mid',
              premium: 'Premium',
              diesel: 'Diesel',
              e85: 'E85',
            };
            const priceList: { label: string; price: number; color: string }[] = Array.isArray(rawPrices)
              ? (rawPrices as { fuelType: string; price: number }[]).map((p) => {
                  const key = p.fuelType?.toLowerCase().replace(/\s+/g, '') ?? '';
                  return {
                    label: fuelLabels[key] ?? p.fuelType,
                    price: p.price,
                    color: fuelColors[key] ?? '#9ca3af',
                  };
                })
              : Object.entries(rawPrices as Record<string, number>).map(([k, v]) => ({
                  label: fuelLabels[k.toLowerCase()] ?? k,
                  price: v,
                  color: fuelColors[k.toLowerCase()] ?? '#9ca3af',
                }));

            // Skip stations with no gasoline prices (diesel-only stations)
            const GAS_FUEL_TYPES = new Set(['regular', 'midgrade', 'mid', 'mid-grade', 'premium', 'e85']);
            const hasGas = priceList.some(({ label }) => GAS_FUEL_TYPES.has(label.toLowerCase()));
            if (!hasGas) return null;

            const stationName = (station as any).brandName || station.name || 'Gas Station';
            const address = (station as any).streetAddress || station.address || '';

            return (
              <Marker
                key={`gas-${station.id}`}
                coordinate={{ latitude: station.latitude, longitude: station.longitude }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    backgroundColor: '#f59e0b',
                  }}
                >
                  <Image source="sf:fuelpump.fill" style={{ width: 14, height: 14 }} tintColor="#fff" />
                </View>
                <Callout tooltip>
                  <View
                    style={{
                      width: 220,
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      overflow: 'hidden',
                      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Header */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 12,
                        paddingBottom: 10,
                        backgroundColor: colorScheme === 'dark' ? '#2c1a0e' : '#fff8f0',
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      }}
                    >
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f59e0b',
                        }}
                      >
                        <Image source="sf:fuelpump.fill" style={{ width: 15, height: 15 }} tintColor="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: colorScheme === 'dark' ? '#ffffff' : '#000000',
                          }}
                        >
                          {stationName}
                        </Text>
                        {!!address && (
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 11,
                              color: colorScheme === 'dark' ? '#8e8e93' : '#6b7280',
                              marginTop: 1,
                            }}
                          >
                            {address}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Price grid */}
                    <View style={{ padding: 10, gap: 6 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {priceList.map(({ label, price, color }) => (
                          <View
                            key={label}
                            style={{
                              flex: 1,
                              minWidth: 60,
                              alignItems: 'center',
                              paddingVertical: 8,
                              paddingHorizontal: 4,
                              borderRadius: 10,
                              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              borderWidth: 1,
                              borderColor: `${color}44`,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '600', color, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                              {label}
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colorScheme === 'dark' ? '#ffffff' : '#000000', lineHeight: 18 }}>
                              ${price.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}

        {activeLayers.has('traffic') &&
          trafficEvents.map((event) => (
            <Marker
              key={`traffic-${event.id}`}
              coordinate={{ latitude: event.latitude, longitude: event.longitude }}
              title={event.title}
              description={event.description}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  backgroundColor:
                    event.severity === 'critical' ? '#ef4444' : event.severity === 'major' ? '#f97316' : '#f59e0b',
                }}
              >
                <Image source="sf:exclamationmark.triangle.fill" style={{ width: 14, height: 14 }} tintColor="#fff" />
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Layer Controls */}
      <View style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, paddingHorizontal: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <LayerToggle
            sfSymbol="video.fill"
            label="Cameras"
            active={activeLayers.has('cameras')}
            onPress={() => toggleLayer('cameras')}
            count={cameras.length}
          />
          <LayerToggle
            sfSymbol="bus.fill"
            label="Buses"
            active={activeLayers.has('buses')}
            onPress={() => toggleLayer('buses')}
            count={buses.length}
          />
          <LayerToggle
            sfSymbol="exclamationmark.triangle.fill"
            label="Traffic"
            active={activeLayers.has('traffic')}
            onPress={() => toggleLayer('traffic')}
            count={trafficEvents.length}
          />
          <LayerToggle
            sfSymbol="fuelpump.fill"
            label="Gas"
            active={activeLayers.has('gas')}
            onPress={() => toggleLayer('gas')}
            count={gasStations.length}
          />
        </ScrollView>
      </View>

      {/* Map Controls */}
      <View style={{ position: 'absolute', right: 16, bottom: insets.bottom + 100 }}>
        <Pressable
          onPress={resetMapView}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f130c',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Image source="sf:location.fill" style={{ width: 22, height: 22 }} tintColor={'#e69c3a'} />
        </Pressable>
      </View>
    </View>
  );
}
