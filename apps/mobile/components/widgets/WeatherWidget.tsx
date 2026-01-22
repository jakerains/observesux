import { View, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useWeather, useWeatherAlerts, useWeatherForecast } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction, WeatherAlertItem } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS, Colors } from '@/constants';

function getWeatherIconName(conditions: string): keyof typeof Ionicons.glyphMap {
  const lower = conditions.toLowerCase();

  if (lower.includes('thunder') || lower.includes('lightning')) return 'thunderstorm';
  if (lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle')) return 'rainy';
  if (lower.includes('snow') || lower.includes('flurr')) return 'snow';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return 'cloud';
  if (lower.includes('overcast') || lower.includes('cloudy')) return 'cloudy';
  if (lower.includes('partly') || lower.includes('scattered')) return 'partly-sunny';
  if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) return 'sunny';

  return 'cloud';
}

export function WeatherWidget() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: weatherData, error, isLoading, refetch, isFetching } = useWeather();
  const { data: alertsData } = useWeatherAlerts();
  const { data: forecastData } = useWeatherForecast();

  const weather = weatherData?.data;
  const alerts = alertsData?.data || [];
  const forecast = forecastData?.data;

  const lastUpdated = weatherData?.timestamp ? new Date(weatherData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.weather });

  const refreshAction = (
    <RefreshAction
      onRefresh={() => refetch()}
      isLoading={isLoading}
      isValidating={isFetching}
    />
  );

  if (isLoading) {
    return (
      <DashboardCard
        title="Weather"
        icon={<Ionicons name="cloud" size={16} color={colors.textMuted} />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  const iconName = weather ? getWeatherIconName(weather.conditions) : 'cloud';

  // Get high/low from forecast
  const todayHigh = forecast?.forecast.periods.find(p => p.isDaytime)?.temperature;
  const todayLow = forecast?.forecast.periods.find(p => !p.isDaytime)?.temperature;

  return (
    <DashboardCard
      title="Weather"
      icon={<Ionicons name="cloud" size={16} color={colors.textMuted} />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={{ marginBottom: 16, gap: 8 }}>
          {alerts.slice(0, 2).map((alert) => (
            <WeatherAlertItem
              key={alert.id}
              event={alert.event}
              severity={alert.severity}
              headline={alert.headline}
            />
          ))}
        </View>
      )}

      {/* Current Conditions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name={iconName} size={48} color={colors.textMuted} />
          <View>
            <Text style={{ fontSize: 36, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] }}>
              {weather?.temperature !== null ? `${Math.round(weather?.temperature || 0)}°` : '--°'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>
              {weather?.conditions || 'Unknown'}
            </Text>
          </View>
        </View>
        {(todayHigh || todayLow) && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>
              H: {todayHigh || '--'}° / L: {todayLow || '--'}°
            </Text>
          </View>
        )}
      </View>

      {/* Weather Details */}
      <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="water" size={16} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.text }}>
            {weather?.humidity !== null ? `${weather?.humidity}%` : '--'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="flag" size={16} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.text }}>
            {weather?.windSpeed !== null ? `${weather?.windSpeed} mph` : '--'}
            {weather?.windDirection && ` ${weather.windDirection}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="thermometer" size={16} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.text }}>
            Feels {weather?.windChill !== null
              ? `${Math.round(weather?.windChill || 0)}°`
              : weather?.heatIndex !== null
              ? `${Math.round(weather?.heatIndex || 0)}°`
              : `${Math.round(weather?.temperature || 0)}°`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="eye" size={16} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.text }}>
            {weather?.visibility !== null ? `${weather?.visibility} mi` : '--'}
          </Text>
        </View>
      </View>

      {/* Wind Gust Warning */}
      {weather?.windGust && weather.windGust > 25 && (
        <View style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          borderCurve: 'continuous',
        }}>
          <Text style={{ fontSize: 14, color: colors.text }}>
            <Ionicons name="warning" size={14} color="#f59e0b" /> Wind gusts up to {weather.windGust} mph
          </Text>
        </View>
      )}

      {/* Hourly Preview */}
      {forecast?.hourly.periods && forecast.hourly.periods.length > 0 && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>Today's Forecast</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {forecast.hourly.periods.slice(0, 4).map((hour, idx) => (
              <View key={idx} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {format(new Date(hour.startTime), 'ha')}
                </Text>
                <Ionicons
                  name={getWeatherIconName(hour.shortForecast)}
                  size={20}
                  color={colors.textMuted}
                />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                  {hour.temperature}°
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </DashboardCard>
  );
}
