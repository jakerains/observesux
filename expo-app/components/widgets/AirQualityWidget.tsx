/**
 * Air Quality Widget - matches web AirQualityCard
 * Shows: AQI circle, category + emoji + description, EPA color scale bar,
 * primary pollutant row, and 24h AQI trend chart.
 */

import { View, Text, PlatformColor } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { useAirQuality, useAirQualityHistory, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { Skeleton } from '../LoadingState';

// EPA standard AQI colors (matches web app's getAQIColor)
const AQI_COLORS: Record<string, string> = {
  'Good': '#00e400',
  'Moderate': '#ffff00',
  'Unhealthy for Sensitive Groups': '#ff7e00',
  'Unhealthy': '#ff0000',
  'Very Unhealthy': '#8f3f97',
  'Hazardous': '#7e0023',
};

function getAQIColor(category: string): string {
  return AQI_COLORS[category] || '#00e400';
}

function getAQIEmoji(category: string): string {
  switch (category) {
    case 'Good': return '😊';
    case 'Moderate': return '🙂';
    case 'Unhealthy for Sensitive Groups': return '😐';
    case 'Unhealthy': return '😷';
    case 'Very Unhealthy': return '🤢';
    case 'Hazardous': return '☠️';
    default: return '❓';
  }
}

function getAQIDescription(category: string): string {
  switch (category) {
    case 'Good':
      return 'Air quality is satisfactory, and air pollution poses little or no risk.';
    case 'Moderate':
      return 'Air quality is acceptable. However, there may be a risk for some people.';
    case 'Unhealthy for Sensitive Groups':
      return 'Members of sensitive groups may experience health effects.';
    case 'Unhealthy':
      return 'Some members of the general public may experience health effects.';
    case 'Very Unhealthy':
      return 'Health alert: The risk of health effects is increased for everyone.';
    case 'Hazardous':
      return 'Health warning of emergency conditions: everyone is more likely to be affected.';
    default:
      return 'Air quality data unavailable.';
  }
}

// AQI scale segments matching the web's colored bar
const SCALE_SEGMENTS = [
  { color: '#00e400' },
  { color: '#ffff00' },
  { color: '#ff7e00' },
  { color: '#ff0000' },
  { color: '#8f3f97' },
  { color: '#7e0023' },
];

const SCALE_LABELS = ['0', '50', '100', '150', '200', '300+'];

/**
 * Colored AQI scale bar with position indicator (▲) underneath
 */
function AQIScaleBar({ aqiValue }: { aqiValue: number }) {
  const clampedPct = Math.min((aqiValue / 300) * 100, 100);

  return (
    <View style={{ marginTop: 12 }}>
      {/* Labels row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        {SCALE_LABELS.map(label => (
          <Text key={label} style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
            {label}
          </Text>
        ))}
      </View>

      {/* Colored bar */}
      <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
        {SCALE_SEGMENTS.map((seg, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: seg.color }} />
        ))}
      </View>

      {/* Position indicator */}
      <View style={{ position: 'relative', height: 10 }}>
        <Text
          style={{
            position: 'absolute',
            fontSize: 10,
            color: PlatformColor('label'),
            transform: [{ translateX: -4 }],
            left: `${clampedPct}%`,
          }}
        >
          ▲
        </Text>
      </View>
    </View>
  );
}

/**
 * Simple SVG area chart for the 24h AQI trend
 */
function MiniTrendChart({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;

  const W = 300; // logical width (viewBox)
  const H = 60;
  const pad = 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));

  const linePts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    `M0,${H} L${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} L${W},${H} Z`;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgLinearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </SvgLinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#aqiAreaGrad)" />
      <Path
        d={`M${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

/**
 * Trend indicator — shows arrow direction and delta value
 */
function TrendIndicator({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const delta = values[values.length - 1] - values[0];
  const arrow = delta > 0.5 ? '↑' : delta < -0.5 ? '↓' : '→';
  return (
    <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
      {arrow} {Math.abs(delta).toFixed(1)}
    </Text>
  );
}

export function AirQualityWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useAirQuality();
  const { data: historyData } = useAirQualityHistory();

  const aqi = data?.data;
  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.airQuality, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="Air Quality Index" sfSymbol="wind" status="loading">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={64} height={64} borderRadius={32} />
          <View style={{ marginLeft: 16 }}>
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
          </View>
        </View>
      </DashboardCard>
    );
  }

  if (isError || !aqi) {
    return (
      <DashboardCard
        title="Air Quality Index"
        sfSymbol="wind"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>
          Unable to load air quality data
        </Text>
      </DashboardCard>
    );
  }

  const color = getAQIColor(aqi.category);
  const trendValues = historyData?.airQuality?.map(p => p.aqi) ?? [];

  // For dark badges, use white text; light badges (yellow) use dark text
  const isLightColor = aqi.category === 'Moderate';
  const badgeTextColor = isLightColor ? '#000000' : '#ffffff';

  return (
    <DashboardCard
      title="Air Quality Index"
      sfSymbol="wind"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Main AQI Display */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Bordered circle — matches web's ring style */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            backgroundColor: `${color}20`,
            borderWidth: 3,
            borderColor: color,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', lineHeight: 26, color }}>
            {aqi.aqi}
          </Text>
        </View>

        {/* Category badge + emoji + description */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                backgroundColor: color,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: badgeTextColor }}>
                {aqi.category}
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>{getAQIEmoji(aqi.category)}</Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: PlatformColor('secondaryLabel'),
              marginTop: 6,
              lineHeight: 17,
            }}
          >
            {getAQIDescription(aqi.category)}
          </Text>
        </View>
      </View>

      {/* AQI Scale Bar */}
      <AQIScaleBar aqiValue={aqi.aqi} />

      {/* Divider */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: PlatformColor('separator'),
          marginTop: 12,
          paddingTop: 10,
        }}
      >
        {/* Primary Pollutant */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel') }}>
            Primary Pollutant
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: PlatformColor('label') }}>
            {aqi.primaryPollutant}
          </Text>
        </View>
      </View>

      {/* 24h AQI Trend */}
      {trendValues.length > 1 && (
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: PlatformColor('separator'),
            marginTop: 10,
            paddingTop: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>
              24h AQI Trend
            </Text>
            <TrendIndicator values={trendValues} />
          </View>
          <MiniTrendChart values={trendValues} color={color} />
        </View>
      )}
    </DashboardCard>
  );
}
