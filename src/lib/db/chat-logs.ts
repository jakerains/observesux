import { sql, isDatabaseConfigured } from '../db'
import { createHash } from 'crypto'

// Types for chat logging
export interface ChatSession {
  id: string
  userId: string | null
  userEmail?: string | null // Joined from auth when available
  startedAt: Date
  endedAt: Date | null
  messageCount: number
  toolCallsCount: number
  userAgent: string | null
  metadata: Record<string, unknown>
}

export interface ChatMessage {
  id: number
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  toolCalls: string[] | null
  tokensUsed: number | null
  responseTimeMs: number | null
  createdAt: Date
}

export interface SessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

// Hash IP address for privacy (we don't store raw IPs)
function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

/**
 * Create a new chat session
 */
export async function createChatSession(options?: {
  userId?: string
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
}): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    console.warn('[Chat Log] Database not configured, skipping session creation')
    return null
  }

  try {
    console.log('[Chat Log] Creating session for user:', options?.userId || 'anonymous')
    const result = await sql`
      INSERT INTO chat_sessions (user_id, user_agent, ip_hash, metadata)
      VALUES (
        ${options?.userId || null},
        ${options?.userAgent || null},
        ${options?.ipAddress ? hashIp(options.ipAddress) : null},
        ${JSON.stringify(options?.metadata || {})}
      )
      RETURNING id
    `
    console.log('[Chat Log] Session created:', result[0]?.id)
    return result[0]?.id || null
  } catch (error) {
    console.error('[Chat Log] Failed to create chat session:', error)
    return null
  }
}

/**
 * Ensure a session exists with the given ID (create if not exists)
 * Used when client provides a session ID but we need to ensure it's in the DB
 */
