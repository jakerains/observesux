/**
 * Map Screen - Interactive map with cameras, buses, traffic
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useColorScheme } from '@/lib/hooks/useColorScheme';
import { useCameras, useTransit, useTrafficEvents } from '@/lib/hooks/useDataFetching';
import { ThemedText } from '@/components/ThemedText';

// Sioux City center coordinates
const SIOUX_CITY_CENTER: Region = {
  latitude: 42.4963,
  longitude: -96.4049,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

type LayerType = 'cameras' | 'buses' | 'traffic';

interface LayerToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}

function LayerToggle({ icon, label, active, onPress, count }: LayerToggleProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.layerButton,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? colors.primaryForeground : colors.text}
      />
      <ThemedText
        variant="caption"
        weight={active ? 'semibold' : 'normal'}
        style={active ? { color: colors.primaryForeground } : undefined}
      >
        {label}
      </ThemedText>
      {count !== undefined && count > 0 && (
        <View
          style={[
            styles.countBadge,
            { backgroundColor: active ? colors.primaryForeground : colors.accent },
          ]}
        >
          <ThemedText
            variant="caption"
            style={{
              color: active ? colors.primary : colors.accentForeground,
              fontSize: 10,
            }}
          >
            {count}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(
    new Set(['cameras', 'buses'])
  );

  const { data: camerasData } = useCameras();
  const { data: transitData } = useTransit();
  const { data: trafficData } = useTrafficEvents();

  const cameras = camerasData?.data || [];
  const buses = transitData?.data || [];
  const trafficEvents = trafficData?.data || [];

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
    mapRef.current?.animateToRegion(SIOUX_CITY_CENTER, 500);
  };

  // Custom map style for dark mode
  const mapStyle = useMemo(() => {
    if (colorScheme === 'dark') {
      return [
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#304a7d' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }],
        },
      ];
    }
    return [];
  }, [colorScheme]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={SIOUX_CITY_CENTER}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={mapStyle}
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
              title={camera.name}
              description={camera.roadway}
            >
              <View style={[styles.markerContainer, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="videocam" size={14} color="#ffffff" />
              </View>
            </Marker>
          ))}

        {/* Bus Markers */}
        {activeLayers.has('buses') &&
          buses.map((bus) => (
            <Marker
              key={`bus-${bus.id}`}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              title={bus.routeName || `Route ${bus.routeId}`}
              description={bus.nextStop ? `Next: ${bus.nextStop}` : undefined}
              rotation={bus.heading}
            >
              <View
                style={[
                  styles.busMarker,
                  { backgroundColor: bus.routeColor || '#22c55e' },
                ]}
              >
                <Ionicons name="bus" size={12} color="#ffffff" />
              </View>
            </Marker>
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
              title={event.title}
              description={event.description}
            >
              <View
                style={[
                  styles.markerContainer,
                  {
                    backgroundColor:
                      event.severity === 'critical'
                        ? '#ef4444'
                        : event.severity === 'major'
                        ? '#f97316'
                        : '#f59e0b',
                  },
                ]}
              >
                <Ionicons name="warning" size={14} color="#ffffff" />
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Layer Controls */}
      <View style={[styles.layerControls, { top: insets.top + 12 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.layerButtons}>
            <LayerToggle
              icon="videocam"
              label="Cameras"
              active={activeLayers.has('cameras')}
              onPress={() => toggleLayer('cameras')}
              count={cameras.length}
            />
            <LayerToggle
              icon="bus"
              label="Buses"
              active={activeLayers.has('buses')}
              onPress={() => toggleLayer('buses')}
              count={buses.length}
            />
            <LayerToggle
              icon="warning"
              label="Traffic"
              active={activeLayers.has('traffic')}
              onPress={() => toggleLayer('traffic')}
              count={trafficEvents.length}
            />
          </View>
        </ScrollView>
      </View>

      {/* Map Controls */}
      <View style={[styles.mapControls, { bottom: insets.bottom + 100 }]}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={resetMapView}
        >
          <Ionicons name="locate" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  layerControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  layerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  busMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
