/**
 * Sun & Daylight Widget
 * Shows daylight remaining countdown, sunrise/sunset times, day length, and current phase.
 */

import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { platformColor } from '@/lib/platformColors';
import Svg, {
  Path, Line, Circle, Text as SvgText,
  Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop,
} from 'react-native-svg';
import { useSunTimes, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { Skeleton } from '../LoadingState';
import { Brand } from '@/constants/BrandColors';

// Parse "H:MM:SS AM/PM" to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)/i);
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

// Strip seconds from time for compact labels
function shortTime(timeStr: string): string {
  return timeStr.replace(/:\d+\s/, ' ');
}

// SVG sun arc showing current sun position
function SunArc({ progress, isDaytime, sunrise, sunset }: {
  progress: number; isDaytime: boolean; sunrise: string; sunset: string;
}) {
  const width = 280;
  const startX = 40;
  const endX = width - 40;
  const centerX = width / 2;
  const rx = (endX - startX) / 2;  // 100
  const ry = 65;
  const topPad = 34;
  const baseline = ry + topPad;
  const svgHeight = baseline + 18;

  // Sun position on elliptical arc
  const angle = Math.PI * (1 - progress);
  const sunX = centerX + rx * Math.cos(angle);
  const sunY = baseline - ry * Math.sin(angle);

  const noonY = baseline - ry;

  // "NOW" label positioning
  const labelX = sunX + (progress > 0.85 ? -16 : progress < 0.15 ? 16 : 0);
  const labelY = sunY - 22;
  const labelAnchor = progress > 0.85 ? 'end' : progress < 0.15 ? 'start' : 'middle';

  return (
    <View style={{ alignItems: 'center', marginVertical: 4 }}>
      <Svg width="100%" height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`}>
        <Defs>
          <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
            <Stop offset="50%" stopColor="#fbbf24" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
          </RadialGradient>
          <SvgLinearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#f97316" />
            <Stop offset="100%" stopColor="#fbbf24" />
          </SvgLinearGradient>
          <SvgLinearGradient id="fillGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#fbbf24" stopOpacity={0.07} />
            <Stop offset="100%" stopColor="#fbbf24" stopOpacity={0.01} />
          </SvgLinearGradient>
        </Defs>

        {/* Full arc background (dashed) */}
        <Path
          d={`M ${startX} ${baseline} A ${rx} ${ry} 0 0 1 ${endX} ${baseline}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* Filled area under traveled arc */}
        {isDaytime && progress > 0.01 && (
          <Path
            d={`M ${startX} ${baseline} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY} L ${sunX} ${baseline} Z`}
            fill="url(#fillGrad)"
          />
        )}

        {/* Traveled arc (gradient) */}
        {isDaytime && progress > 0.01 && (
          <Path
            d={`M ${startX} ${baseline} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY}`}
            fill="none" stroke="url(#arcGrad)" strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}

        {/* Horizon line */}
        <Line
          x1={startX - 12} y1={baseline} x2={endX + 12} y2={baseline}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />

        {/* Noon tick */}
        <Line
          x1={centerX} y1={noonY - 4} x2={centerX} y2={noonY + 4}
          stroke="rgba(255,255,255,0.12)" strokeWidth={1}
        />

        {/* Horizon endpoint markers */}
        <Circle cx={startX} cy={baseline} r={2.5} fill="rgba(251,146,60,0.4)" />
        <Circle cx={endX} cy={baseline} r={2.5} fill="rgba(251,113,133,0.4)" />

        {/* Sun glow + dot + NOW label */}
        {isDaytime && (
          <>
            <Line
              x1={sunX} y1={sunY + 8} x2={sunX} y2={baseline}
              stroke="rgba(251,191,36,0.2)" strokeWidth={0.75}
              strokeDasharray="2 2"
            />
            <Circle cx={sunX} cy={sunY} r={18} fill="url(#sunGlow)" />
            <Circle cx={sunX} cy={sunY} r={6} fill="#fbbf24" />
            <Circle cx={sunX} cy={sunY} r={2.5} fill="#fde68a" />
            <SvgText
              x={labelX} y={labelY}
              fontSize={9} fill="#fbbf24" fontWeight="600"
              textAnchor={labelAnchor as 'start' | 'middle' | 'end'}
              letterSpacing={0.5}
            >
              NOW
            </SvgText>
          </>
        )}

        {/* Night indicator */}
        {!isDaytime && (
          <Circle
            cx={progress <= 0 ? startX : endX} cy={baseline}
            r={4} fill="rgba(129,140,248,0.4)"
          />
        )}

        {/* Sunrise label */}
        <SvgText
          x={startX} y={baseline + 14}
          fontSize={9.5} fill={Brand.muted} opacity={0.6}
          textAnchor="start"
        >
          {shortTime(sunrise)}
        </SvgText>

        {/* Sunset label */}
        <SvgText
          x={endX} y={baseline + 14}
          fontSize={9.5} fill={Brand.muted} opacity={0.6}
          textAnchor="end"
        >
          {shortTime(sunset)}
        </SvgText>
      </Svg>
    </View>
  );
}

function TimeRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Brand.separator,
    }}>
      <Text style={{ fontSize: 13, color }}>{label}</Text>
      <Text style={{ fontSize: 13, fontVariant: ['tabular-nums'], color: platformColor('label') }}>
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

  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
        <Text style={{ fontSize: 13, color: platformColor('secondaryLabel') }}>
          Unable to load sun data
        </Text>
      </DashboardCard>
    );
  }

  const dayParts = parseDayLength(sun.dayLength);
  const phase = getCurrentPhase(sun);
  const sunriseMin = parseTimeToMinutes(sun.sunrise);
  const sunsetMin = parseTimeToMinutes(sun.sunset);
  const now = new Date(nowTs);
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const nowSec = (now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds();
  const isDaytime = nowMin >= sunriseMin && nowMin <= sunsetMin;
  const progress = Math.max(0, Math.min(1, (nowMin - sunriseMin) / (sunsetMin - sunriseMin)));
  const countdown = {
    remaining: isDaytime ? Math.max(0, sunsetMin * 60 - nowSec) : 0,
    isDaytime,
    untilSunrise: nowMin < sunriseMin ? Math.max(0, sunriseMin * 60 - nowSec) : 0,
    progress,
  };

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
                  <Text style={{ fontSize: 11, color: platformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>
                    {cH === 1 ? 'hour' : 'hours'}
                  </Text>
                </>
              )}
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{cM}</Text>
              <Text style={{ fontSize: 11, color: platformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>min</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{cS}</Text>
              <Text style={{ fontSize: 11, color: platformColor('secondaryLabel'), marginLeft: 2 }}>sec</Text>
            </>
          ) : countdown.untilSunrise > 0 ? (
            <>
              {sH > 0 && (
                <>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{sH}</Text>
                  <Text style={{ fontSize: 11, color: platformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>
                    {sH === 1 ? 'hour' : 'hours'}
                  </Text>
                </>
              )}
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{sM}</Text>
              <Text style={{ fontSize: 11, color: platformColor('secondaryLabel'), marginLeft: 2, marginRight: 8 }}>min</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: accentColor }}>{sS}</Text>
              <Text style={{ fontSize: 11, color: platformColor('secondaryLabel'), marginLeft: 2 }}>sec</Text>
            </>
          ) : (
            <Text style={{ fontSize: 14, color: platformColor('secondaryLabel') }}>Sun has set</Text>
          )}
        </View>
        <Text style={{ fontSize: 11, color: platformColor('tertiaryLabel'), marginTop: 2 }}>
          {countdown.isDaytime ? 'of daylight remaining' : countdown.untilSunrise > 0 ? 'until sunrise' : ''}
        </Text>
      </View>

      {/* Sun Arc */}
      <SunArc
        progress={countdown.progress}
        isDaytime={countdown.isDaytime}
        sunrise={sun.sunrise}
        sunset={sun.sunset}
      />

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
          <Text style={{ fontSize: 11, color: platformColor('tertiaryLabel') }}>
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
        <Text style={{ fontSize: 13, fontVariant: ['tabular-nums'], color: platformColor('label') }}>
          {sun.lastLight}
        </Text>
      </View>
    </DashboardCard>
  );
}
