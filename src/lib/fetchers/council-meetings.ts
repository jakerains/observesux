import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import Firecrawl from '@mendable/firecrawl-js'
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
 * Fetch transcript for a YouTube video using Firecrawl.
 * Throws NoCaptionsError if no transcript is available.
 *
 * Firecrawl renders the page with a real browser, bypassing YouTube's
 * datacenter IP blocking. The transcript text comes back without
 * per-segment timestamps, so we split into synthetic segments by
 * sentence to keep the downstream chunking pipeline working.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not configured')
  }

  try {
    console.log(`[Transcript] Fetching via Firecrawl for ${videoId}`)
    const firecrawl = new Firecrawl({ apiKey })

    const result = await firecrawl.scrape(
      `https://www.youtube.com/watch?v=${videoId}`,
      { formats: ['markdown'] }
    )

    if (!result.markdown) {
      console.error(`[Transcript] Firecrawl scrape returned no markdown for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    // Extract the transcript section from the markdown
    const transcriptMatch = result.markdown.match(/## Transcript\n\n([\s\S]+?)(?:\n## |\n---|\n\n\[|$)/)
    if (!transcriptMatch) {
      console.log(`[Transcript] No transcript section in Firecrawl result for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    const transcriptText = transcriptMatch[1].trim()
    if (transcriptText.length < 100) {
      console.log(`[Transcript] Transcript too short (${transcriptText.length} chars) for ${videoId}`)
      throw new NoCaptionsError(videoId)
    }

    console.log(`[Transcript] Got ${transcriptText.length} chars of transcript for ${videoId}`)

    // Split into synthetic segments by sentence boundaries.
    // We don't have real timestamps, so we estimate offsets by
    // distributing evenly across an assumed duration based on
    // ~150 words per minute of speech.
    const sentences = transcriptText.match(/[^.!?]+[.!?]+/g) || [transcriptText]
    const totalWords = transcriptText.split(/\s+/).length
    const estimatedDurationMs = (totalWords / 150) * 60 * 1000 // ~150 wpm

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

    console.log(`[Transcript] Created ${segments.length} segments for ${videoId}`)
    return segments
  } catch (error) {
    if (error instanceof NoCaptionsError) throw error

    const errorName = error instanceof Error ? error.constructor.name : 'Unknown'
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Transcript] Failed for ${videoId}: [${errorName}] ${errorMsg}`)

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
