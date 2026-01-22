import { useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useCameras, useTransit, useTrafficEvents, useRivers } from '@/lib/hooks';
import { Colors, SIOUX_CITY_CENTER } from '@/constants';
import type { TrafficCamera, BusPosition, TrafficEvent, RiverGaugeReading } from '@observesux/shared/types';

type LayerType = 'cameras' | 'transit' | 'traffic' | 'rivers';

interface LayerConfig {
  id: LayerType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const LAYERS: LayerConfig[] = [
  { id: 'cameras', label: 'Cameras', icon: 'videocam', color: '#0ea5e9' },
  { id: 'transit', label: 'Transit', icon: 'bus', color: '#8b5cf6' },
  { id: 'traffic', label: 'Traffic', icon: 'warning', color: '#f59e0b' },
  { id: 'rivers', label: 'Rivers', icon: 'water', color: '#06b6d4' },
];

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const mapRef = useRef<MapView>(null);
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(
    new Set(['cameras', 'traffic'])
  );
  const [selectedMarker, setSelectedMarker] = useState<{
    type: LayerType;
    data: TrafficCamera | BusPosition | TrafficEvent | RiverGaugeReading;
  } | null>(null);

  // Data hooks
  const { data: camerasData } = useCameras();
  const { data: transitData } = useTransit();
  const { data: trafficData } = useTrafficEvents();
  const { data: riversData } = useRivers();

  const cameras = camerasData?.data || [];
  const buses = transitData?.buses || [];
  const trafficEvents = trafficData?.data || [];
  const rivers = riversData?.data || [];

  const toggleLayer = (layer: LayerType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const handleMarkerPress = (type: LayerType, data: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMarker({ type, data });
  };

  const closeDetails = () => {
    setSelectedMarker(null);
  };

  // Render marker details
  const renderMarkerDetails = () => {
    if (!selectedMarker) return null;

    const { type, data } = selectedMarker;

    return (
      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(200)}
        className="absolute bottom-4 left-4 right-4 bg-card rounded-2xl border border-border p-4"
      >
        <Pressable
          onPress={closeDetails}
          className="absolute right-3 top-3 p-1 rounded-full bg-muted"
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>

        {type === 'cameras' && (
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {(data as TrafficCamera).name}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {(data as TrafficCamera).roadway || 'Traffic Camera'}
            </Text>
            {(data as TrafficCamera).direction && (
              <Text className="text-xs text-muted-foreground">
                Direction: {(data as TrafficCamera).direction}
              </Text>
            )}
          </View>
        )}

        {type === 'transit' && (
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {(data as BusPosition).routeName}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Vehicle {(data as BusPosition).vehicleId}
            </Text>
            {(data as BusPosition).nextStop && (
              <Text className="text-xs text-muted-foreground">
                Next: {(data as BusPosition).nextStop}
              </Text>
            )}
          </View>
        )}

        {type === 'traffic' && (
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {(data as TrafficEvent).headline}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {(data as TrafficEvent).roadway}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View
                className={`px-2 py-0.5 rounded ${
                  (data as TrafficEvent).severity === 'critical' ? 'bg-red-600' :
                  (data as TrafficEvent).severity === 'major' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`}
              >
                <Text className="text-xs font-medium text-white">
                  {(data as TrafficEvent).severity.toUpperCase()}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                {(data as TrafficEvent).type}
              </Text>
            </View>
          </View>
        )}

        {type === 'rivers' && (
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {(data as RiverGaugeReading).siteName}
            </Text>
            <Text className="text-2xl font-bold text-foreground mt-1">
              {(data as RiverGaugeReading).gaugeHeight?.toFixed(1) || '--'} ft
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View
                className={`px-2 py-0.5 rounded ${
                  (data as RiverGaugeReading).floodStage === 'major' ? 'bg-red-600' :
                  (data as RiverGaugeReading).floodStage === 'moderate' ? 'bg-orange-500' :
                  (data as RiverGaugeReading).floodStage === 'minor' ? 'bg-yellow-500' :
                  (data as RiverGaugeReading).floodStage === 'action' ? 'bg-yellow-400' :
                  'bg-green-500'
                }`}
              >
                <Text className="text-xs font-medium text-white">
                  {(data as RiverGaugeReading).floodStage?.toUpperCase() || 'NORMAL'}
                </Text>
              </View>
              {(data as RiverGaugeReading).trend && (
                <Text className="text-xs text-muted-foreground">
                  {(data as RiverGaugeReading).trend === 'rising' ? '↑ Rising' :
                   (data as RiverGaugeReading).trend === 'falling' ? '↓ Falling' : '→ Steady'}
                </Text>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={SIOUX_CITY_CENTER}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        onPress={closeDetails}
      >
        {/* Camera Markers */}
        {activeLayers.has('cameras') &&
          cameras.map((camera) => (
            <Marker
              key={`camera-${camera.id}`}
              coordinate={{
                latitude: camera.latitude,
                longitude: camera.longitude,
              }}
              onPress={() => handleMarkerPress('cameras', camera)}
              pinColor="#0ea5e9"
            />
          ))}

        {/* Transit Markers */}
        {activeLayers.has('transit') &&
          buses.map((bus) => (
            <Marker
              key={`bus-${bus.vehicleId}`}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              onPress={() => handleMarkerPress('transit', bus)}
              pinColor="#8b5cf6"
            />
          ))}

        {/* Traffic Event Markers */}
        {activeLayers.has('traffic') &&
          trafficEvents.map((event) => (
            <Marker
              key={`traffic-${event.id}`}
              coordinate={{
                latitude: event.latitude,
                longitude: event.longitude,
              }}
              onPress={() => handleMarkerPress('traffic', event)}
              pinColor="#f59e0b"
            />
          ))}

        {/* River Gauge Markers */}
        {activeLayers.has('rivers') &&
          rivers.map((gauge) => (
            <Marker
              key={`river-${gauge.siteId}`}
              coordinate={{
                latitude: gauge.latitude,
                longitude: gauge.longitude,
              }}
              onPress={() => handleMarkerPress('rivers', gauge)}
              pinColor="#06b6d4"
            />
          ))}
      </MapView>

      {/* Layer Controls */}
      <SafeAreaView
        edges={['top']}
        className="absolute top-0 left-0 right-0"
      >
        <View className="mx-4 mt-2">
          <View className="bg-card/90 rounded-2xl border border-border p-2 flex-row gap-2">
            {LAYERS.map((layer) => {
              const isActive = activeLayers.has(layer.id);
              return (
                <Pressable
                  key={layer.id}
                  onPress={() => toggleLayer(layer.id)}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
                    isActive ? 'bg-primary/20' : 'bg-transparent'
                  }`}
                >
                  <Ionicons
                    name={layer.icon}
                    size={16}
                    color={isActive ? layer.color : colors.textMuted}
                  />
                  <Text
                    className={`text-xs font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {layer.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* My Location Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          mapRef.current?.animateToRegion(SIOUX_CITY_CENTER, 500);
        }}
        className="absolute bottom-28 right-4 h-12 w-12 bg-card rounded-full border border-border items-center justify-center shadow-lg"
      >
        <Ionicons name="locate" size={24} color={colors.tint} />
      </Pressable>

      {/* Marker Details Sheet */}
      {renderMarkerDetails()}
    </View>
  );
}
