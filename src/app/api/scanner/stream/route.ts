import { NextRequest, NextResponse } from 'next/server'

// Valid Broadcastify feed IDs for our scanner
const VALID_FEEDS: Record<string, string> = {
  '15277': 'Le Mars Fire and Rescue',
  '46141': 'Sioux County Fire and EMS',
  '46227': 'Life Net-Air Methods West'
}

export async function GET(request: NextRequest) {
  const feedId = request.nextUrl.searchParams.get('feed')

  // Validate the feed ID
  if (!feedId || !VALID_FEEDS[feedId]) {
    return NextResponse.json(
      { error: 'Invalid feed ID' },
      { status: 400 }
    )
  }

  const streamUrl = `https://broadcastify.cdnstream1.com/${feedId}`

  try {
    // Fetch the audio stream from Broadcastify
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiouxCityObservatory/1.0)',
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Stream unavailable', status: response.status },
        { status: response.status }
      )
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'audio/mpeg'

    // Create a new response that streams the audio
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Stream proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to stream' },
      { status: 502 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
