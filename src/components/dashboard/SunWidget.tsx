'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useSunTimes } from '@/lib/hooks/useDataFetching'
import { Sunrise, Sunset, Clock, Sun, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import { useEffect, useState } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────

function parseDayLength(dl: string): { hours: number; minutes: number; seconds: number } | null {
  const match = dl.match(/^(\d+):(\d+):(\d+)$/)
  if (!match) return null
  return { hours: parseInt(match[1]), minutes: parseInt(match[2]), seconds: parseInt(match[3]) }
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)/i)
  if (!match) return 0
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[4].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

function shortTime(timeStr: string): string {
  return timeStr.replace(/:\d+\s/, ' ')
}

// ── Phase detection ──────────────────────────────────────────────────

function getCurrentPhase(sun: {
  dawn: string; sunrise: string; goldenHour: string
  sunset: string; dusk: string; lastLight: string
}): { label: string; color: string; icon: 'sparkles' | 'sun' | 'sunset' | 'moon' } {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const dawn = parseTimeToMinutes(sun.dawn)
  const sunrise = parseTimeToMinutes(sun.sunrise)
  const goldenHour = parseTimeToMinutes(sun.goldenHour)
  const sunset = parseTimeToMinutes(sun.sunset)
  const dusk = parseTimeToMinutes(sun.dusk)
  const lastLight = parseTimeToMinutes(sun.lastLight)

  if (nowMin < dawn) return { label: 'Night', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'moon' }
  if (nowMin < sunrise) return { label: 'Dawn', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: 'sparkles' }
  if (nowMin < goldenHour) return { label: 'Daytime', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'sun' }
  if (nowMin < sunset) return { label: 'Golden Hour', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: 'sunset' }
  if (nowMin < dusk) return { label: 'Dusk', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: 'sunset' }
  if (nowMin < lastLight) return { label: 'Twilight', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'sparkles' }
  return { label: 'Night', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'moon' }
}

// ── Shared time state ────────────────────────────────────────────────

interface SunTimeState {
  progress: number      // 0–1 through the daylight period
  isDaytime: boolean
  remainingSec: number  // seconds of daylight left (0 if night)
  untilSunriseSec: number  // seconds until next sunrise (0 if daytime)
}

function useSunPosition(sunrise: string, sunset: string): SunTimeState {
  const [nowTs, setNowTs] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1_000) // tick every second
    return () => clearInterval(id)
  }, [])

  const sunriseMin = parseTimeToMinutes(sunrise)
  const sunsetMin = parseTimeToMinutes(sunset)
  const now = new Date(nowTs)
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const nowSec = nowMin * 60
  const p = (nowMin - sunriseMin) / (sunsetMin - sunriseMin)
  const daytime = nowMin >= sunriseMin && nowMin <= sunsetMin

  return {
    progress: Math.max(0, Math.min(1, p)),
    isDaytime: daytime,
    remainingSec: daytime ? Math.max(0, sunsetMin * 60 - nowSec) : 0,
    untilSunriseSec: nowMin < sunriseMin ? Math.max(0, sunriseMin * 60 - nowSec) : 0,
  }
}

// ── Sun Arc SVG ──────────────────────────────────────────────────────

