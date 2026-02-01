import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { SUX_PERSONALITY } from '@/lib/ai/sux-personality'
import type { TranscriptSegment, CouncilMeetingRecap } from '@/types/council-meetings'

// Sioux City Council YouTube channel
const COUNCIL_CHANNEL_ID = 'UCrekGAbOEqDvdzn9w8FAcoQ'
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${COUNCIL_CHANNEL_ID}`

// 5-minute chunking window in milliseconds
const CHUNK_WINDOW_MS = 300000

export interface RSSVideoEntry {
  videoId: string
  title: string
  publishedAt: string
  videoUrl: string
  channelId: string
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
 * Fetch the RSS feed for the Sioux City Council YouTube channel
 */
export async function fetchCouncilRSS(): Promise<RSSVideoEntry[]> {
  const response = await fetch(RSS_URL, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`)
  }
  const xml = await response.text()
  const entries = parseYouTubeRSS(xml)

  // Filter out test videos
  return entries.filter(entry => {
    const lowerTitle = entry.title.toLowerCase()
    return !lowerTitle.includes('test') && !lowerTitle.includes('placeholder')
  })
}

/**
 * Fetch transcript segments for a YouTube video.
 * Throws NoCaptionsError if no captions are available.
 *
 * Scrapes the YouTube watch page HTML to extract the embedded
 * ytInitialPlayerResponse JSON, finds the timedtext caption URL,
 * and fetches the XML transcript directly. This avoids the InnerTube
 * API which YouTube blocks from datacenter IPs.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  const CONSENT_COOKIES = 'SOCS=CAESEwgDEgk2ODE4MTAyNjQaAmVuIAEaBgiA_JO7Bg; CONSENT=YES+'

  try {
    // Step 1: Fetch the YouTube watch page HTML
    console.log(`[Transcript] Fetching watch page for ${videoId}`)
    const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: CONSENT_COOKIES,
      },
    })

    if (!pageResponse.ok) {
      throw new Error(`Watch page fetch failed: ${pageResponse.status}`)
    }

    const html = await pageResponse.text()
    console.log(`[Transcript] Watch page HTML length: ${html.length}`)

    // Step 2: Extract ytInitialPlayerResponse from the page
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/)
    if (!playerMatch) {
      console.error(`[Transcript] No ytInitialPlayerResponse found in page for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    let playerData: Record<string, unknown>
    try {
      playerData = JSON.parse(playerMatch[1])
    } catch {
      console.error(`[Transcript] Failed to parse ytInitialPlayerResponse for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    // Step 3: Find caption tracks
    const captions = playerData.captions as Record<string, unknown> | undefined
    const tracklistRenderer = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined
    const captionTracks = tracklistRenderer?.captionTracks as Array<Record<string, string>> | undefined

    if (!captionTracks || captionTracks.length === 0) {
      console.log(`[Transcript] No caption tracks found for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    console.log(`[Transcript] Found ${captionTracks.length} caption track(s) for ${videoId}`)

    // Find English track, or auto-generated English, or first available
    const track =
      captionTracks.find(t => t.vssId === '.en') ||
      captionTracks.find(t => t.vssId === 'a.en') ||
      captionTracks.find(t => t.languageCode === 'en') ||
      captionTracks[0]

    if (!track?.baseUrl) {
      console.error(`[Transcript] No usable caption track URL for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    console.log(`[Transcript] Using caption track: ${track.vssId || track.languageCode} for ${videoId}`)

    // Step 4: Fetch the timedtext XML
    const captionUrl = track.baseUrl
    const captionResponse = await fetch(captionUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: CONSENT_COOKIES,
      },
    })

    if (!captionResponse.ok) {
      throw new Error(`Caption XML fetch failed: ${captionResponse.status}`)
    }

    const xml = await captionResponse.text()
    if (!xml.includes('<text')) {
      console.error(`[Transcript] Caption XML has no <text> elements for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    // Step 5: Parse the timedtext XML into segments
    const segments: TranscriptSegment[] = []
    const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g
    let match

    while ((match = textRegex.exec(xml)) !== null) {
      const startSec = parseFloat(match[1])
      const durSec = parseFloat(match[2])
      const rawText = match[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '') // strip any inline tags

      if (rawText.trim()) {
        segments.push({
          text: rawText.trim(),
          offset: startSec * 1000,
          duration: durSec * 1000,
        })
      }
    }

    if (segments.length === 0) {
      console.error(`[Transcript] Parsed 0 segments from XML for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    console.log(`[Transcript] Successfully parsed ${segments.length} segments for ${videoId}`)
    return segments
  } catch (error) {
    if (error instanceof NoCaptionsError) throw error

    const errorName = error instanceof Error ? error.constructor.name : 'Unknown'
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Transcript] Failed for ${videoId}: [${errorName}] ${errorMsg}`)

    if (
      errorMsg.includes('captions') ||
      errorMsg.includes('transcript') ||
      errorMsg.includes('disabled') ||
      errorMsg.includes('not available')
    ) {
      throw new NoCaptionsError(videoId)
    }

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

/**
 * Generate a structured meeting recap using Claude via OpenRouter.
 * Sonnet 4.5 supports ~200K tokens (~600K chars), so most transcripts fit in a single call.
 * Only falls back to staged summarization for exceptionally long transcripts.
 */
