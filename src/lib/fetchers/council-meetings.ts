import { generateText, generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import { fetchTranscript as ytFetchTranscript } from 'youtube-transcript'
import { SUX_PERSONALITY } from '@/lib/ai/sux-personality'
import { getActiveModel } from '@/lib/ai/model-config'
import type { TranscriptSegment, CouncilMeetingRecap } from '@/types/council-meetings'

// Sioux City Council YouTube channel
const COUNCIL_CHANNEL_ID = 'UCrekGAbOEqDvdzn9w8FAcoQ'
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${COUNCIL_CHANNEL_ID}`

// 5-minute chunking window in milliseconds
const CHUNK_WINDOW_MS = 300000

/**
 * Parse meeting date from video title.
 * Handles formats like:
 *   - "City of Sioux City Council Meeting - February 2 2026"
 *   - "City of Sioux City Council Meeting - January 26, 2026"
 *   - "City of Sioux City Council Budget Review - January 17, 2026"
 * Returns ISO date string (YYYY-MM-DD) or null if parsing fails.
 */
export function parseMeetingDateFromTitle(title: string): string | null {
  // Match "Month Day, Year" or "Month Day Year" at the end of the title
  const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
  const match = title.match(dateRegex)

  if (!match) return null

  const monthNames: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12'
  }

  const month = monthNames[match[1].toLowerCase()]
  const day = match[2].padStart(2, '0')
  const year = match[3]

  return `${year}-${month}-${day}`
}

export interface RSSVideoEntry {
  videoId: string
  title: string
  publishedAt: string
  videoUrl: string
  channelId: string
}

// InnerTube API constants for video metadata checks
const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const INNERTUBE_CLIENT = { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }
const INNERTUBE_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'

interface VideoMetadata {
  isLiveContent: boolean
  isUpcoming: boolean
  lengthSeconds: number
  captionTrackCount: number
}

/**
 * Lightweight check of a YouTube video's metadata via the InnerTube API.
 * Used to distinguish VODs (real duration, captions) from dead live stream
 * links (zero duration, no captions, isUpcoming still set).
 */
async function getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const res = await fetch(INNERTUBE_PLAYER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': INNERTUBE_UA },
      body: JSON.stringify({ context: INNERTUBE_CLIENT, videoId }),
    })
    if (!res.ok) return null

    const data = await res.json()
    const details = data.videoDetails || {}
    const captions = data.captions?.playerCaptionsTracklistRenderer?.captionTracks

    return {
      isLiveContent: details.isLiveContent === true,
      isUpcoming: details.isUpcoming === true,
      lengthSeconds: parseInt(details.lengthSeconds, 10) || 0,
      captionTrackCount: Array.isArray(captions) ? captions.length : 0,
    }
  } catch (error) {
    console.warn(`[VideoMeta] Failed to check metadata for ${videoId}:`, error)
    return null
  }
}

/**
 * Score a video for VOD preference. Higher = more likely to be a usable VOD.
 * Dead live stream links score 0; VODs with captions and real duration score highest.
 */
function vodScore(meta: VideoMetadata | null): number {
  if (!meta) return 1 // Unknown — treat as neutral
  if (meta.isUpcoming) return 0 // Dead/upcoming stream link
  if (meta.lengthSeconds === 0) return 0 // No real content
  let score = 1
  if (meta.lengthSeconds > 0) score += 2
  if (meta.captionTrackCount > 0) score += 3
  return score
}

/**
 * Custom error for videos without captions
 */
export class NoCaptionsError extends Error {
  constructor(videoId: string) {
    super(`No captions available for video ${videoId}`)
    this.name = 'NoCaptionsError'
  }
}

/**
 * Convert raw transcript text into synthetic segments with estimated timestamps.
 * Splits by sentence boundaries and estimates timing at ~150 words per minute.
 * Used by both fetchTranscript (for YouTube captions) and manual transcript uploads.
 */
export function textToSegments(rawText: string): TranscriptSegment[] {
  if (!rawText || rawText.trim().length === 0) {
    return []
  }

  // Split into sentences by sentence boundaries
  const sentences = rawText.match(/[^.!?]+[.!?]+/g) || [rawText]
  const totalWords = rawText.split(/\s+/).length
  // Estimate duration at ~150 words per minute
  const estimatedDurationMs = (totalWords / 150) * 60 * 1000

  let offsetMs = 0
  const segments: TranscriptSegment[] = []

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    const wordCount = trimmed.split(/\s+/).length
    const durationMs = (wordCount / totalWords) * estimatedDurationMs

    segments.push({
      text: trimmed,
      offset: Math.round(offsetMs),
      duration: Math.round(durationMs),
    })

    offsetMs += durationMs
  }

  return segments
}

/**
 * Parse YouTube RSS feed XML to extract video entries.
 * Uses regex-based parsing since the RSS format is simple and consistent.
 */
export function parseYouTubeRSS(xml: string): RSSVideoEntry[] {
  const entries: RSSVideoEntry[] = []

  // Match each <entry> block
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const block = entryMatch[1]

    const videoIdMatch = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
    const titleMatch = block.match(/<title>(.*?)<\/title>/)
    const publishedMatch = block.match(/<published>(.*?)<\/published>/)
    const channelIdMatch = block.match(/<yt:channelId>(.*?)<\/yt:channelId>/)

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1]
      const title = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

      entries.push({
        videoId,
        title,
        publishedAt: publishedMatch?.[1] || new Date().toISOString(),
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        channelId: channelIdMatch?.[1] || COUNCIL_CHANNEL_ID,
      })
    }
  }

  return entries
}

/**
 * Fetch the RSS feed for the Sioux City Council YouTube channel.
 * When duplicate titles exist (live stream + VOD), uses the InnerTube API
 * to pick the VOD (real duration, captions available) over the dead stream link.
 */
export async function fetchCouncilRSS(): Promise<RSSVideoEntry[]> {
  const response = await fetch(RSS_URL, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`)
  }
  const xml = await response.text()
  const entries = parseYouTubeRSS(xml)

  // Filter out test videos
  const filtered = entries.filter(entry => {
    const lowerTitle = entry.title.toLowerCase()
    return !lowerTitle.includes('test') && !lowerTitle.includes('placeholder')
  })

  // Group entries by title to find duplicates (live stream + VOD pairs)
  const titleGroups = new Map<string, RSSVideoEntry[]>()
  for (const entry of filtered) {
    const group = titleGroups.get(entry.title) || []
    group.push(entry)
    titleGroups.set(entry.title, group)
  }

  const results: RSSVideoEntry[] = []

  for (const [title, group] of titleGroups) {
    if (group.length === 1) {
      results.push(group[0])
      continue
    }

    // Multiple videos with the same title — check metadata to pick the VOD.
    // Dead stream links have lengthSeconds=0, isUpcoming=true, no captions.
    // VODs have real duration and caption tracks.
    console.log(`[RSS] Duplicate title "${title}" — ${group.length} videos, checking metadata...`)

    const scored = await Promise.all(
      group.map(async (entry) => {
        const meta = await getVideoMetadata(entry.videoId)
        const score = vodScore(meta)
        console.log(`[RSS]   ${entry.videoId}: score=${score} (len=${meta?.lengthSeconds ?? '?'}s, captions=${meta?.captionTrackCount ?? '?'}, upcoming=${meta?.isUpcoming ?? '?'})`)
        return { entry, score, meta }
      })
    )

    // Pick highest-scoring video (VOD). Tie-break by most recent publishedAt.
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.entry.publishedAt).getTime() - new Date(a.entry.publishedAt).getTime()
    })

    results.push(scored[0].entry)
    console.log(`[RSS]   Winner: ${scored[0].entry.videoId}`)
  }

  return results
}

