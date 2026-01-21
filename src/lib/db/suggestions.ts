import { sql, isDatabaseConfigured } from '../db'
import type { Suggestion, SuggestionCategory, SuggestionStatus, SuggestionStats } from '@/types'

/**
 * Create a new suggestion
 */
export async function createSuggestion(data: {
  category: SuggestionCategory
  title: string
  description: string
  email?: string
}): Promise<Suggestion | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      INSERT INTO suggestions (category, title, description, email)
      VALUES (
        ${data.category},
        ${data.title},
        ${data.description},
        ${data.email || null}
      )
      RETURNING
        id,
        category,
        title,
        description,
        email,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    return result[0] as Suggestion
  } catch (error) {
    console.error('Failed to create suggestion:', error)
    return null
  }
}

/**
 * Get suggestions with optional filters
 */
export async function getSuggestions(options?: {
  status?: SuggestionStatus
  category?: SuggestionCategory
  limit?: number
  offset?: number
}): Promise<Suggestion[]> {
  if (!isDatabaseConfigured()) return []

  const limit = options?.limit || 50
  const offset = options?.offset || 0

  try {
    let result

    if (options?.status && options?.category) {
      result = await sql`
        SELECT
          id,
          category,
          title,
          description,
          email,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM suggestions
        WHERE status = ${options.status}
          AND category = ${options.category}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (options?.status) {
      result = await sql`
        SELECT
          id,
          category,
          title,
          description,
          email,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM suggestions
        WHERE status = ${options.status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (options?.category) {
      result = await sql`
        SELECT
          id,
          category,
          title,
          description,
          email,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM suggestions
        WHERE category = ${options.category}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT
          id,
          category,
          title,
          description,
          email,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM suggestions
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return result as Suggestion[]
  } catch (error) {
    console.error('Failed to get suggestions:', error)
    return []
  }
}

/**
 * Get a single suggestion by ID
 */
export async function getSuggestion(id: string): Promise<Suggestion | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        id,
        category,
        title,
        description,
        email,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM suggestions
      WHERE id = ${id}::uuid
    `
    return result[0] as Suggestion || null
  } catch (error) {
    console.error('Failed to get suggestion:', error)
    return null
  }
}

/**
 * Update suggestion status
 */
export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus
): Promise<Suggestion | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      UPDATE suggestions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING
        id,
        category,
        title,
        description,
        email,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    return result[0] as Suggestion || null
  } catch (error) {
    console.error('Failed to update suggestion status:', error)
    return null
  }
}

/**
 * Get suggestion statistics by status
 */
export async function getSuggestionStats(): Promise<SuggestionStats | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed,
        COUNT(*) FILTER (WHERE status = 'planned') as planned,
        COUNT(*) FILTER (WHERE status = 'implemented') as implemented,
        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed
      FROM suggestions
    `

    const row = result[0]
    return {
      total: Number(row?.total || 0),
      pending: Number(row?.pending || 0),
      reviewed: Number(row?.reviewed || 0),
      planned: Number(row?.planned || 0),
      implemented: Number(row?.implemented || 0),
      dismissed: Number(row?.dismissed || 0),
    }
  } catch (error) {
    console.error('Failed to get suggestion stats:', error)
    return null
  }
}

/**
 * Delete a suggestion (soft delete could be implemented here)
 */
export async function deleteSuggestion(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      DELETE FROM suggestions
      WHERE id = ${id}::uuid
    `
    return true
  } catch (error) {
    console.error('Failed to delete suggestion:', error)
    return false
  }
}
