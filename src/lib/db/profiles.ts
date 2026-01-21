import { sql, isDatabaseConfigured } from '../db'

/**
 * User profile database operations
 * Stores additional user info beyond Neon Auth's base user table
 */

export interface UserProfile {
  userId: string
  firstName: string | null
  lastName: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        user_id as "userId",
        first_name as "firstName",
        last_name as "lastName",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_profiles
      WHERE user_id = ${userId}
    `
    return (result[0] as UserProfile) || null
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}

/**
 * Create or update user profile (upsert)
 */
export async function upsertUserProfile(
  userId: string,
  data: { firstName?: string | null; lastName?: string | null }
): Promise<UserProfile | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      INSERT INTO user_profiles (user_id, first_name, last_name)
      VALUES (${userId}, ${data.firstName ?? null}, ${data.lastName ?? null})
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
        updated_at = NOW()
      RETURNING
        user_id as "userId",
        first_name as "firstName",
        last_name as "lastName",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    return (result[0] as UserProfile) || null
  } catch (error) {
    console.error('Failed to upsert user profile:', error)
    return null
  }
}

/**
 * Delete user profile
 */
export async function deleteUserProfile(userId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`DELETE FROM user_profiles WHERE user_id = ${userId}`
    return true
  } catch (error) {
    console.error('Failed to delete user profile:', error)
    return false
  }
}

/**
 * Get display name for user (combines first/last name or falls back to email prefix)
 */
export function getDisplayName(profile: UserProfile | null, email?: string): string {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName} ${profile.lastName}`
  }
  if (profile?.firstName) {
    return profile.firstName
  }
  if (email) {
    return email.split('@')[0]
  }
  return 'User'
}
