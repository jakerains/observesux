/**
 * Aurora Watch Widget
 * Animated aurora sky with twinkling stars, treeline silhouette,
 * Kp gauge, and visibility status.
 */

import { useMemo, useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { platformColor } from '@/lib/platformColors';
import Svg, {
  Rect, Circle, Defs,
  LinearGradient as SvgLinearGradient, Stop,
  Polygon,
} from 'react-native-svg';
import { useAurora, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { Skeleton } from '../LoadingState';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VISIBILITY_CONFIG = {
  none: { label: 'Quiet', color: '#6b7280' },
  unlikely: { label: 'Elevated', color: '#3b82f6' },
  possible: { label: 'Minor Storm', color: '#a855f7' },
  likely: { label: 'Possible!', color: '#22c55e' },
  strong: { label: 'Look North!', color: '#34d399' },
} as const;

// ── Twinkling star ───────────────────────────────────────────────────

function TwinklingStar({ cx, cy, r, delay, duration }: {
  cx: number; cy: number; r: number; delay: number; duration: number;
}) {
  const opacity = useMemo(() => new Animated.Value(0.15), []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: duration * 500, delay: delay * 1000, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: duration * 500, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, delay, duration]);

  return <AnimatedCircle cx={cx} cy={cy} r={r} fill="white" opacity={opacity} />;
}

// ── Aurora curtain (animated opacity) ────────────────────────────────

function AuroraCurtain({ y, height, color, opacityRange, duration, delay }: {
  y: number; height: number; color: string;
  opacityRange: [number, number]; duration: number; delay: number;
}) {
  const opacity = useMemo(() => new Animated.Value(opacityRange[0]), [opacityRange]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: opacityRange[1], duration, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: opacityRange[0], duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, opacityRange, duration, delay]);

  return (
    <AnimatedRect x={0} y={y} width={300} height={height} fill={color} opacity={opacity} />
  );
}

// ── Aurora Sky ───────────────────────────────────────────────────────