export async function generateMeetingRecap(rawTranscript: string): Promise<CouncilMeetingRecap> {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })

  const RECAP_SYSTEM_PROMPT = `${SUX_PERSONALITY}

Your job right now is to make a city council meeting transparent and accessible to everyday people. You write blog-post style recaps addressed directly to Siouxland residents.

Given a transcript (or summary of sections), produce a structured JSON recap with these fields:

1. **summary**: A concise 2-4 sentence overview of the meeting's key business. This is used as a preview on the dashboard widget.

2. **article**: A thorough, engaging blog-post style write-up of the meeting (800-2000 words). Write it as SUX speaking directly to Siouxland residents. Use plain English — no jargon, no legalese. Structure it with clear sections using markdown headings (##). Explain what decisions mean for residents: how will this affect their taxes, neighborhood, commute, utilities, etc.? Include context where helpful. Address readers directly when appropriate ("here's what this means for you," "if you live near..."). Lead with the most impactful items. End with any upcoming actions residents should know about (next votes, public comment opportunities, deadlines). Sign off briefly as SUX. IMPORTANT: Do NOT guess or state how long the meeting was (e.g. "a four-hour meeting") — you only have the transcript text, not the meeting duration. Stick to what you can see in the transcript.

3. **decisions**: An array of specific decisions made, votes taken, or ordinances passed/discussed. Include vote counts if mentioned.

4. **topics**: An array of major topics/agenda items discussed.

5. **publicComments**: An array of notable public comments or citizen concerns raised.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "article": "...",
  "decisions": ["...", "..."],
  "topics": ["...", "..."],
  "publicComments": ["...", "..."]
}

If a section has no entries, use an empty array []. Focus on substance over procedure.`

  // Staged summarization only for exceptionally long transcripts (>600K chars / ~150K tokens)
  if (rawTranscript.length > 600000) {
    console.log('[Council Recap] Transcript exceeds 600K chars, using staged summarization')
    const sectionSize = 400000
    const sections: string[] = []

    for (let i = 0; i < rawTranscript.length; i += sectionSize) {
      sections.push(rawTranscript.slice(i, i + sectionSize))
    }

    // Summarize each section
    const sectionSummaries: string[] = []
    for (let i = 0; i < sections.length; i++) {
      console.log(`[Council Recap] Summarizing section ${i + 1}/${sections.length}`)
      const result = await generateText({
        model: openrouter('anthropic/claude-sonnet-4.5'),
        system: `${SUX_PERSONALITY}\n\nYou're covering a Sioux City council meeting for local residents. Summarize the key points, decisions, discussions, and any public comments from this portion of the transcript. Be thorough — include specifics like vote counts, dollar amounts, names of projects, and what things mean for residents.`,
        prompt: sections[i],
        maxOutputTokens: 8000,
      })
      sectionSummaries.push(result.text)
    }

    // Combine and generate final recap
    const combinedSummary = sectionSummaries.join('\n\n---\n\n')
    const result = await generateText({
      model: openrouter('anthropic/claude-sonnet-4.5'),
      system: RECAP_SYSTEM_PROMPT,
      prompt: `Here are detailed summaries of different sections of a city council meeting:\n\n${combinedSummary}`,
      maxOutputTokens: 8000,
    })

    return parseRecapResponse(result.text)
  }

  // Direct generation — send full transcript in one call
  const result = await generateText({
    model: openrouter('anthropic/claude-sonnet-4.5'),
    system: RECAP_SYSTEM_PROMPT,
    prompt: rawTranscript,
    maxOutputTokens: 8000,
  })

  return parseRecapResponse(result.text)
}

/**
 * Parse the AI response into a CouncilMeetingRecap, with fallback handling
 */
function parseRecapResponse(text: string): CouncilMeetingRecap {
  try {
    // Try to extract JSON from the response (may have markdown code fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      summary: parsed.summary || 'Meeting recap generated but summary extraction failed.',
      article: parsed.article || '',
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      publicComments: Array.isArray(parsed.publicComments) ? parsed.publicComments : [],
    }
  } catch (error) {
    console.error('[Council Recap] Failed to parse recap JSON:', error)
    // Fallback: use the raw text as the summary
    return {
      summary: text.slice(0, 500),
      article: '',
      decisions: [],
      topics: [],
      publicComments: [],
    }
  }
}
