import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    const agentId = process.env.ELEVENLABS_AGENT_ID

    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not configured')
      return NextResponse.json(
        { error: 'Voice agent not configured' },
        { status: 500 }
      )
    }

    if (!agentId) {
      console.error('ELEVENLABS_AGENT_ID not configured')
      return NextResponse.json(
        { error: 'Voice agent not configured' },
        { status: 500 }
      )
    }

    // Get signed URL for private agent conversation
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to get voice agent authorization' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      signedUrl: data.signed_url,
    })
  } catch (error) {
    console.error('Voice agent auth error:', error)
    return NextResponse.json(
      { error: 'Failed to authorize voice agent' },
      { status: 500 }
    )
  }
}
