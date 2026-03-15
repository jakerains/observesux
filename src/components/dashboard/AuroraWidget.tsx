'use client'

import { useMemo } from 'react'
import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAurora } from '@/lib/hooks/useDataFetching'
import { Sparkles, Eye, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'

const VISIBILITY_CONFIG = {
  none: { label: 'Quiet', accent: 'gray' },
  unlikely: { label: 'Elevated', accent: 'blue' },
  possible: { label: 'Minor Storm', accent: 'purple' },
  likely: { label: 'Possible!', accent: 'green' },
  strong: { label: 'Look North!', accent: 'emerald' },
} as const

// ── Aurora Sky ───────────────────────────────────────────────────────

function AuroraSky({ kp, label }: { kp: number; label: string }) {
  // Intensity drives aurora visibility (0–1)
  const intensity = Math.min(kp / 7, 1)

  // Deterministic stars (seeded by index)
  const stars = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      x: (i * 37 + 13) % 97,
      y: (i * 23 + 7) % 80,
      size: i % 5 === 0 ? 2 : 1,
      delay: (i * 0.7) % 5,
      duration: 2 + (i % 4),
    }))
  , [])

  return (
    <>
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes aurora-breathe {
          0%, 100% { opacity: var(--ab-lo); transform: scaleY(0.92); }
          50% { opacity: var(--ab-hi); transform: scaleY(1.08); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.85; }
        }
        @keyframes horizon-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        className="relative rounded-lg overflow-hidden mb-3"
        style={{
          height: 140,
          background: 'linear-gradient(180deg, #04040c 0%, #080818 40%, #0c0c24 100%)',
        }}
      >
        {/* ── Stars ── */}
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animation: `star-twinkle ${s.duration}s ease-in-out infinite ${s.delay}s`,
            }}
          />
        ))}

        {/* ── Aurora curtain 1 — green ── */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(90deg,
              transparent 0%,
              rgba(34,197,94,${0.04 + intensity * 0.35}) 20%,
              rgba(16,185,129,${0.02 + intensity * 0.2}) 40%,
              rgba(52,211,153,${0.04 + intensity * 0.3}) 60%,
              rgba(34,197,94,${0.03 + intensity * 0.25}) 80%,
              transparent 100%)`,
            backgroundSize: '250% 100%',
            animation: 'aurora-drift 10s ease-in-out infinite',
            maskImage: 'linear-gradient(180deg, transparent 5%, white 25%, white 55%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 5%, white 25%, white 55%, transparent 85%)',
            '--ab-lo': `${0.3 + intensity * 0.3}`,
            '--ab-hi': `${0.6 + intensity * 0.4}`,
          } as React.CSSProperties}
        />

        {/* ── Aurora curtain 2 — purple/blue ── */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(90deg,
              transparent 0%,
              rgba(139,92,246,${intensity * 0.3}) 25%,
              rgba(99,102,241,${intensity * 0.15}) 50%,
              rgba(168,85,247,${intensity * 0.25}) 75%,
              transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: `aurora-drift 14s ease-in-out infinite 4s`,
            maskImage: 'linear-gradient(180deg, transparent 15%, white 35%, white 50%, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 15%, white 35%, white 50%, transparent 75%)',
          }}
        />

        {/* ── Aurora curtain 3 — teal accent (only visible at high Kp) ── */}
        {kp >= 4 && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(90deg,
                transparent 10%,
                rgba(45,212,191,${intensity * 0.2}) 35%,
                rgba(20,184,166,${intensity * 0.15}) 65%,
                transparent 90%)`,
              backgroundSize: '180% 100%',
              animation: 'aurora-drift 7s ease-in-out infinite 1.5s',
              maskImage: 'linear-gradient(180deg, transparent 0%, white 20%, white 45%, transparent 70%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, white 20%, white 45%, transparent 70%)',
            }}
          />
        )}

        {/* ── Horizon glow ── */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 32,
            background: `linear-gradient(180deg, transparent, rgba(34,197,94,${0.02 + intensity * 0.1}))`,
            animation: intensity > 0.3 ? 'horizon-glow 6s ease-in-out infinite' : 'none',
          }}
        />

        {/* ── Treeline silhouette ── */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 18,
            background: '#04040c',
            clipPath: 'polygon(0% 70%, 3% 45%, 5% 60%, 8% 35%, 11% 55%, 14% 30%, 17% 50%, 19% 25%, 22% 45%, 25% 55%, 28% 35%, 31% 50%, 33% 20%, 36% 40%, 39% 55%, 42% 30%, 45% 48%, 48% 28%, 50% 40%, 53% 55%, 56% 32%, 59% 48%, 62% 22%, 65% 42%, 68% 55%, 71% 35%, 74% 50%, 77% 28%, 80% 45%, 83% 55%, 86% 38%, 89% 50%, 92% 30%, 95% 48%, 97% 55%, 100% 40%, 100% 100%, 0% 100%)',
          }}
        />

        {/* ── Kp value overlay ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pb-2">
          <div
            className="text-3xl font-bold text-white/90 drop-shadow-lg"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Kp {kp}
          </div>
          <div className="text-xs text-white/50 mt-0.5 tracking-wide">
            {label}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Kp Gauge ─────────────────────────────────────────────────────────

function KpGauge({ kp }: { kp: number }) {
  const segments = Array.from({ length: 9 }, (_, i) => i + 1)

  return (
    <div className="flex gap-0.5">
      {segments.map(i => {
        const filled = i <= kp
        const color = i >= 7
          ? 'bg-emerald-400'
          : i >= 5
            ? 'bg-purple-500'
            : i >= 4
              ? 'bg-blue-500'
              : 'bg-gray-500'

        return (
          <div
            key={i}
            className={cn(
              'h-3 flex-1 rounded-sm transition-colors',
              filled ? color : 'bg-muted',
              filled && kp >= 5 && 'animate-pulse',
            )}
          />
        )
      })}
    </div>
  )
}

// ── Main Widget ──────────────────────────────────────────────────────

export function AuroraWidget() {
  const refreshInterval = 300000
  const { data: auroraData, error, isLoading, isValidating, mutate: refresh } = useAurora(refreshInterval)

  const aurora = auroraData?.data
  const lastUpdated = auroraData?.timestamp ? new Date(auroraData.timestamp) : undefined
  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })

  const refreshAction = (
    <RefreshAction onRefresh={() => refresh()} isLoading={isLoading} isValidating={isValidating} />
  )

  if (isLoading) {
    return (
      <DashboardCard title="Aurora Watch" icon={<Sparkles className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          <Skeleton className="h-[140px] w-full rounded-lg" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </DashboardCard>
    )
  }

  const visibility = aurora?.visibility ?? 'none'
  const config = VISIBILITY_CONFIG[visibility]

  return (
    <DashboardCard
      title="Aurora Watch"
      icon={<Sparkles className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Aurora Sky Visualization */}
      <AuroraSky kp={aurora?.kpIndex ?? 0} label={config.label} />

      {/* Kp Gauge */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Quiet</span>
          <span>Storm</span>
        </div>
        <KpGauge kp={aurora?.kpIndex ?? 0} />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1</span>
          <span>5 — visible at 42°N</span>
          <span>9</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mt-3">
        {aurora?.visibilityLabel ?? 'No data available'}
      </p>

      {/* Look North tip (only when aurora is visible) */}
      {aurora?.lookNorth && (
        <div className="mt-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
          <Compass className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300/90">
            Head outside after dark — look toward the northern horizon, away from city lights.
          </p>
        </div>
      )}
    </DashboardCard>
  )
}
