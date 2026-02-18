import { NextResponse } from 'next/server'
import { fetchAircraft } from '@/lib/fetchers/aircraft'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await fetchAircraft()

  return NextResponse.json({
    data: data.aircraft,
    timestamp: data.timestamp.toISOString(),
    source: data.source,
    suxArrivals: data.suxArrivals,
    suxDepartures: data.suxDepartures,
    nearSux: data.nearSux,
    total: data.aircraft.length,
  })
}
