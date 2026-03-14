/**
 * Sun & Daylight Widget
 * Shows daylight remaining countdown, sunrise/sunset times, day length, and current phase.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, Text, PlatformColor } from 'react-native';
import { useSunTimes, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { Skeleton } from '../LoadingState';
import { Brand } from '@/constants/BrandColors';

// Parse "H:MM:SS AM/PM" to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[4].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Parse "HH:MM:SS" day length
function parseDayLength(dl: string): { hours: number; minutes: number; seconds: number } | null {
  const match = dl.match(/^(\d+):(\d+):(\d+)$/);
  if (!match) return null;
  return { hours: parseInt(match[1]), minutes: parseInt(match[2]), seconds: parseInt(match[3]) };
}

// Current phase of the day
function getCurrentPhase(sun: {
  dawn: string; sunrise: string; goldenHour: string;
  sunset: string; dusk: string; lastLight: string;
}): { label: string; color: string } {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dawn = parseTimeToMinutes(sun.dawn);
  const sunrise = parseTimeToMinutes(sun.sunrise);
  const goldenHour = parseTimeToMinutes(sun.goldenHour);
  const sunset = parseTimeToMinutes(sun.sunset);
  const dusk = parseTimeToMinutes(sun.dusk);
  const lastLight = parseTimeToMinutes(sun.lastLight);

  if (nowMin < dawn) return { label: 'Night', color: '#818cf8' };
  if (nowMin < sunrise) return { label: 'Dawn', color: '#a78bfa' };
  if (nowMin < goldenHour) return { label: 'Daytime', color: '#fbbf24' };
  if (nowMin < sunset) return { label: 'Golden Hour', color: '#f97316' };
  if (nowMin < dusk) return { label: 'Dusk', color: '#fb7185' };
  if (nowMin < lastLight) return { label: 'Twilight', color: '#c084fc' };
  return { label: 'Night', color: '#818cf8' };
}

function TimeRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Brand.separator,
    }}>
      <Text style={{ fontSize: 13, color }}>{label}</Text>
      <Text style={{ fontSize: 13, fontVariant: ['tabular-nums'], color: PlatformColor('label') }}>
        {value}
      </Text>
    </View>
  );
}

export function SunWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useSunTimes();
  const sun = data?.data;
  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.sun, isLoading, isError);

  // Live countdown
  const compute = useCallback(() => {
    if (!sun) return { remaining: 0, isDaytime: false, untilSunrise: 0 };
    const sunriseMin = parseTimeToMinutes(sun.sunrise);
    const sunsetMin = parseTimeToMinutes(sun.sunset);
    const now = new Date();
    const nowSec = (now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds();
    const daytime = nowSec / 60 >= sunriseMin && nowSec / 60 <= sunsetMin;
    return {
      remaining: daytime ? Math.max(0, sunsetMin * 60 - nowSec) : 0,
      isDaytime: daytime,
      untilSunrise: nowSec / 60 < sunriseMin ? Math.max(0, sunriseMin * 60 - nowSec) : 0,
    };
  }, [sun]);

  const [countdown, setCountdown] = useState(compute);

  useEffect(() => {
    setCountdown(compute());
    const id = setInterval(() => setCountdown(compute()), 1000);
    return () => clearInterval(id);
  }, [compute]);

  if (isLoading) {
    return (
      <DashboardCard title="Sun & Daylight" sfSymbol="sun.max.fill" status="loading">
        <View style={{ gap: 8 }}>
          <Skeleton height={48} borderRadius={8} />
          <Skeleton height={16} />
          <Skeleton height={16} />
          <Skeleton height={16} />
        </View>
      </DashboardCard>
    );
  }

  if (isError || !sun) {
    return (
      <DashboardCard title="Sun & Daylight" sfSymbol="sun.max.fill" status="error" onRefresh={() => refetch()}>
        <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel') }}>
          Unable to load sun data
        </Text>
      </DashboardCard>
    );
  }

  const dayParts = parseDayLength(sun.dayLength);
  const phase = getCurrentPhase(sun);

  // Countdown parts
  const cH = Math.floor(countdown.remaining / 3600);
  const cM = Math.floor((countdown.remaining % 3600) / 60);
  const cS = Math.floor(countdown.remaining % 60);
  const sH = Math.floor(countdown.untilSunrise / 3600);
  const sM = Math.floor((countdown.untilSunrise % 3600) / 60);
  const sS = Math.floor(countdown.untilSunrise % 60);

  const accentColor = countdown.isDaytime ? '#fbbf24' : '#818cf8';

  return (
    <DashboardCard
      title="Sun & Daylight"
      sfSymbol="sun.max.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Countdown hero */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          {countdown.isDaytime ? (
            <>
              {cH > 0 && (
                <>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{cH}</Text>
                  <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>
                    {cH === 1 ? 'hour' : 'hours'}
                  </Text>
                </>
              )}
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{cM}</Text>
              <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>min</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{cS}</Text>
              <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginLeft: 2 }}>sec</Text>
            </>
          ) : countdown.untilSunrise > 0 ? (
            <>
              {sH > 0 && (
                <>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{sH}</Text>
                  <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>
                    {sH === 1 ? 'hour' : 'hours'}
                  </Text>
                </>
              )}
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{sM}</Text>
              <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>min</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{sS}</Text>
              <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginLeft: 2 }}>sec</Text>
            </>
          ) : (
            <Text style={{ fontSize: 14, color: PlatformColor('secondaryLabel') }}>Sun has set</Text>
          )}
        </View>
        <Text style={{ fontSize: 11, color: PlatformColor('tertiaryLabel'), marginTop: 2 }}>
          {countdown.isDaytime ? 'of daylight remaining' : countdown.untilSunrise > 0 ? 'until sunrise' : ''}
        </Text>
      </View>

      {/* Phase badge */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
          borderWidth: 0.5, borderColor: `${phase.color}33`,
          backgroundColor: `${phase.color}15`,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: phase.color }}>
            {phase.label}
          </Text>
        </View>
      </View>

      {/* Total daylight */}
      {dayParts && (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: PlatformColor('tertiaryLabel') }}>
            {dayParts.hours} hr {dayParts.minutes} min {dayParts.seconds} sec of daylight today
          </Text>
        </View>
      )}

      {/* Time rows */}
      <TimeRow label="Sunrise" value={sun.sunrise} color="#fb923c" />
      <TimeRow label="Solar Noon" value={sun.solarNoon} color="#fbbf24" />
      <TimeRow label="Sunset" value={sun.sunset} color="#fb7185" />
      <TimeRow label="Golden Hour" value={sun.goldenHour} color="#facc15" />
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6,
      }}>
        <Text style={{ fontSize: 13, color: '#818cf8' }}>Last Light</Text>
        <Text style={{ fontSize: 13, fontVariant: ['tabular-nums'], color: PlatformColor('label') }}>
          {sun.lastLight}
        </Text>
      </View>
    </DashboardCard>
  );
}
