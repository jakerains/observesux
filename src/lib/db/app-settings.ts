import { sql, isDatabaseConfigured } from '../db'

/**
 * App Settings — key-value store for runtime configuration.
 * Table auto-creates on first access if it doesn't exist.
 */

let tableEnsured = false

async function ensureTable() {
  if (tableEnsured) return
  if (!isDatabaseConfigured()) return

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    tableEnsured = true
  } catch (error) {
    console.error('[AppSettings] Failed to ensure table:', error)
  }
}

/**
 * Get a single setting by key
 */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  if (!isDatabaseConfigured()) return null

  try {
    await ensureTable()
    const result = await sql`
      SELECT value FROM app_settings WHERE key = ${key}
    `
    if (result.length === 0) return null
    return result[0].value as T
  } catch (error) {
    console.error(`[AppSettings] Failed to get setting "${key}":`, error)
    return null
  }
}

/**
 * Set a setting (upsert)
 */
export async function setSetting(key: string, value: unknown): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await ensureTable()
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = ${JSON.stringify(value)}::jsonb, updated_at = NOW()
    `
    return true
  } catch (error) {
    console.error(`[AppSettings] Failed to set setting "${key}":`, error)
    return false
  }
}

/**
 * Get all settings, optionally filtered by key prefix
 */
export async function getSettings(prefix?: string): Promise<Record<string, unknown>> {
  if (!isDatabaseConfigured()) return {}

  try {
    await ensureTable()
    const result = prefix
      ? await sql`
          SELECT key, value FROM app_settings WHERE key LIKE ${prefix + '%'}
          ORDER BY key
        `
      : await sql`
          SELECT key, value FROM app_settings ORDER BY key
        `

    const settings: Record<string, unknown> = {}
    for (const row of result) {
      settings[row.key] = row.value
    }
    return settings
  } catch (error) {
    console.error('[AppSettings] Failed to get settings:', error)
    return {}
  }
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await ensureTable()
    await sql`DELETE FROM app_settings WHERE key = ${key}`
    return true
  } catch (error) {
    console.error(`[AppSettings] Failed to delete setting "${key}":`, error)
    return false
  }
}
