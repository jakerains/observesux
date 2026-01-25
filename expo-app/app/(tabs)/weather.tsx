/**
 * Weather Screen - Full weather details with forecast
 */

import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import {
  useWeather,
  useWeatherForecast,
  useWeatherAlerts,
} from '@/lib/hooks/useDataFetching';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { LoadingSpinner, Skeleton } from '@/components/LoadingState';

export default function WeatherScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: weatherData, isLoading: weatherLoading } = useWeather();
  const { data: forecastData, isLoading: forecastLoading } = useWeatherForecast();
  const { data: alertsData } = useWeatherAlerts();

  const weather = weatherData?.data;
  const forecast = forecastData?.data || [];
  const alerts = alertsData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['weather'] });
    setTimeout(() => setRefreshing(false), 500);
  };

  if (weatherLoading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingSpinner message="Loading weather..." />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Active Alerts
            </ThemedText>
            {alerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: colors.warningBackground,
                    borderColor: colors.warning,
                  },
                ]}
                onPress={() => router.push(`/alert/${alert.id}`)}
              >
                <View style={styles.alertHeader}>
                  <Ionicons name="warning" size={20} color={colors.warning} />
                  <ThemedText weight="semibold" style={{ flex: 1, marginLeft: 8 }}>
                    {alert.event}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={colors.warning} />
                </View>
                <ThemedText variant="secondary" numberOfLines={2}>
                  {alert.headline}
                </ThemedText>
                <ThemedText variant="caption" style={{ marginTop: 4 }}>
                  Expires: {format(new Date(alert.expires), 'MMM d, h:mm a')}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Current Conditions */}
        {weather && (
          <View style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Current Conditions
            </ThemedText>
            <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.currentMain}>
                <ThemedText style={styles.bigTemp}>
                  {Math.round(weather.temperature)}°
                </ThemedText>
                <View style={styles.currentDetails}>
                  <ThemedText variant="secondary">{weather.conditions}</ThemedText>
                  <ThemedText variant="muted">
                    Feels like {Math.round(weather.feelsLike)}°
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={20} color={colors.accent} />
                  <ThemedText variant="caption">Humidity</ThemedText>
                  <ThemedText weight="semibold">{weather.humidity}%</ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="flag-outline" size={20} color={colors.accent} />
                  <ThemedText variant="caption">Wind</ThemedText>
                  <ThemedText weight="semibold">
                    {weather.windDirection} {Math.round(weather.windSpeed)} mph
                  </ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="eye-outline" size={20} color={colors.accent} />
                  <ThemedText variant="caption">Visibility</ThemedText>
                  <ThemedText weight="semibold">
                    {(weather.visibility / 1609.34).toFixed(1)} mi
                  </ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="speedometer-outline" size={20} color={colors.accent} />
                  <ThemedText variant="caption">Pressure</ThemedText>
                  <ThemedText weight="semibold">
                    {(weather.pressure / 100).toFixed(1)} mb
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Forecast */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
            7-Day Forecast
          </ThemedText>
          {forecastLoading ? (
            <View style={styles.forecastLoading}>
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} height={70} style={{ marginBottom: 8 }} />
              ))}
            </View>
          ) : (
            <View style={styles.forecastList}>
              {forecast.slice(0, 14).map((day, index) => (
                <View
                  key={`${day.name}-${index}`}
                  style={[
                    styles.forecastRow,
                    { borderColor: colors.separator },
                    index === forecast.slice(0, 14).length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.forecastDay}>
                    <ThemedText weight="medium">{day.name}</ThemedText>
                    <ThemedText variant="caption">
                      {format(new Date(day.date), 'MMM d')}
                    </ThemedText>
                  </View>
                  <View style={styles.forecastCondition}>
                    <Ionicons
                      name={day.isDaytime ? 'sunny-outline' : 'moon-outline'}
                      size={24}
                      color={colors.accent}
                    />
                    <ThemedText variant="secondary" numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
                      {day.shortForecast}
                    </ThemedText>
                  </View>
                  <View style={styles.forecastTemp}>
                    <ThemedText weight="bold" style={{ fontSize: 18 }}>
                      {day.temperature}°
                    </ThemedText>
                    {day.probabilityOfPrecipitation !== null && day.probabilityOfPrecipitation > 0 && (
                      <View style={styles.precipBadge}>
                        <Ionicons name="rainy-outline" size={12} color={colors.info} />
                        <ThemedText variant="caption" style={{ color: colors.info }}>
                          {day.probabilityOfPrecipitation}%
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bigTemp: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
  },
  currentDetails: {
    marginLeft: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
    alignItems: 'flex-start',
    gap: 4,
  },
  forecastLoading: {
    gap: 8,
  },
  forecastList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  forecastDay: {
    width: 80,
  },
  forecastCondition: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  forecastTemp: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  precipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
});
