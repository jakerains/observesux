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
 * Creates a new version and sets it as active (deactivating previous versions)
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
    // Get the next version number for this edition/date
    const versionResult = await sql`
      SELECT COALESCE(MAX(version), 0) + 1 as next_version
      FROM digests
      WHERE edition = ${data.edition} AND date = ${date}
    `
    const nextVersion = versionResult[0]?.next_version || 1

    // Deactivate any currently active digest for this edition/date
    await sql`
      UPDATE digests
      SET is_active = false
      WHERE edition = ${data.edition}
        AND date = ${date}
        AND is_active = true
    `

    // Insert the new digest as active
    const result = await sql`
      INSERT INTO digests (edition, date, summary, content, data_snapshot, generation_time_ms, is_active, version)
      VALUES (
        ${data.edition},
        ${date},
        ${data.summary},
        ${data.content},
        ${data.dataSnapshot ? JSON.stringify(data.dataSnapshot) : null},
        ${data.generationTimeMs},
        true,
        ${nextVersion}
      )
      RETURNING
        id,
        edition,
        date,
        summary,
        content,
        data_snapshot as "dataSnapshot",
        generation_time_ms as "generationTimeMs",
        created_at as "createdAt",
        is_active as "isActive",
        version
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
      createdAt: result[0].createdAt,
      isActive: result[0].isActive ?? true,
      version: result[0].version ?? 1
    } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to save digest:', error)
    return null
  }
}

/**
 * Get today's ACTIVE digest for a specific edition
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
        created_at as "createdAt",
        is_active as "isActive",
        version
      FROM digests
      WHERE edition = ${edition}
        AND date = ${date}
        AND is_active = true
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      ...row,
      summary: row.summary || '',
      isActive: row.isActive ?? true,
      version: row.version ?? 1
    } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to get today\'s digest:', error)
    return null
  }
}

/**
 * Get ALL versions of today's digests for a specific edition (for admin)
 */
export async function getTodaysDigestVersions(
  edition: DigestEdition
): Promise<Digest[]> {
  if (!isDatabaseConfigured()) return []

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
        created_at as "createdAt",
        is_active as "isActive",
        version
      FROM digests
      WHERE edition = ${edition}
        AND date = ${date}
      ORDER BY version DESC
    `

    return result.map(row => ({
      ...row,
      summary: row.summary || '',
      isActive: row.isActive ?? false,
      version: row.version ?? 1
    })) as Digest[]
  } catch (error) {
    console.error('[Digest DB] Failed to get today\'s digest versions:', error)
    return []
  }
}

/**
 * Get the latest ACTIVE digest (most recent, any edition)
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
        created_at as "createdAt",
        is_active as "isActive",
        version
      FROM digests
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      ...row,
      summary: row.summary || '',
      isActive: row.isActive ?? true,
      version: row.version ?? 1
    } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to get latest digest:', error)
    return null
  }
}

/**
 * Get recent digests (for history view) - returns ALL versions, with active ones first
 */
export async function getRecentDigests(
  limit: number = 14,
  activeOnly: boolean = false
): Promise<Digest[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = activeOnly
      ? await sql`
          SELECT
            id,
            edition,
            date,
            summary,
            content,
            data_snapshot as "dataSnapshot",
            generation_time_ms as "generationTimeMs",
            created_at as "createdAt",
            is_active as "isActive",
            version
          FROM digests
          WHERE is_active = true
          ORDER BY date DESC,
            CASE edition
              WHEN 'evening' THEN 1
              WHEN 'midday' THEN 2
              WHEN 'morning' THEN 3
            END
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            id,
            edition,
            date,
            summary,
            content,
            data_snapshot as "dataSnapshot",
            generation_time_ms as "generationTimeMs",
            created_at as "createdAt",
            is_active as "isActive",
            version
          FROM digests
          ORDER BY date DESC,
            CASE edition
              WHEN 'evening' THEN 1
              WHEN 'midday' THEN 2
              WHEN 'morning' THEN 3
            END,
            is_active DESC,
            version DESC
          LIMIT ${limit}
        `

    return result.map(row => ({
      ...row,
      summary: row.summary || '',
      isActive: row.isActive ?? true,
      version: row.version ?? 1
    })) as Digest[]
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
        created_at as "createdAt",
        is_active as "isActive",
        version
      FROM digests
      WHERE id = ${digestId}::uuid
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      ...row,
      summary: row.summary || '',
      isActive: row.isActive ?? true,
      version: row.version ?? 1
    } as Digest
  } catch (error) {
    console.error('[Digest DB] Failed to get digest by ID:', error)
    return null
  }
}

/**
 * Set a specific digest as the active one for its edition/date
 * Deactivates all other versions for that edition/date
 */
export async function setActiveDigest(
  digestId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    // First, get the digest to know its edition and date
    const digest = await getDigestById(digestId)
    if (!digest) return false

    // Deactivate all digests for this edition/date
    await sql`
      UPDATE digests
      SET is_active = false
      WHERE edition = ${digest.edition}
        AND date = ${digest.date}
    `

    // Activate the specified digest
    await sql`
      UPDATE digests
      SET is_active = true
      WHERE id = ${digestId}::uuid
    `

    return true
  } catch (error) {
    console.error('[Digest DB] Failed to set active digest:', error)
    return false
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
 * Check if an ACTIVE digest exists for today's edition
 */
export async function digestExistsForToday(
  edition: DigestEdition
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  const date = getTodayDate()

  try {
    const result = await sql`
      SELECT 1 FROM digests
      WHERE edition = ${edition}
        AND date = ${date}
        AND is_active = true
      LIMIT 1
    `

    return result.length > 0
  } catch (error) {
    console.error('[Digest DB] Failed to check digest existence:', error)
    return false
  }
}

/**
 * Get all versions for a specific date (for admin history view)
 */
export async function getDigestsByDate(
  date: string
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
        created_at as "createdAt",
        is_active as "isActive",
        version
      FROM digests
      WHERE date = ${date}
      ORDER BY
        CASE edition
          WHEN 'morning' THEN 1
          WHEN 'midday' THEN 2
          WHEN 'evening' THEN 3
        END,
        version DESC
    `

    return result.map(row => ({
      ...row,
      summary: row.summary || '',
      isActive: row.isActive ?? true,
      version: row.version ?? 1
    })) as Digest[]
  } catch (error) {
    console.error('[Digest DB] Failed to get digests by date:', error)
    return []
  }
}
