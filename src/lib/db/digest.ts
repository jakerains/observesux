import { sql, isDatabaseConfigured } from '../db'
import type { Digest, DigestData, DigestEdition } from '@/lib/digest/types'

/**
 * Get today's date in YYYY-MM-DD format (Central Time)
 */
function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

/**
 * Save a new digest to the database
 */
export async function saveDigest(data: {
  edition: DigestEdition
  summary: string
  content: string
  dataSnapshot?: DigestData
  generationTimeMs: number
}): Promise<Digest | null> {
  if (!isDatabaseConfigured()) {
    console.warn('[Digest DB] Database not configured, skipping save')
    return null
  }

  const date = getTodayDate()

  try {
    const result = await sql`
      INSERT INTO digests (edition, date, summary, content, data_snapshot, generation_time_ms)
      VALUES (
        ${data.edition},
        ${date},
        ${data.summary},
        ${data.content},
        ${data.dataSnapshot ? JSON.stringify(data.dataSnapshot) : null},
        ${data.generationTimeMs}
      )
      ON CONFLICT (edition, date) DO UPDATE SET
        summary = EXCLUDED.summary,
        content = EXCLUDED.content,
        data_snapshot = EXCLUDED.data_snapshot,
        generation_time_ms = EXCLUDED.generation_time_ms,
        created_at = NOW()
      RETURNING
        id,
        edition,
        date,
        summary,
        content,
        data_snapshot as "dataSnapshot",
        generation_time_ms as "generationTimeMs",
        created_at as "createdAt"
    `

    if (result.length === 0) return null

    return {
      id: result[0].id,
      edition: result[0].edition,
      date: result[0].date,
      summary: result[0].summary || '',
      content: result[0].content,
      dataSnapshot: result[0].dataSnapshot,
      generationTimeMs: result[0].generationTimeMs,
      createdAt: result[0].createdAt
    } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to save digest:', error)
    return null
  }
}

/**
 * Get today's digest for a specific edition
 */
export async function getTodaysDigest(
  edition: DigestEdition
): Promise<Digest | null> {
  if (!isDatabaseConfigured()) return null

  const date = getTodayDate()

  try {
    const result = await sql`
      SELECT
        id,
        edition,
        date,
        summary,
        content,
        data_snapshot as "dataSnapshot",
        generation_time_ms as "generationTimeMs",
        created_at as "createdAt"
      FROM digests
      WHERE edition = ${edition}
        AND date = ${date}
    `

    if (result.length === 0) return null

    const row = result[0]
    return { ...row, summary: row.summary || '' } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to get today\'s digest:', error)
    return null
  }
}

/**
 * Get the latest digest (most recent, any edition)
 */
export async function getLatestDigest(): Promise<Digest | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        id,
        edition,
        date,
        summary,
        content,
        data_snapshot as "dataSnapshot",
        generation_time_ms as "generationTimeMs",
        created_at as "createdAt"
      FROM digests
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.length === 0) return null

    const row = result[0]
    return { ...row, summary: row.summary || '' } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to get latest digest:', error)
    return null
  }
}

/**
 * Get recent digests (for history view)
 */
export async function getRecentDigests(
  limit: number = 14
): Promise<Digest[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        id,
        edition,
        date,
        summary,
        content,
        data_snapshot as "dataSnapshot",
        generation_time_ms as "generationTimeMs",
        created_at as "createdAt"
      FROM digests
      ORDER BY date DESC,
        CASE edition
          WHEN 'evening' THEN 1
          WHEN 'midday' THEN 2
          WHEN 'morning' THEN 3
        END
      LIMIT ${limit}
    `

    return result.map(row => ({ ...row, summary: row.summary || '' })) as Digest[]
  } catch (error) {
    console.error('[Digest DB] Failed to get recent digests:', error)
    return []
  }
}

/**
 * Get a specific digest by ID
 */
export async function getDigestById(
  digestId: string
): Promise<Digest | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        id,
        edition,
        date,
        summary,
        content,
        data_snapshot as "dataSnapshot",
        generation_time_ms as "generationTimeMs",
        created_at as "createdAt"
      FROM digests
      WHERE id = ${digestId}::uuid
    `

    if (result.length === 0) return null

    const row = result[0]
    return { ...row, summary: row.summary || '' } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to get digest by ID:', error)
    return null
  }
}

/**
 * Delete old digests (keep only the most recent N days)
 */
export async function pruneOldDigests(
  keepDays: number = 30
): Promise<number> {
  if (!isDatabaseConfigured()) return 0

  try {
    const result = await sql`
      DELETE FROM digests
      WHERE date < (CURRENT_DATE - ${keepDays}::int)
      RETURNING id
    `

    return result.length
  } catch (error) {
    console.error('[Digest DB] Failed to prune old digests:', error)
    return 0
  }
}

/**
 * Check if a digest exists for today's edition
 */
export async function digestExistsForToday(
  edition: DigestEdition
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  const date = getTodayDate()

  try {
    const result = await sql`
      SELECT 1 FROM digests
      WHERE edition = ${edition} AND date = ${date}
      LIMIT 1
    `

    return result.length > 0
  } catch (error) {
    console.error('[Digest DB] Failed to check digest existence:', error)
    return false
  }
}
