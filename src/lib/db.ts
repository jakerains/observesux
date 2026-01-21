import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Helper to check if database is configured
export function isDatabaseConfigured(): boolean {
  const hasDb = !!(process.env.sux_DATABASE_URL || process.env.DATABASE_URL)
  if (!hasDb) {
    console.warn('[DB] No DATABASE_URL configured. sux_DATABASE_URL:', !!process.env.sux_DATABASE_URL, 'DATABASE_URL:', !!process.env.DATABASE_URL)
  }
  return hasDb
}

// Cached SQL client - created lazily on first use
let _sqlClient: NeonQueryFunction<false, false> | null = null

/**
 * Get SQL client - creates connection on first call, reuses thereafter
 * This ensures DATABASE_URL is read at runtime, not module load time
 * Prefers sux_DATABASE_URL (new Neon project) over DATABASE_URL (legacy)
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (!_sqlClient) {
    // Use sux_DATABASE_URL (new auth-enabled project) if available, fall back to DATABASE_URL
    const databaseUrl = process.env.sux_DATABASE_URL || process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    // Log which database we're connecting to (mask password)
    const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@')
    console.log('[DB] Connecting to:', maskedUrl)
    _sqlClient = neon(databaseUrl)
  }
  return _sqlClient
}

/**
 * Tagged template SQL function
 * Usage: await sql`SELECT * FROM users WHERE id = ${userId}`
 */
export const sql: NeonQueryFunction<false, false> = function(
  strings: TemplateStringsArray,
  ...values: unknown[]
) {
  return getSql()(strings, ...values)
} as NeonQueryFunction<false, false>
