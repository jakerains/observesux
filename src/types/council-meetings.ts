// City Council Meeting Types

export interface CouncilMeeting {
  id: string
  videoId: string
  title: string
  publishedAt: string | null
  meetingDate: string | null
  videoUrl: string | null
  channelId: string | null
  transcriptRaw: string | null
  recap: CouncilMeetingRecap | null
  status: CouncilMeetingStatus
  errorMessage: string | null
  chunkCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface MeetingVersion {
  id: string
  meetingId: string
  version: number
  recap: CouncilMeetingRecap | null
  transcriptRaw: string | null
  chunkCount: number
  createdAt: string
}

export type CouncilMeetingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'no_captions'

export interface CouncilMeetingRecap {
  summary: string
  article?: string
  decisions: string[]
  topics: string[]
  publicComments: string[]
}

export interface CouncilMeetingChunk {
  id: string
  meetingId: string
  videoId: string
  chunkIndex: number
  content: string
  startSeconds: number
  endSeconds: number
  sourceCategory: string
  meetingDate: string | null
  createdAt: string
}

export interface CouncilMeetingChunkWithSimilarity extends CouncilMeetingChunk {
  similarity: number
  youtubeLink: string
  meetingTitle: string
}

export interface TranscriptSegment {
  text: string
  offset: number   // milliseconds from start
  duration: number  // milliseconds
}

// Progress events streamed from workflow to admin UI
export type CouncilIngestProgress =
  | { step: 'rss'; count: number; message: string }
  | { step: 'found'; newCount: number; skippedCount: number; message: string }
  | { step: 'transcript'; videoId: string; segmentCount: number; message: string }
  | { step: 'transcript_unavailable'; videoId: string; message: string }
  | { step: 'chunking'; videoId: string; chunkCount: number; message: string }
  | { step: 'recap'; videoId: string; message: string }
  | { step: 'embedding'; videoId: string; current: number; total: number; message: string }
  | { step: 'complete'; videoId: string; title: string; message: string }
  | { step: 'error'; videoId: string; error: string; message: string }
  | { step: 'done'; message: string }

export interface CouncilWorkflowInput {
  force?: boolean  // Re-process already completed videos
}

export interface CouncilWorkflowOutput {
  success: boolean
  processed: number
  skipped: number
  failed: number
  noCaptions: number
  error?: string
}

export interface CouncilIngestStats {
  totalMeetings: number
  completedCount: number
  failedCount: number
  noCaptionsCount: number
  pendingCount: number
  latestMeetingDate: string | null
}