/**
 * Fetch transcript for a YouTube video using the InnerTube API.
 * Throws NoCaptionsError if no transcript is available.
 *
 * Uses the youtube-transcript package which calls YouTube's InnerTube
 * ANDROID API — this bypasses datacenter IP blocking that breaks
 * browser-based scraping approaches. Returns real per-segment timestamps.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log(`[Transcript] Fetching via InnerTube API for ${videoId}`)

    const rawSegments = await ytFetchTranscript(videoId)

    if (!rawSegments || rawSegments.length === 0) {
      console.log(`[Transcript] No segments returned for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    // Map to our TranscriptSegment format (youtube-transcript returns offset/duration in ms)
    const segments: TranscriptSegment[] = rawSegments.map(seg => ({
      text: seg.text,
      offset: seg.offset,
      duration: seg.duration,
    }))

    const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
    console.log(`[Transcript] Got ${segments.length} segments (${totalChars} chars) for ${videoId}`)

    if (totalChars < 100) {
      console.log(`[Transcript] Transcript too short (${totalChars} chars) for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    return segments
  } catch (error) {
    if (error instanceof NoCaptionsError) throw error

    const errorMsg = error instanceof Error ? error.message : String(error)

    // youtube-transcript throws specific errors for disabled/unavailable transcripts
    if (errorMsg.includes('Transcript is disabled') || errorMsg.includes('No transcripts are available')) {
      console.log(`[Transcript] No captions for ${videoId}: ${errorMsg}`)
      throw new NoCaptionsError(videoId)
    }

    // Too many requests = captcha block
    if (errorMsg.includes('too many requests') || errorMsg.includes('captcha')) {
      console.error(`[Transcript] Rate limited for ${videoId}: ${errorMsg}`)
    }

    console.error(`[Transcript] Failed for ${videoId}: ${errorMsg}`)
    throw error
  }
}

/**
 * Group transcript segments into ~5-minute chunks.
 * Each chunk records its start/end timestamps in seconds for YouTube deep links.
 */
