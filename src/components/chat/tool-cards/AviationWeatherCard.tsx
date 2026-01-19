import { Plane, Wind, Eye, Cloud, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { AviationWeather, ApiResponse, FlightCategory } from '@/types'

type AviationToolOutput = ApiResponse<AviationWeather> | { error: string }

const FLIGHT_CATEGORY_STYLES: Record<FlightCategory, { bg: string; text: string; label: string }> = {
  VFR: { bg: 'bg-green-500', text: 'text-white', label: 'VFR' },
  MVFR: { bg: 'bg-blue-500', text: 'text-white', label: 'MVFR' },
  IFR: { bg: 'bg-red-500', text: 'text-white', label: 'IFR' },
  LIFR: { bg: 'bg-purple-600', text: 'text-white', label: 'LIFR' },
}

const FLIGHT_CATEGORY_DESC: Record<FlightCategory, string> = {
  VFR: 'Visual Flight Rules - Good conditions',
  MVFR: 'Marginal VFR - Some restrictions',
  IFR: 'Instrument Flight Rules - Low ceiling/visibility',
  LIFR: 'Low IFR - Very low ceiling/visibility',
}

function formatWind(dir: number | null, speed: number | null, gust: number | null): string {
  if (speed === null) return 'Calm'
  if (dir === null) return `${speed}kt`

  const dirStr = dir === 0 ? 'VRB' : String(dir).padStart(3, '0')
  let windStr = `${dirStr}° at ${speed}kt`
  if (gust !== null && gust > speed) {
    windStr += ` G${gust}`
  }
  return windStr
}

function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9/5) + 32)
}

export function AviationWeatherCard({ data, error, state }: ToolCardProps<AviationToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string' && !('data' in data)) {
    return (
      <ToolCardWrapper
        title="Aviation Weather"
        icon={<Plane className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const aviationData = data as ApiResponse<AviationWeather>
  const weather = aviationData?.data

  if (!weather || !weather.metar) {
    return (
      <ToolCardWrapper
        title="Aviation Weather"
        icon={<Plane className="h-3.5 w-3.5" />}
        error="No aviation weather data available"
      />
    )
  }

  const { metar, taf, notams } = weather
  const catStyle = FLIGHT_CATEGORY_STYLES[metar.flightCategory]
  const catDesc = FLIGHT_CATEGORY_DESC[metar.flightCategory]

  // Determine status based on flight category
  const status = metar.flightCategory === 'LIFR' || metar.flightCategory === 'IFR'
    ? 'alert'
    : metar.flightCategory === 'MVFR'
    ? 'attention'
    : 'normal'

  return (
    <ToolCardWrapper
      title="KSUX Aviation Weather"
      icon={<Plane className="h-3.5 w-3.5" />}
      status={status}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Flight category header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-sm px-2 py-0.5', catStyle.bg, catStyle.text)}>
            {catStyle.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{catDesc}</span>
        </div>
      </div>

      {/* METAR conditions grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Wind */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Wind</div>
            <div className="text-sm font-medium">
              {formatWind(metar.windDirection, metar.windSpeed, metar.windGust)}
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Visibility</div>
            <div className="text-sm font-medium">
              {metar.visibility !== null ? `${metar.visibility} SM` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Ceiling */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Ceiling</div>
            <div className="text-sm font-medium">
              {metar.ceiling !== null ? `${metar.ceiling.toLocaleString()} ft` : 'Clear'}
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="h-4 w-4 text-muted-foreground flex items-center justify-center text-xs font-bold">
            °F
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Temp/Dew</div>
            <div className="text-sm font-medium">
              {metar.temperature !== null ? celsiusToFahrenheit(metar.temperature) : '--'}°/
              {metar.dewpoint !== null ? celsiusToFahrenheit(metar.dewpoint) : '--'}°
            </div>
          </div>
        </div>
      </div>

      {/* Altimeter */}
      <div className="text-xs text-muted-foreground mb-2">
        Altimeter: {metar.altimeter !== null ? `${metar.altimeter.toFixed(2)}"` : 'N/A'}
      </div>

      {/* Active NOTAMs indicator */}
      {notams && notams.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-600 font-medium">
            {notams.length} Active NOTAM{notams.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* TAF valid period */}
      {taf && (
        <div className="mt-2 text-xs text-muted-foreground">
          TAF valid through {new Date(taf.validTimeTo).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}
        </div>
      )}
    </ToolCardWrapper>
  )
}
