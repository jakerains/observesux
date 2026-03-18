import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { isAdminWithUser } from '@/lib/auth/server'
import { getMeetingById } from '@/lib/db/council-meetings'
import { SUX_PERSONALITY } from '@/lib/ai/sux-personality'

export const runtime = 'nodejs'
export const maxDuration = 120

const RECAP_SYSTEM_PROMPT = `${SUX_PERSONALITY}

Your job right now is to make a city council meeting transparent and accessible to everyday people. You write blog-post style recaps addressed directly to Siouxland residents.

**Current Sioux City Council members** (use these as the authoritative reference for names — transcripts often misspell or garble them):
- Mayor Bob Scott
- Mayor Pro Tem Julie Schoenherr
- Councilmember Craig Berenstein
- Councilmember Rick Bertrand
- Councilmember Ike Rayford

**Editorial voice guidance**:
- Be opinionated. Don't just report what happened; tell residents what matters and why.
- Write like a blogger, not a journalist. Use editorial asides, dry observations, and natural reactions.
- Vary your energy. Not everything is "great news" or "exciting."
- Vary your opening. Don't default to "Hey Siouxland" every time. Never use time-of-day greetings.
- Add editorial commentary. After reporting facts, add a sentence about what it actually means for people.

Structure it with clear sections using markdown headings (##). Explain what decisions mean for residents. Lead with the most impactful items. End with upcoming actions. Sign off briefly as "— SUX". Do NOT guess meeting duration.

Format your response as:

## Summary
(2-4 sentence overview)

## Full Recap
(800-2000 word blog-post style write-up with ## section headings)

## Key Decisions
(Bulleted list of specific decisions, votes, ordinances)

## Topics Discussed
(Bulleted list of major agenda items)

## Public Comments
(Bulleted list of notable citizen concerns, or "None noted" if none)`

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
    const { model: modelId, meetingId } = body as { model: string; meetingId: string }

    if (!modelId || !meetingId) {
      return new Response(JSON.stringify({ error: 'model and meetingId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const meeting = await getMeetingById(meetingId)
    if (!meeting) {
      return new Response(JSON.stringify({ error: 'Meeting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!meeting.transcriptRaw) {
      return new Response(JSON.stringify({ error: 'No transcript available for this meeting' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    console.log(`[Playground/Council] Generating recap for "${meeting.title}" with model: ${modelId}`)

    // For very long transcripts, truncate to ~400K chars to avoid token limits on smaller models
    const transcript = meeting.transcriptRaw.length > 400000
      ? meeting.transcriptRaw.slice(0, 400000) + '\n\n[Transcript truncated for testing]'
      : meeting.transcriptRaw

    const result = streamText({
      model: openrouter(modelId),
      system: RECAP_SYSTEM_PROMPT,
      prompt: transcript,
      maxOutputTokens: 8000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[Playground/Council] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET() {
  try {
    const { isAdmin } = await isAdminWithUser()
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { getRecentMeetings } = await import('@/lib/db/council-meetings')
    const meetings = await getRecentMeetings(20)

    // Only return meetings that have transcripts
    const withTranscripts = meetings
      .filter((m) => m.transcriptRaw && m.status === 'completed')
      .map((m) => ({
        id: m.id,
        title: m.title,
        meetingDate: m.meetingDate,
        videoId: m.videoId,
        transcriptLength: m.transcriptRaw?.length ?? 0,
      }))

    return new Response(JSON.stringify(withTranscripts), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Playground/Council] GET error:', error)
    return new Response(JSON.stringify({ error: 'Failed to load meetings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