function SunArc({ progress, isDaytime, sunrise, sunset }: {
  progress: number; isDaytime: boolean; sunrise: string; sunset: string
}) {
  // Layout: generous margins so the arc + glow + labels never clip.
  const width = 280
  const startX = 40
  const endX = width - 40
  const centerX = width / 2
  const rx = (endX - startX) / 2  // 100
  const ry = 65
  const topPad = 34              // room for NOW label + glow above apex
  const baseline = ry + topPad
  const svgHeight = baseline + 18 // room for time labels below horizon

  // Sun position on elliptical arc
  const angle = Math.PI * (1 - progress)
  const sunX = centerX + rx * Math.cos(angle)
  const sunY = baseline - ry * Math.sin(angle)

  const noonY = baseline - ry

  // "Now" label offset — keep it above the sun dot
  const labelX = sunX + (progress > 0.85 ? -16 : progress < 0.15 ? 16 : 0)
  const labelY = sunY - 22
  const labelAnchor = progress > 0.85 ? 'end' : progress < 0.15 ? 'start' : 'middle'

  return (
    <div className="my-1 mx-auto w-full max-w-[320px]">
      <svg viewBox={`0 0 ${width} ${svgHeight}`} className="w-full" aria-hidden="true">
        <defs>
          <radialGradient id="sun-glow-grad">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="fill-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Full arc background (dashed) */}
        <path
          d={`M ${startX} ${baseline} A ${rx} ${ry} 0 0 1 ${endX} ${baseline}`}
          fill="none" stroke="currentColor" strokeWidth="1.5"
          className="text-muted-foreground/12" strokeDasharray="4 4"
        />

        {/* Filled area under traveled arc */}
        {isDaytime && progress > 0.01 && (
          <path
            d={`M ${startX} ${baseline} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY} L ${sunX} ${baseline} Z`}
            fill="url(#fill-grad)"
          />
        )}

        {/* Traveled arc (gradient) */}
        {isDaytime && progress > 0.01 && (
          <path
            d={`M ${startX} ${baseline} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY}`}
            fill="none" stroke="url(#arc-grad)" strokeWidth="2.5" strokeLinecap="round"
          />
        )}

        {/* Horizon line */}
        <line
          x1={startX - 12} y1={baseline} x2={endX + 12} y2={baseline}
          stroke="currentColor" strokeWidth="1" className="text-border/60"
        />

        {/* Noon tick at apex */}
        <line
          x1={centerX} y1={noonY - 4} x2={centerX} y2={noonY + 4}
          stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20"
        />

        {/* Horizon endpoint markers */}
        <circle cx={startX} cy={baseline} r="2.5" className="fill-orange-400/40" />
        <circle cx={endX} cy={baseline} r="2.5" className="fill-rose-400/40" />

        {/* Sun glow + dot + "Now" label (daytime) */}
        {isDaytime && (
          <>
            {/* Dashed drop line from sun to horizon */}
            <line
              x1={sunX} y1={sunY + 8} x2={sunX} y2={baseline}
              stroke="currentColor" strokeWidth="0.75"
              className="text-amber-400/25" strokeDasharray="2 2"
            />
            <circle cx={sunX} cy={sunY} r="18" fill="url(#sun-glow-grad)" />
            <circle cx={sunX} cy={sunY} r="6" className="fill-amber-400" />
            <circle cx={sunX} cy={sunY} r="2.5" className="fill-amber-200" />
            {/* "Now" label */}
            <text
              x={labelX} y={labelY}
              style={{ fontSize: '9px', fill: '#fbbf24', fontWeight: 600, letterSpacing: '0.04em' }}
              textAnchor={labelAnchor}
            >
              NOW
            </text>
          </>
        )}

        {/* Night indicator */}
        {!isDaytime && (
          <circle
            cx={progress <= 0 ? startX : endX} cy={baseline}
            r="4" className="fill-indigo-400/40"
          />
        )}

        {/* Sunrise label */}
        <text x={startX} y={baseline + 14}
          style={{ fontSize: '9.5px', fill: 'var(--color-muted-foreground)', opacity: 0.5 }}
          textAnchor="start"
        >{shortTime(sunrise)}</text>

        {/* Sunset label */}
        <text x={endX} y={baseline + 14}
          style={{ fontSize: '9.5px', fill: 'var(--color-muted-foreground)', opacity: 0.5 }}
          textAnchor="end"
        >{shortTime(sunset)}</text>
      </svg>
    </div>
  )
}

// ── Time Row ─────────────────────────────────────────────────────────

function TimeRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-mono tabular-nums">{value}</span>
    </div>
  )
}

// ── Main Widget ──────────────────────────────────────────────────────