export function chunkTranscript(
  segments: TranscriptSegment[],
  windowMs: number = CHUNK_WINDOW_MS
): Array<{ content: string; startSeconds: number; endSeconds: number; chunkIndex: number }> {
  if (segments.length === 0) return []

  const chunks: Array<{ content: string; startSeconds: number; endSeconds: number; chunkIndex: number }> = []
  let currentTexts: string[] = []
  let windowStartMs = segments[0].offset
  let chunkStartMs = segments[0].offset
  let chunkEndMs = segments[0].offset

  for (const segment of segments) {
    // If this segment starts beyond the current window, flush
    if (segment.offset - windowStartMs >= windowMs && currentTexts.length > 0) {
      chunks.push({
        content: cleanTranscriptText(currentTexts.join(' ')),
        startSeconds: Math.floor(chunkStartMs / 1000),
        endSeconds: Math.floor(chunkEndMs / 1000),
        chunkIndex: chunks.length,
      })
      currentTexts = []
      windowStartMs = segment.offset
      chunkStartMs = segment.offset
    }

    currentTexts.push(segment.text)
    chunkEndMs = segment.offset + segment.duration

    if (currentTexts.length === 1 && chunks.length === 0) {
      chunkStartMs = segment.offset
    } else if (currentTexts.length === 1) {
      chunkStartMs = segment.offset
    }
  }

  // Flush remaining
  if (currentTexts.length > 0) {
    chunks.push({
      content: cleanTranscriptText(currentTexts.join(' ')),
      startSeconds: Math.floor(chunkStartMs / 1000),
      endSeconds: Math.floor(chunkEndMs / 1000),
      chunkIndex: chunks.length,
    })
  }

  return chunks
}

/**
 * Clean transcript text: remove HTML entities, [Music] artifacts, excessive whitespace
 */
