import { NextResponse } from 'next/server'
import { fetchAircraft } from '@/lib/fetchers/opensky'

export const revalidate = 10 // Revalidate every 10 seconds

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
