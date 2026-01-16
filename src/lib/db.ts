import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Create the SQL query function using Neon serverless driver
// This automatically handles connection pooling for serverless environments
export const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL || '')

// Helper to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
}

// Example usage with tagged template literals:
// const result = await sql`SELECT * FROM users WHERE id = ${userId}`
//
// For dynamic queries, use the sql.unsafe() method or construct
// tagged templates programmatically