function AuroraSky({ kp, label }: { kp: number; label: string }) {
  const intensity = Math.min(kp / 7, 1);

  // Deterministic stars
  const stars = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      cx: (i * 37 + 13) % 97 * 3,     // 0–291
      cy: (i * 23 + 7) % 70 * 1.4 + 5, // 5–103
      r: i % 5 === 0 ? 1.5 : 0.8,
      delay: (i * 0.7) % 5,
      duration: 2 + (i % 4),
    }))
  , []);

  // Treeline points
  const treeline = '0,105 9,80 15,92 24,70 33,88 42,65 51,82 57,55 66,78 75,88 84,70 93,82 99,50 108,73 117,88 126,65 135,80 144,58 150,73 159,88 168,67 177,80 186,48 195,72 204,88 213,70 222,82 231,58 240,78 249,88 258,72 267,82 276,60 285,80 291,88 300,73 300,140 0,140';

  const svgHeight = 140;

  return (
    <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
      <Svg width="100%" height={svgHeight} viewBox={`0 0 300 ${svgHeight}`}>
        <Defs>
          {/* Sky gradient */}
          <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#04040c" />
            <Stop offset="40%" stopColor="#080818" />
            <Stop offset="100%" stopColor="#0c0c24" />
          </SvgLinearGradient>
          {/* Horizon glow */}
          <SvgLinearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#22c55e" stopOpacity={0} />
            <Stop offset="100%" stopColor="#22c55e" stopOpacity={0.02 + intensity * 0.1} />
          </SvgLinearGradient>
        </Defs>

        {/* Sky background */}
        <Rect x={0} y={0} width={300} height={svgHeight} fill="url(#sky)" />

        {/* Stars */}
        {stars.map((s, i) => (
          <TwinklingStar key={i} {...s} />
        ))}

        {/* Aurora curtain 1 — green */}
        <AuroraCurtain
          y={20} height={60}
          color={`rgba(34,197,94,${0.04 + intensity * 0.35})`}
          opacityRange={[0.3 + intensity * 0.2, 0.7 + intensity * 0.3]}
          duration={5000} delay={0}
        />

        {/* Aurora curtain 2 — purple */}
        <AuroraCurtain
          y={15} height={55}
          color={`rgba(139,92,246,${intensity * 0.3})`}
          opacityRange={[0.2, 0.6 + intensity * 0.3]}
          duration={7000} delay={2000}
        />

        {/* Aurora curtain 3 — teal (only at Kp 4+) */}
        {kp >= 4 && (
          <AuroraCurtain
            y={10} height={50}
            color={`rgba(45,212,191,${intensity * 0.25})`}
            opacityRange={[0.15, 0.5 + intensity * 0.3]}
            duration={4000} delay={1000}
          />
        )}

        {/* Horizon glow */}
        <Rect x={0} y={svgHeight - 32} width={300} height={32} fill="url(#horizonGlow)" />

        {/* Treeline silhouette */}
        <Polygon points={treeline} fill="#04040c" />
      </Svg>

      {/* Kp overlay — positioned on top of SVG */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center', paddingBottom: 12,
      }}>
        <Text style={{ fontSize: 30, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
          Kp {kp}
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, letterSpacing: 0.5 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// ── Kp Gauge ─────────────────────────────────────────────────────────

function KpGauge({ kp }: { kp: number }) {
  const segments = Array.from({ length: 9 }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {segments.map(i => {
        const filled = i <= kp;
        const color = i >= 7 ? '#34d399' : i >= 5 ? '#a855f7' : i >= 4 ? '#3b82f6' : '#6b7280';
        return (
          <View
            key={i}
            style={{
              flex: 1, height: 10, borderRadius: 2,
              backgroundColor: filled ? color : 'rgba(255,255,255,0.06)',
            }}
          />
        );
      })}
    </View>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────

export function AuroraWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useAurora();
  const aurora = data?.data;
  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.aurora, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="Aurora Watch" sfSymbol="moon.stars.fill" status="loading">
        <View style={{ gap: 8 }}>
          <Skeleton height={140} borderRadius={10} />
          <Skeleton height={10} />
          <Skeleton height={24} />
        </View>
      </DashboardCard>
    );
  }

  if (isError || !aurora) {
    return (
      <DashboardCard title="Aurora Watch" sfSymbol="moon.stars.fill" status="error" onRefresh={() => refetch()}>
        <Text style={{ fontSize: 13, color: platformColor('secondaryLabel') }}>
          Unable to load aurora data
        </Text>
      </DashboardCard>
    );
  }

  const config = VISIBILITY_CONFIG[aurora.visibility];

  return (
    <DashboardCard
      title="Aurora Watch"
      sfSymbol="moon.stars.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Aurora Sky Visualization */}
      <AuroraSky kp={aurora.kpIndex} label={config.label} />

      {/* Kp Gauge */}
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: platformColor('secondaryLabel') }}>Quiet</Text>
          <Text style={{ fontSize: 10, color: platformColor('secondaryLabel') }}>Storm</Text>
        </View>
        <KpGauge kp={aurora.kpIndex} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: platformColor('tertiaryLabel') }}>1</Text>
          <Text style={{ fontSize: 9, color: platformColor('tertiaryLabel') }}>5 — visible at 42°N</Text>
          <Text style={{ fontSize: 9, color: platformColor('tertiaryLabel') }}>9</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={{ fontSize: 12, color: platformColor('secondaryLabel'), marginTop: 10 }}>
        {aurora.visibilityLabel}
      </Text>

      {/* Look North tip */}
      {aurora.lookNorth && (
        <View style={{
          marginTop: 8, padding: 10, borderRadius: 8,
          backgroundColor: 'rgba(34,211,153,0.08)', borderWidth: 0.5, borderColor: 'rgba(34,211,153,0.2)',
        }}>
          <Text style={{ fontSize: 11, color: '#34d399', lineHeight: 16 }}>
            Head outside after dark — look toward the northern horizon, away from city lights.
          </Text>
        </View>
      )}
    </DashboardCard>
  );
}