export async function ensureSessionExists(
  sessionId: string,
  options?: {
    userId?: string
    userAgent?: string
    ipAddress?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  if (!isDatabaseConfigured()) return

  try {
    // Use INSERT ... ON CONFLICT to ensure session exists
    // If session exists and user logs in, update the user_id
    await sql`
      INSERT INTO chat_sessions (id, user_id, user_agent, ip_hash, metadata)
      VALUES (
        ${sessionId}::uuid,
        ${options?.userId || null},
        ${options?.userAgent || null},
        ${options?.ipAddress ? hashIp(options.ipAddress) : null},
        ${JSON.stringify(options?.metadata || {})}
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = COALESCE(chat_sessions.user_id, EXCLUDED.user_id)
    `
  } catch (error) {
    console.error('Failed to ensure session exists:', error)
  }
}

/**
 * Log a chat message (user or assistant)
 */
export async function logChatMessage(data: {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
  tokensUsed?: number
  responseTimeMs?: number
}): Promise<void> {
  if (!isDatabaseConfigured()) return

  try {
    // Insert the message
    await sql`
      INSERT INTO chat_messages (session_id, role, content, tool_calls, tokens_used, response_time_ms)
      VALUES (
        ${data.sessionId}::uuid,
        ${data.role},
        ${data.content},
        ${data.toolCalls ? JSON.stringify(data.toolCalls) : null},
        ${data.tokensUsed || null},
        ${data.responseTimeMs || null}
      )
    `

    // Update session counts
    const toolCallsIncrement = data.toolCalls?.length || 0
    await sql`
      UPDATE chat_sessions
      SET
        message_count = message_count + 1,
        tool_calls_count = tool_calls_count + ${toolCallsIncrement}
      WHERE id = ${data.sessionId}::uuid
    `
  } catch (error) {
    console.error('Failed to log chat message:', error)
  }
}

/**
 * End a chat session (mark it as completed)
 */
export async function endChatSession(sessionId: string): Promise<void> {
  if (!isDatabaseConfigured()) return

  try {
    await sql`
      UPDATE chat_sessions
      SET ended_at = NOW()
      WHERE id = ${sessionId}::uuid
    `
  } catch (error) {
    console.error('Failed to end chat session:', error)
  }
}

/**
 * Get recent chat sessions with pagination
 */
export async function getRecentSessions(options?: {
  limit?: number
  offset?: number
  includeMessages?: boolean
}): Promise<ChatSession[] | SessionWithMessages[]> {
  if (!isDatabaseConfigured()) return []

  const limit = options?.limit || 50
  const offset = options?.offset || 0

  try {
    const sessions = await sql`
      SELECT
        s.id,
        s.user_id as "userId",
        u.email as "userEmail",
        s.started_at as "startedAt",
        s.ended_at as "endedAt",
        s.message_count as "messageCount",
        s.tool_calls_count as "toolCallsCount",
        s.user_agent as "userAgent",
        s.metadata
      FROM chat_sessions s
      LEFT JOIN neon_auth.user u ON s.user_id::uuid = u.id
      ORDER BY s.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as ChatSession[]

    if (!options?.includeMessages) {
      return sessions
    }

    // Fetch messages for each session
    const sessionsWithMessages: SessionWithMessages[] = await Promise.all(
      sessions.map(async (session) => {
        const messages = await getSessionMessages(session.id)
        return { ...session, messages }
      })
    )

    return sessionsWithMessages
  } catch (error) {
    console.error('Failed to get recent sessions:', error)
    return []
  }
}

/**
 * Get a single session by ID
 */
export async function getSession(sessionId: string): Promise<SessionWithMessages | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const sessions = await sql`
      SELECT
        s.id,
        s.user_id as "userId",
        u.email as "userEmail",
        s.started_at as "startedAt",
        s.ended_at as "endedAt",
        s.message_count as "messageCount",
        s.tool_calls_count as "toolCallsCount",
        s.user_agent as "userAgent",
        s.metadata
      FROM chat_sessions s
      LEFT JOIN neon_auth.user u ON s.user_id::uuid = u.id
      WHERE s.id = ${sessionId}::uuid
    ` as ChatSession[]

    if (sessions.length === 0) return null

    const session = sessions[0]
    const messages = await getSessionMessages(sessionId)

    return { ...session, messages }
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

/**
 * Get messages for a specific session
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const messages = await sql`
      SELECT
        id,
        session_id as "sessionId",
        role,
        content,
        tool_calls as "toolCalls",
        tokens_used as "tokensUsed",
        response_time_ms as "responseTimeMs",
        created_at as "createdAt"
      FROM chat_messages
      WHERE session_id = ${sessionId}::uuid
      ORDER BY created_at ASC, id ASC
    ` as ChatMessage[]

    return messages
  } catch (error) {
    console.error('Failed to get session messages:', error)
    return []
  }
}

/**
 * Get chat analytics summary
 */
export async function getChatAnalytics(options?: {
  days?: number
}): Promise<{
  totalSessions: number
  totalMessages: number
  totalToolCalls: number
  avgMessagesPerSession: number
  topTools: { tool: string; count: number }[]
} | null> {
  if (!isDatabaseConfigured()) return null

  const days = options?.days || 30

  try {
    // Get aggregate stats
    const stats = await sql`
      SELECT
        COUNT(DISTINCT s.id) as "totalSessions",
        COALESCE(SUM(s.message_count), 0) as "totalMessages",
        COALESCE(SUM(s.tool_calls_count), 0) as "totalToolCalls",
        COALESCE(AVG(s.message_count), 0) as "avgMessagesPerSession"
      FROM chat_sessions s
      WHERE s.started_at > NOW() - MAKE_INTERVAL(days => ${days})
    `

    // Get top tools used
    const toolStats = await sql`
      SELECT
        tool,
        COUNT(*) as count
      FROM chat_messages,
           LATERAL jsonb_array_elements_text(tool_calls) as tool
      WHERE created_at > NOW() - MAKE_INTERVAL(days => ${days})
        AND tool_calls IS NOT NULL
      GROUP BY tool
      ORDER BY count DESC
      LIMIT 10
    ` as { tool: string; count: number }[]

    return {
      totalSessions: Number(stats[0]?.totalSessions || 0),
      totalMessages: Number(stats[0]?.totalMessages || 0),
      totalToolCalls: Number(stats[0]?.totalToolCalls || 0),
      avgMessagesPerSession: Number(stats[0]?.avgMessagesPerSession || 0),
      topTools: toolStats,
    }
  } catch (error) {
    console.error('Failed to get chat analytics:', error)
    return null
  }
}

/**
 * Search chat messages by content
 */
export async function searchMessages(query: string, options?: {
  limit?: number
  role?: 'user' | 'assistant'
}): Promise<(ChatMessage & { sessionStartedAt: Date })[]> {
  if (!isDatabaseConfigured()) return []

  const limit = options?.limit || 50

  try {
    let result
    if (options?.role) {
      result = await sql`
        SELECT
          m.id,
          m.session_id as "sessionId",
          m.role,
          m.content,
          m.tool_calls as "toolCalls",
          m.tokens_used as "tokensUsed",
          m.response_time_ms as "responseTimeMs",
          m.created_at as "createdAt",
          s.started_at as "sessionStartedAt"
        FROM chat_messages m
        JOIN chat_sessions s ON m.session_id = s.id
        WHERE m.content ILIKE ${'%' + query + '%'}
          AND m.role = ${options.role}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `
    } else {
      result = await sql`
        SELECT
          m.id,
          m.session_id as "sessionId",
          m.role,
          m.content,
          m.tool_calls as "toolCalls",
          m.tokens_used as "tokensUsed",
          m.response_time_ms as "responseTimeMs",
          m.created_at as "createdAt",
          s.started_at as "sessionStartedAt"
        FROM chat_messages m
        JOIN chat_sessions s ON m.session_id = s.id
        WHERE m.content ILIKE ${'%' + query + '%'}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `
    }

    return result as (ChatMessage & { sessionStartedAt: Date })[]
  } catch (error) {
    console.error('Failed to search messages:', error)
    return []
  }
}
