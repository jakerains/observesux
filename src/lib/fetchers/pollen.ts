/**
 * Open-Meteo Air Quality API — Pollen & UV data for Sioux City
 * Free, no API key required
 */

const SIOUX_CITY_LAT = 42.4969
const SIOUX_CITY_LON = -96.4003

export interface PollenReading {
  grass: number | null
  ragweed: number | null
  birch: number | null
  alder: number | null
}

export interface PollenData {
  current: PollenReading
  uvIndex: number | null
  peakToday: PollenReading
  dominantType: string | null
  overallLevel: 'none' | 'low' | 'moderate' | 'high' | 'very_high'
}

// Thresholds based on Open-Meteo pollen grains/m³ scale
function getPollenLevel(value: number | null): 'none' | 'low' | 'moderate' | 'high' | 'very_high' {
  if (value === null || value === 0) return 'none'
  if (value < 20) return 'low'
  if (value < 50) return 'moderate'
  if (value < 100) return 'high'
  return 'very_high'
}

function getOverallLevel(reading: PollenReading): PollenData['overallLevel'] {
  const values = [reading.grass, reading.ragweed, reading.birch, reading.alder]
  const maxVal = Math.max(...values.map(v => v ?? 0))
  return getPollenLevel(maxVal)
}

function getDominantType(reading: PollenReading): string | null {
  const types: { name: string; value: number | null }[] = [
    { name: 'Grass', value: reading.grass },
    { name: 'Ragweed', value: reading.ragweed },
    { name: 'Birch', value: reading.birch },
    { name: 'Alder', value: reading.alder },
  ]
  const nonNull = types.filter(t => t.value !== null && t.value > 0)
  if (nonNull.length === 0) return null
  nonNull.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  return nonNull[0].name
}

export async function fetchPollenData(): Promise<PollenData> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${SIOUX_CITY_LAT}&longitude=${SIOUX_CITY_LON}&current=us_aqi,uv_index&hourly=grass_pollen,ragweed_pollen,birch_pollen,alder_pollen&timezone=America/Chicago&forecast_days=1`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data = await response.json()

  // Get current hour index in Central Time
  const now = new Date()
  const centralHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false })
  )
  const hourIndex = Math.min(centralHour, (data.hourly?.time?.length ?? 1) - 1)

  const current: PollenReading = {
    grass: data.hourly?.grass_pollen?.[hourIndex] ?? null,
    ragweed: data.hourly?.ragweed_pollen?.[hourIndex] ?? null,
    birch: data.hourly?.birch_pollen?.[hourIndex] ?? null,
    alder: data.hourly?.alder_pollen?.[hourIndex] ?? null,
  }

  // Calculate today's peak values
  const peakToday: PollenReading = {
    grass: data.hourly?.grass_pollen ? Math.max(...data.hourly.grass_pollen.filter((v: number | null) => v !== null)) : null,
    ragweed: data.hourly?.ragweed_pollen ? Math.max(...data.hourly.ragweed_pollen.filter((v: number | null) => v !== null)) : null,
    birch: data.hourly?.birch_pollen ? Math.max(...data.hourly.birch_pollen.filter((v: number | null) => v !== null)) : null,
    alder: data.hourly?.alder_pollen ? Math.max(...data.hourly.alder_pollen.filter((v: number | null) => v !== null)) : null,
  }

  // Use current values for overall level so it stays consistent with the bars.
  // Only fall back to peakToday when all current values are null (API has no hourly data at all).
  const hasAnyCurrent = [current.grass, current.ragweed, current.birch, current.alder].some(v => v !== null)
  const levelSource = hasAnyCurrent ? current : peakToday

  return {
    current,
    uvIndex: data.current?.uv_index ?? null,
    peakToday,
    dominantType: getDominantType(levelSource),
    overallLevel: getOverallLevel(levelSource),
  }
}
