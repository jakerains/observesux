'use client'

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  time: string
  value: number
}

interface MiniTrendChartProps {
  data: DataPoint[]
  color?: string
  gradientId?: string
  unit?: string
  height?: number
  showTooltip?: boolean
}

export function MiniTrendChart({
  data,
  color = '#22c55e',
  gradientId = 'trendGradient',
  unit = '',
  height = 40,
  showTooltip = true
}: MiniTrendChartProps) {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        Collecting data...
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(d => ({
    time: d.time,
    value: d.value,
    formattedTime: format(new Date(d.time), 'h:mm a')
  }))

  return (
    <div style={{ width: '100%', height, minWidth: 50, minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={height}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '4px 8px'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: unknown) => {
                const num = typeof value === 'number' ? value : parseFloat(String(value))
                return [isNaN(num) ? '--' : `${num.toFixed(1)}${unit}`, '']
              }}
              labelFormatter={(label) => label}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Compact trend indicator with arrow
export function TrendIndicator({ data, unit = '' }: { data: DataPoint[], unit?: string }) {
  if (!data || data.length < 2) return null

  const first = data[0]?.value ?? 0
  const last = data[data.length - 1]?.value ?? 0
  const change = last - first
  const percentChange = first !== 0 ? ((change / first) * 100) : 0

  const isUp = change > 0
  const isFlat = Math.abs(percentChange) < 1

  return (
    <div className={`flex items-center gap-1 text-xs ${
      isFlat ? 'text-muted-foreground' : isUp ? 'text-green-500' : 'text-red-500'
    }`}>
      {isFlat ? (
        <span>→</span>
      ) : isUp ? (
        <span>↑</span>
      ) : (
        <span>↓</span>
      )}
      <span>{Math.abs(change).toFixed(1)}{unit}</span>
    </div>
  )
}