export function SunWidget() {
  const refreshInterval = 3600000
  const { data: sunData, error, isLoading, isValidating, mutate: refresh } = useSunTimes(refreshInterval)

  const sun = sunData?.data
  const lastUpdated = sunData?.timestamp ? new Date(sunData.timestamp) : undefined
  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })

  const refreshAction = (
    <RefreshAction onRefresh={() => refresh()} isLoading={isLoading} isValidating={isValidating} />
  )

  // Live sun position + countdown (ticks every 30s)
  const sunPos = useSunPosition(sun?.sunrise ?? '7:00:00 AM', sun?.sunset ?? '7:00:00 PM')

  if (isLoading) {
    return (
      <DashboardCard title="Sun & Daylight" icon={<Sun className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  const dayParts = sun?.dayLength ? parseDayLength(sun.dayLength) : null
  const phase = sun ? getCurrentPhase(sun) : null

  return (
    <DashboardCard
      title="Sun & Daylight"
      icon={<Sun className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Remaining daylight hero (or sunrise countdown at night) */}
      {sun && (
        <div className="text-center mb-1">
          {sunPos.isDaytime ? (() => {
            const h = Math.floor(sunPos.remainingSec / 3600)
            const m = Math.floor((sunPos.remainingSec % 3600) / 60)
            const s = Math.floor(sunPos.remainingSec % 60)
            return (
              <>
                <div className="leading-relaxed tracking-tight">
                  {h > 0 && (
                    <>
                      <span className="text-xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-serif)' }}>{h}</span>
                      <span className="text-[11px] text-muted-foreground ml-0.5 mr-2">{h === 1 ? 'hour' : 'hours'}</span>
                    </>
                  )}
                  <span className="text-xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-serif)' }}>{m}</span>
                  <span className="text-[11px] text-muted-foreground ml-0.5 mr-2">minutes</span>
                  <span className="text-xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-serif)' }}>{s}</span>
                  <span className="text-[11px] text-muted-foreground ml-0.5">seconds</span>
                </div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5">of daylight remaining</div>
              </>
            )
          })() : sunPos.untilSunriseSec > 0 ? (() => {
            const h = Math.floor(sunPos.untilSunriseSec / 3600)
            const m = Math.floor((sunPos.untilSunriseSec % 3600) / 60)
            const s = Math.floor(sunPos.untilSunriseSec % 60)
            return (
              <>
                <div className="leading-relaxed tracking-tight">
                  {h > 0 && (
                    <>
                      <span className="text-xl font-bold text-indigo-400" style={{ fontFamily: 'var(--font-serif)' }}>{h}</span>
                      <span className="text-[11px] text-muted-foreground ml-0.5 mr-2">{h === 1 ? 'hour' : 'hours'}</span>
                    </>
                  )}
                  <span className="text-xl font-bold text-indigo-400" style={{ fontFamily: 'var(--font-serif)' }}>{m}</span>
                  <span className="text-[11px] text-muted-foreground ml-0.5 mr-2">minutes</span>
                  <span className="text-xl font-bold text-indigo-400" style={{ fontFamily: 'var(--font-serif)' }}>{s}</span>
                  <span className="text-[11px] text-muted-foreground ml-0.5">seconds</span>
                </div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5">until sunrise</div>
              </>
            )
          })() : (
            <div className="text-[11px] text-muted-foreground/50">Sun has set</div>
          )}
        </div>
      )}

      {/* Sun Arc */}
      {sun && (
        <SunArc
          progress={sunPos.progress}
          isDaytime={sunPos.isDaytime}
          sunrise={sun.sunrise}
          sunset={sun.sunset}
        />
      )}

      {/* Phase + Remaining Daylight */}
      <div className="flex flex-col items-center gap-1.5 mb-3">
        {phase && (
          <Badge variant="outline" className={cn('gap-1 text-xs', phase.color)}>
            {phase.icon === 'sun' && <Sun className="h-3 w-3" />}
            {phase.icon === 'sunset' && <Sunset className="h-3 w-3" />}
            {phase.icon === 'sparkles' && <Sparkles className="h-3 w-3" />}
            {phase.icon === 'moon' && <Clock className="h-3 w-3" />}
            {phase.label}
          </Badge>
        )}

        {/* Total daylight */}
        {dayParts && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Sun className="h-3 w-3" />
            <span>{dayParts.hours} hr {dayParts.minutes} min {dayParts.seconds} sec of daylight today</span>
          </div>
        )}
      </div>

      {/* Times */}
      <div className="divide-y divide-border">
        <TimeRow
          icon={<Sunrise className="h-4 w-4 text-orange-400" />}
          label="Sunrise"
          value={sun?.sunrise ?? '—'}
        />
        <TimeRow
          icon={<Sun className="h-4 w-4 text-amber-400" />}
          label="Solar Noon"
          value={sun?.solarNoon ?? '—'}
        />
        <TimeRow
          icon={<Sunset className="h-4 w-4 text-rose-400" />}
          label="Sunset"
          value={sun?.sunset ?? '—'}
        />
        <TimeRow
          icon={<Sun className="h-4 w-4 text-yellow-300" />}
          label="Golden Hour"
          value={sun?.goldenHour ?? '—'}
        />
        <TimeRow
          icon={<Clock className="h-4 w-4 text-indigo-400" />}
          label="Last Light"
          value={sun?.lastLight ?? '—'}
        />
      </div>
    </DashboardCard>
  )
}
