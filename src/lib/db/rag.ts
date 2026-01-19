import { sql, isDatabaseConfigured } from '../db'
import type { RagEntry, RagEntryWithSimilarity, CreateRagEntryInput } from '@/types/rag'

/**
 * Map a database row to a RagEntry object
 */
function mapRowToRagEntry(row: Record<string, unknown>): RagEntry {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    category: row.category as string | undefined,
    tags: row.tags as string[] | undefined,
    source: row.source as string | undefined,
    isActive: row.is_active as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }
}

/**
 * Create a new RAG entry with its embedding vector
 */
export async function createRagEntry(input: CreateRagEntryInput): Promise<RagEntry | null> {
  if (!isDatabaseConfigured()) return null

  try {
    // Format embedding as PostgreSQL vector literal
    const embeddingStr = `[${input.embedding.join(',')}]`

    const result = await sql`
      INSERT INTO rag_entries (title, content, embedding, category, tags, source)
      VALUES (
        ${input.title},
        ${input.content},
        ${embeddingStr}::vector,
        ${input.category || null},
        ${input.tags || null},
        ${input.source || null}
      )
      RETURNING id, title, content, category, tags, source, is_active, created_at, updated_at
    `

    if (result.length === 0) return null
    return mapRowToRagEntry(result[0])
  } catch (error) {
    console.error('Error creating RAG entry:', error)
    return null
  }
}

/**
 * Search for RAG entries by semantic similarity using cosine distance
 *
 * @param queryEmbedding - The embedding vector of the search query
 * @param limit - Maximum number of results to return (default: 5)
 * @param minSimilarity - Minimum similarity threshold 0-1 (default: 0.7)
 */
export async function searchRagEntries(
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.7
): Promise<RagEntryWithSimilarity[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const embeddingStr = `[${queryEmbedding.join(',')}]`

    // Using cosine distance operator <=>
    // Similarity = 1 - distance
    const result = await sql`
      SELECT
        id, title, content, category, tags, source,
        is_active, created_at, updated_at,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM rag_entries
      WHERE is_active = true
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${embeddingStr}::vector ASC
      LIMIT ${limit}
    `

    return result.map(row => ({
      ...mapRowToRagEntry(row),
      similarity: row.similarity as number,
    }))
  } catch (error) {
    console.error('Error searching RAG entries:', error)
    return []
  }
}

/**
 * List all RAG entries for the admin interface
 */
export async function listRagEntries(options: {
  includeInactive?: boolean
  limit?: number
  offset?: number
} = {}): Promise<RagEntry[]> {
  if (!isDatabaseConfigured()) return []

  const { includeInactive = false, limit = 50, offset = 0 } = options

  try {
    const result = includeInactive
      ? await sql`
          SELECT id, title, content, category, tags, source, is_active, created_at, updated_at
          FROM rag_entries
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT id, title, content, category, tags, source, is_active, created_at, updated_at
          FROM rag_entries
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `

    return result.map(mapRowToRagEntry)
  } catch (error) {
    console.error('Error listing RAG entries:', error)
    return []
  }
}

/**
 * Get a single RAG entry by ID
 */
export async function getRagEntryById(id: string): Promise<RagEntry | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT id, title, content, category, tags, source, is_active, created_at, updated_at
      FROM rag_entries
      WHERE id = ${id}
    `

    if (result.length === 0) return null
    return mapRowToRagEntry(result[0])
  } catch (error) {
    console.error('Error getting RAG entry:', error)
    return null
  }
}

/**
 * Soft delete a RAG entry by setting is_active to false
 */
export async function deleteRagEntry(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      UPDATE rag_entries
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error('Error deleting RAG entry:', error)
    return false
  }
}

/**
 * Permanently delete a RAG entry (hard delete)
 */
export async function hardDeleteRagEntry(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      DELETE FROM rag_entries
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error('Error hard deleting RAG entry:', error)
    return false
  }
}

/**
 * Get the count of active RAG entries
 */
export async function getRagEntryCount(): Promise<number> {
  if (!isDatabaseConfigured()) return 0

  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM rag_entries WHERE is_active = true
    `
    return parseInt(result[0].count as string, 10)
  } catch (error) {
    console.error('Error counting RAG entries:', error)
    return 0
  }
}

/**
 * Check if a RAG entry with the same title already exists
 */
export async function checkDuplicateByTitle(title: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      SELECT id FROM rag_entries
      WHERE title = ${title} AND is_active = true
      LIMIT 1
    `
    return result.length > 0
  } catch (error) {
    console.error('Error checking duplicate:', error)
    return false
  }
}

/**
 * Check if a RAG entry with similar content already exists (by content hash)
 */
export async function checkDuplicateByContent(content: string): Promise<{ exists: boolean; title?: string }> {
  if (!isDatabaseConfigured()) return { exists: false }

  try {
    // Check first 500 chars of content to detect duplicates
    // This handles slight variations while catching true duplicates
    const contentPrefix = content.slice(0, 500)

    const result = await sql`
      SELECT id, title FROM rag_entries
      WHERE LEFT(content, 500) = ${contentPrefix} AND is_active = true
      LIMIT 1
    `

    if (result.length > 0) {
      return { exists: true, title: result[0].title as string }
    }
    return { exists: false }
  } catch (error) {
    console.error('Error checking duplicate content:', error)
    return { exists: false }
  }
}
