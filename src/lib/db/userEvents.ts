import { sql, isDatabaseConfigured } from '../db'
import type { UserEvent, EventCategory, EventSubmissionStatus, UserEventStats } from '@/types'

/**
 * Create a new user-submitted event (starts as pending)
 */
export async function createUserEvent(data: {
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  url?: string
  category: EventCategory
  submittedBy: string
  submittedByEmail?: string
}): Promise<UserEvent | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      INSERT INTO user_events (title, date, start_time, end_time, location, description, url, category, submitted_by, submitted_by_email)
      VALUES (
        ${data.title},
        ${data.date},
        ${data.startTime || null},
        ${data.endTime || null},
        ${data.location || null},
        ${data.description || null},
        ${data.url || null},
        ${data.category},
        ${data.submittedBy},
        ${data.submittedByEmail || null}
      )
      RETURNING
        id, title, date,
        start_time as "startTime",
        end_time as "endTime",
        location, description, url, category, status,
        submitted_by as "submittedBy",
        submitted_by_email as "submittedByEmail",
        admin_notes as "adminNotes",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    return result[0] as UserEvent
  } catch (error) {
    console.error('Failed to create user event:', error)
    return null
  }
}

/**
 * Get approved user events (for public display)
 */
export async function getApprovedUserEvents(): Promise<UserEvent[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        id, title, date,
        start_time as "startTime",
        end_time as "endTime",
        location, description, url, category, status,
        submitted_by as "submittedBy",
        submitted_by_email as "submittedByEmail",
        admin_notes as "adminNotes",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_events
      WHERE status = 'approved'
      ORDER BY date ASC, created_at DESC
    `
    return result as UserEvent[]
  } catch (error) {
    console.error('Failed to get approved user events:', error)
    return []
  }
}

/**
 * Get events submitted by a specific user
 */
export async function getUserSubmissions(userId: string): Promise<UserEvent[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        id, title, date,
        start_time as "startTime",
        end_time as "endTime",
        location, description, url, category, status,
        submitted_by as "submittedBy",
        submitted_by_email as "submittedByEmail",
        admin_notes as "adminNotes",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_events
      WHERE submitted_by = ${userId}
      ORDER BY created_at DESC
    `
    return result as UserEvent[]
  } catch (error) {
    console.error('Failed to get user submissions:', error)
    return []
  }
}

/**
 * Get a single user event by ID
 */
export async function getUserEvent(id: string): Promise<UserEvent | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        id, title, date,
        start_time as "startTime",
        end_time as "endTime",
        location, description, url, category, status,
        submitted_by as "submittedBy",
        submitted_by_email as "submittedByEmail",
        admin_notes as "adminNotes",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_events
      WHERE id = ${id}::uuid
    `
    return (result[0] as UserEvent) || null
  } catch (error) {
    console.error('Failed to get user event:', error)
    return null
  }
}

/**
 * Get all user events with optional filters (admin use)
 */
export async function getAllUserEvents(options?: {
  status?: EventSubmissionStatus
  limit?: number
  offset?: number
}): Promise<UserEvent[]> {
  if (!isDatabaseConfigured()) return []

  const limit = options?.limit || 50
  const offset = options?.offset || 0

  try {
    let result
    if (options?.status) {
      result = await sql`
        SELECT
          id, title, date,
          start_time as "startTime",
          end_time as "endTime",
          location, description, url, category, status,
          submitted_by as "submittedBy",
          submitted_by_email as "submittedByEmail",
          admin_notes as "adminNotes",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM user_events
        WHERE status = ${options.status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT
          id, title, date,
          start_time as "startTime",
          end_time as "endTime",
          location, description, url, category, status,
          submitted_by as "submittedBy",
          submitted_by_email as "submittedByEmail",
          admin_notes as "adminNotes",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM user_events
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    return result as UserEvent[]
  } catch (error) {
    console.error('Failed to get all user events:', error)
    return []
  }
}

/**
 * Update user event status (admin action)
 */
export async function updateUserEventStatus(
  id: string,
  status: EventSubmissionStatus,
  adminNotes?: string
): Promise<UserEvent | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      UPDATE user_events
      SET status = ${status},
          admin_notes = ${adminNotes || null},
          updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING
        id, title, date,
        start_time as "startTime",
        end_time as "endTime",
        location, description, url, category, status,
        submitted_by as "submittedBy",
        submitted_by_email as "submittedByEmail",
        admin_notes as "adminNotes",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    return (result[0] as UserEvent) || null
  } catch (error) {
    console.error('Failed to update user event status:', error)
    return null
  }
}

/**
 * Delete a user event (admin action)
 */
export async function deleteUserEvent(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`DELETE FROM user_events WHERE id = ${id}::uuid`
    return true
  } catch (error) {
    console.error('Failed to delete user event:', error)
    return false
  }
}

/**
 * Get user event statistics
 */
export async function getUserEventStats(): Promise<UserEventStats | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM user_events
    `
    const row = result[0]
    return {
      total: Number(row?.total || 0),
      pending: Number(row?.pending || 0),
      approved: Number(row?.approved || 0),
      rejected: Number(row?.rejected || 0),
    }
  } catch (error) {
    console.error('Failed to get user event stats:', error)
    return null
  }
}
