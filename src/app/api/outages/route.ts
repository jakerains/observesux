import { NextResponse } from 'next/server'
import type { OutageSummary, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

// Note: MidAmerican Energy and Woodbury REC don't have public APIs
// Their outage maps require scraping or have iframe restrictions
// For now, we'll return placeholder data with links to their portals

export async function GET() {
  try {
    // In a production environment, you would:
    // 1. Scrape the outage map pages
    // 2. Use a headless browser to extract data
    // 3. Or partner with the utilities for API access

    // For now, return summary with links
    const summaries: OutageSummary[] = [
      {
        provider: 'MidAmerican Energy',
        totalOutages: 0, // Would be fetched from their map
        totalCustomersAffected: 0,
        lastUpdated: new Date()
      },
      {
        provider: 'Woodbury REC',
        totalOutages: 0,
        totalCustomersAffected: 0,
        lastUpdated: new Date()
      }
    ]

    const response: ApiResponse<OutageSummary[]> = {
      data: summaries,
      timestamp: new Date(),
      source: 'utility_portals'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Outages API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch outage data'
      },
      { status: 500 }
    )
  }
}