function cleanTranscriptText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\[Music\]/gi, '')
    .replace(/\[Applause\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const RecapSchema = z.object({
  summary: z.string().describe('A concise 2-4 sentence overview of the meeting\'s key business. Used as a preview on the dashboard widget.'),
  article: z.string().describe('A thorough, engaging blog-post style write-up of the meeting (800-2000 words) as SUX speaking directly to Siouxland residents, using markdown headings (##).'),
  decisions: z.array(z.string()).describe('Specific decisions made, votes taken, or ordinances passed/discussed. Include vote counts if mentioned.'),
  topics: z.array(z.string()).describe('Major topics/agenda items discussed.'),
  publicComments: z.array(z.string()).describe('Notable public comments or citizen concerns raised.'),
})

/**
 * Generate a structured meeting recap using Claude via OpenRouter.
 * Uses generateObject with a Zod schema to guarantee valid structured output.
 * Sonnet 4.5 supports ~200K tokens (~600K chars), so most transcripts fit in a single call.
 * Only falls back to staged summarization for exceptionally long transcripts.
 */
export async function generateMeetingRecap(rawTranscript: string): Promise<CouncilMeetingRecap> {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })

  const modelId = await getActiveModel('council')

  const RECAP_SYSTEM_PROMPT = `${SUX_PERSONALITY}

Your job right now is to make a city council meeting transparent and accessible to everyday people. You write blog-post style recaps addressed directly to Siouxland residents.

**Current Sioux City Council members** (use these as the authoritative reference for names — transcripts often misspell or garble them):
- Mayor Bob Scott
- Mayor Pro Tem Julie Schoenherr
- Councilmember Craig Berenstein
- Councilmember Rick Bertrand
- Councilmember Ike Rayford

**Editorial voice guidance** — these are critical for maintaining the SUX blog personality consistently:
- **Be opinionated.** Don't just report what happened; tell residents what matters and why. Have a take. If something's frustrating, say so. If a project is overdue, note it.
- **Write like a blogger, not a journalist.** Use editorial asides, dry observations, and natural reactions. If a councilmember grilled someone, say they "didn't mince words." If infrastructure is aging, call it "the unglamorous work that keeps basements from flooding."
- **Vary your energy.** Not everything is "great news" or "exciting." Match the tone to the substance. Some things are genuinely exciting, some are complicated, some are frustrating.
- **Vary your opening.** Don't default to "Hey Siouxland" every time. Never use time-of-day greetings like "Good morning, Siouxland" — these are blog posts, not broadcasts, and readers could be reading at any time. Sometimes jump straight into the story. Sometimes lead with the most interesting thing that happened.
- **Add editorial commentary.** After reporting facts, add a sentence about what it actually means for people. "That's a start." "Expect pushback." "This one's worth watching."

For the article field: structure it with clear sections using markdown headings (##). Explain what decisions mean for residents: how will this affect their taxes, neighborhood, commute, utilities, etc.? Lead with the most impactful items. End with any upcoming actions residents should know about. Sign off briefly — just "— SUX". IMPORTANT: Do NOT guess or state how long the meeting was — you only have the transcript text, not the meeting duration.

If a section has no entries, use an empty array. Focus on substance over procedure.`

  // Staged summarization only for exceptionally long transcripts (>600K chars / ~150K tokens)
  if (rawTranscript.length > 600000) {
    console.log('[Council Recap] Transcript exceeds 600K chars, using staged summarization')
    const sectionSize = 400000
    const sections: string[] = []

    for (let i = 0; i < rawTranscript.length; i += sectionSize) {
      sections.push(rawTranscript.slice(i, i + sectionSize))
    }

    // Summarize each section (free-form text summaries)
    const sectionSummaries: string[] = []
    for (let i = 0; i < sections.length; i++) {
      console.log(`[Council Recap] Summarizing section ${i + 1}/${sections.length}`)
      const result = await generateText({
        model: openrouter(modelId),
        system: `${SUX_PERSONALITY}\n\nYou're covering a Sioux City council meeting for local residents. Summarize the key points, decisions, discussions, and any public comments from this portion of the transcript. Be thorough — include specifics like vote counts, dollar amounts, names of projects, and what things mean for residents.\n\n**Current Sioux City Council members** (use as authoritative name reference — transcripts often misspell them): Mayor Bob Scott, Mayor Pro Tem Julie Schoenherr, Councilmembers Craig Berenstein, Rick Bertrand, and Ike Rayford.`,
        prompt: sections[i],
        maxOutputTokens: 8000,
      })
      sectionSummaries.push(result.text)
    }

    // Combine and generate final structured recap
    const combinedSummary = sectionSummaries.join('\n\n---\n\n')
    const result = await generateObject({
      model: openrouter(modelId),
      schema: RecapSchema,
      system: RECAP_SYSTEM_PROMPT,
      prompt: `Here are detailed summaries of different sections of a city council meeting:\n\n${combinedSummary}`,
      maxOutputTokens: 8000,
    })

    return result.object
  }

  // Direct generation — send full transcript in one call
  const result = await generateObject({
    model: openrouter(modelId),
    schema: RecapSchema,
    system: RECAP_SYSTEM_PROMPT,
    prompt: rawTranscript,
    maxOutputTokens: 8000,
  })

  return result.object
}
