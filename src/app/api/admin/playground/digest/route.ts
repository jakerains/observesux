import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { isAdminWithUser } from '@/lib/auth/server'
import { getDigestSystemPrompt, buildDigestPrompt } from '@/lib/digest/system-prompt'
import type { DigestEdition, DigestData } from '@/lib/digest/types'

// Import fetchers directly — NOT from fetcher-steps.ts which uses "use step" workflow directives
import { fetchNWSObservations, fetchNWSForecast, fetchNWSAlerts } from '@/lib/fetchers/nws'
import { fetchRiverGauges } from '@/lib/fetchers/usgs'
import { fetchAirQuality } from '@/lib/fetchers/airnow'
import { fetch511Events } from '@/lib/fetchers/iowa-dot'
import { fetchCommunityEvents } from '@/lib/fetchers/events'
import { fetchLocalNews } from '@/lib/fetchers/news'
import { fetchPollenData } from '@/lib/fetchers/pollen'
import { fetchAuroraData } from '@/lib/fetchers/aurora'
import { sql, isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Lightweight data aggregation for the playground.
 * Same data sources as the workflow's aggregateAllData, but without
 * "use step" directives or RetryableError (those require the workflow runtime).
 */
async function aggregateDataForPlayground(edition: DigestEdition): Promise<DigestData> {
  const results = await Promise.allSettled([
    fetchNWSObservations(),
    fetchNWSForecast(),
    fetchNWSAlerts(),
    fetchRiverGauges(),
    fetchAirQuality(),
    fetch511Events(),
    fetchLocalNews(),
    fetchCommunityEvents(),
    fetchGasPricesFromDB(),
    fetchPollenData(),
    fetchAuroraData(),
  ])

  const get = <T>(idx: number): T | null => {
    const r = results[idx]
    return r.status === 'fulfilled' ? (r.value as T) : null
  }

  const events = get<{ events: { title: string; date: string; location: string; description: string }[] }>(7)

  // Build the data object — cast through unknown since we're assembling
  // from Promise.allSettled results with looser types than the workflow version
  const data = {
    weather: {
      current: get(0),
      forecast: get(1),
      alerts: get(2) ?? [],
    },
    rivers: get(3) ?? [],
    airQuality: get(4),
    traffic: get(5) ?? [],
    news: get(6) ?? [],
    events: events?.events ?? [],
    gasPrices: get(8),
    flights: { delays: 0, cancellations: 0, totalFlights: 0, airport: 'SUX' },
    pollen: get(9),
    aurora: get(10),
    schools: [],
    councilRecap: null,
    timestamp: new Date().toISOString(),
  }

  return data as unknown as DigestData
}

async function fetchGasPricesFromDB() {
  if (!isDatabaseConfigured()) return null
  try {
    const result = await sql`
      SELECT
        MIN(regular_price) as lowest,
        AVG(regular_price) as average,
        MAX(regular_price) as highest,
        COUNT(*) as station_count
      FROM gas_prices
      WHERE regular_price IS NOT NULL
        AND updated_at > NOW() - INTERVAL '24 hours'
    `
    if (!result[0]?.lowest) return null
    return {
      lowestRegular: parseFloat(result[0].lowest),
      averageRegular: parseFloat(result[0].average),
      highestRegular: parseFloat(result[0].highest),
      stationCount: parseInt(result[0].station_count),
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { isAdmin } = await isAdminWithUser()
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { model: modelId, edition = 'morning' } = body as { model: string; edition?: DigestEdition }

    if (!modelId) {
      return new Response(JSON.stringify({ error: 'model required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    console.log(`[Playground/Digest] Aggregating data for ${edition} edition...`)
    const digestData = await aggregateDataForPlayground(edition)

    const systemPrompt = getDigestSystemPrompt(edition)
    const userPrompt = buildDigestPrompt(digestData, edition)

    console.log(`[Playground/Digest] Generating with model: ${modelId}`)

    const result = streamText({
      model: openrouter(modelId),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 4000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[Playground/Digest] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
