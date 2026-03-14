/**
 * NOAA Space Weather Prediction Center — Kp Index for aurora visibility
 * Free, no API key required
 */

export interface AuroraData {
  kpIndex: number
  estimatedKp: number
  timestamp: string
  visibility: 'none' | 'unlikely' | 'possible' | 'likely' | 'strong'
  visibilityLabel: string
  lookNorth: boolean
}

// At Sioux City's latitude (~42.5°N), aurora becomes visible around Kp 5+
// Kp 6+ gives good viewing, Kp 7+ is a strong storm
function getVisibility(kp: number): { visibility: AuroraData['visibility']; label: string; lookNorth: boolean } {
  if (kp >= 7) return { visibility: 'strong', label: 'Strong geomagnetic storm — aurora likely visible!', lookNorth: true }
  if (kp >= 6) return { visibility: 'likely', label: 'Aurora possible on the northern horizon', lookNorth: true }
  if (kp >= 5) return { visibility: 'possible', label: 'Minor storm — aurora may be faintly visible', lookNorth: true }
  if (kp >= 4) return { visibility: 'unlikely', label: 'Elevated activity — too far south for Sioux City', lookNorth: false }
  return { visibility: 'none', label: 'Quiet conditions — no aurora expected', lookNorth: false }
}

export async function fetchAuroraData(): Promise<AuroraData> {
  // NOAA SWPC requires User-Agent and may return compressed responses
  const response = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', {
    headers: {
      'User-Agent': 'SiouxlandOnline/1.0 (https://siouxland.online)',
      'Accept': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`NOAA SWPC API error: ${response.status}`)
  }

  // Read as text first to handle potential empty/truncated responses
  const text = await response.text()
  if (!text || text.length < 10) {
    throw new Error('NOAA SWPC returned empty response')
  }

  const data: Array<{
    time_tag: string
    kp_index: number
    estimated_kp: number
    kp: string
  }> = JSON.parse(text)

  if (!data || data.length === 0) {
    throw new Error('No Kp index data available')
  }

  // Get the most recent reading (last entry in the array)
  const latest = data[data.length - 1]
  const { visibility, label, lookNorth } = getVisibility(latest.kp_index)

  return {
    kpIndex: latest.kp_index,
    estimatedKp: latest.estimated_kp,
    timestamp: latest.time_tag,
    visibility,
    visibilityLabel: label,
    lookNorth,
  }
}
