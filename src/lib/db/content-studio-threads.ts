import { sql, isDatabaseConfigured } from '../db'

export interface DbThread {
  id: string
  userId: string
  title: string
  messages: unknown[] // UIMessage[] serialized
  canvasState: Record<string, unknown>
  canvasHistory: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * Load all Content Studio threads for a user
 */
export async function loadUserThreads(userId: string): Promise<DbThread[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const rows = await sql`
      SELECT
        id,
        user_id AS "userId",
        title,
        messages,
        canvas_state AS "canvasState",
        canvas_history AS "canvasHistory",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM content_studio_threads
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 30
    `
    return rows as DbThread[]
  } catch (error) {
    console.error('[Content Studio DB] Failed to load threads:', error)
    return []
  }
}

/**
 * Upsert a single thread (insert or update)
 */
export async function upsertThread(
  userId: string,
  thread: {
    id: string
    title: string
    messages: unknown[]
    canvasState: Record<string, unknown>
    canvasHistory: Record<string, unknown>
    createdAt: number
    updatedAt: number
  }
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      INSERT INTO content_studio_threads (id, user_id, title, messages, canvas_state, canvas_history, created_at, updated_at)
      VALUES (
        ${thread.id},
        ${userId},
        ${thread.title},
        ${JSON.stringify(thread.messages)}::jsonb,
        ${JSON.stringify(thread.canvasState)}::jsonb,
        ${JSON.stringify(thread.canvasHistory)}::jsonb,
        to_timestamp(${thread.createdAt / 1000}),
        to_timestamp(${thread.updatedAt / 1000})
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        canvas_state = EXCLUDED.canvas_state,
        canvas_history = EXCLUDED.canvas_history,
        updated_at = EXCLUDED.updated_at
    `
    return true
  } catch (error) {
    console.error('[Content Studio DB] Failed to upsert thread:', error)
    return false
  }
}

/**
 * Delete a thread by ID (only if owned by the user)
 */
export async function deleteThread(userId: string, threadId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      DELETE FROM content_studio_threads
      WHERE id = ${threadId} AND user_id = ${userId}
    `
    return true
  } catch (error) {
    console.error('[Content Studio DB] Failed to delete thread:', error)
    return false
  }
}
