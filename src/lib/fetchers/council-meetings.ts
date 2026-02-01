import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { YoutubeTranscript } from 'youtube-transcript-plus'
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
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      throw new NoCaptionsError(videoId)
    }

    return transcript.map(item => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration,
    }))
  } catch (error) {
    if (error instanceof NoCaptionsError) throw error

    // youtube-transcript throws generic errors when captions aren't available
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes('Could not find captions') ||
      message.includes('Transcript is disabled') ||
      message.includes('No transcript')
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
 * For very long transcripts (>100K chars), uses staged summarization.
 */
export async function generateMeetingRecap(rawTranscript: string): Promise<CouncilMeetingRecap> {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })

  const RECAP_SYSTEM_PROMPT = `You are an expert at analyzing city council meeting transcripts.
Given a transcript (or summary of sections), extract a structured recap with:

1. **summary**: A concise 2-4 sentence overview of the meeting's key business.
2. **decisions**: An array of specific decisions made, votes taken, or ordinances passed/discussed. Include vote counts if mentioned.
3. **topics**: An array of major topics/agenda items discussed.
4. **publicComments**: An array of notable public comments or citizen concerns raised.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "decisions": ["...", "..."],
  "topics": ["...", "..."],
  "publicComments": ["...", "..."]
}

If a section has no entries, use an empty array []. Focus on substance over procedure.`

  // Staged summarization for very long transcripts
  if (rawTranscript.length > 100000) {
    console.log('[Council Recap] Transcript exceeds 100K chars, using staged summarization')
    const sectionSize = 80000
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
        system: 'Summarize the key points, decisions, and discussions from this portion of a city council meeting transcript. Be thorough but concise.',
        prompt: sections[i],
        maxOutputTokens: 4000,
      })
      sectionSummaries.push(result.text)
    }

    // Combine and generate final recap
    const combinedSummary = sectionSummaries.join('\n\n---\n\n')
    const result = await generateText({
      model: openrouter('anthropic/claude-sonnet-4.5'),
      system: RECAP_SYSTEM_PROMPT,
      prompt: `Here are summaries of different sections of a city council meeting:\n\n${combinedSummary}`,
      maxOutputTokens: 4000,
    })

    return parseRecapResponse(result.text)
  }

  // Direct generation for shorter transcripts
  const result = await generateText({
    model: openrouter('anthropic/claude-sonnet-4.5'),
    system: RECAP_SYSTEM_PROMPT,
    prompt: rawTranscript,
    maxOutputTokens: 4000,
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
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      publicComments: Array.isArray(parsed.publicComments) ? parsed.publicComments : [],
    }
  } catch (error) {
    console.error('[Council Recap] Failed to parse recap JSON:', error)
    // Fallback: use the raw text as the summary
    return {
      summary: text.slice(0, 500),
      decisions: [],
      topics: [],
      publicComments: [],
    }
  }
}
