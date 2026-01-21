import { sql, isDatabaseConfigured } from '../db'

/**
 * User management database operations for admin panel
 * Note: User data is in neon_auth.user schema (managed by Neon Auth)
 */

export interface AdminUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string | null
  emailVerified: boolean
  createdAt: string
  // Activity stats (from our app tables)
  alertCount: number
  watchlistCount: number
  pushCount: number
  chatCount: number
}

export interface UserActivity {
  alerts: Array<{
    id: string
    alertType: string
    enabled: boolean
    createdAt: string
  }>
  watchlist: Array<{
    id: string
    itemType: string
    itemId: string
    itemName: string | null
    createdAt: string
  }>
  pushSubscriptions: Array<{
    id: string
    createdAt: string
  }>
  chatSessions: Array<{
    id: string
    startedAt: string
    messageCount: number
  }>
}

export interface ListUsersOptions {
  search?: string
  role?: 'admin' | 'user' | null
  limit?: number
  offset?: number
}

export interface ListUsersResult {
  users: AdminUser[]
  total: number
}

/**
 * List users with pagination, search, and role filtering
 */
export async function listUsers(options: ListUsersOptions = {}): Promise<ListUsersResult> {
  if (!isDatabaseConfigured()) {
    return { users: [], total: 0 }
  }

  const { search, role, limit = 20, offset = 0 } = options

  try {
    // Build search condition
    const searchCondition = search
      ? `AND (u.email ILIKE '%' || $3 || '%' OR u.name ILIKE '%' || $3 || '%')`
      : ''

    // Build role condition
    const roleCondition = role
      ? `AND u.role = $4`
      : ''

    // Get total count first
    const countParams = [search, role].filter(Boolean)
    let countQuery = `
      SELECT COUNT(*)::int as total
      FROM neon_auth.user u
      WHERE 1=1
    `
    if (search) countQuery += ` AND (u.email ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%')`
    if (role) countQuery += ` AND u.role = $${search ? 2 : 1}`

    // Execute count query dynamically
    let totalCount = 0
    if (!search && !role) {
      const countResult = await sql`SELECT COUNT(*)::int as total FROM neon_auth.user`
      totalCount = countResult[0]?.total || 0
    } else if (search && !role) {
      const countResult = await sql`
        SELECT COUNT(*)::int as total FROM neon_auth.user u
        WHERE (u.email ILIKE '%' || ${search} || '%' OR u.name ILIKE '%' || ${search} || '%')
      `
      totalCount = countResult[0]?.total || 0
    } else if (!search && role) {
      const countResult = await sql`
        SELECT COUNT(*)::int as total FROM neon_auth.user u WHERE u.role = ${role}
      `
      totalCount = countResult[0]?.total || 0
    } else {
      const countResult = await sql`
        SELECT COUNT(*)::int as total FROM neon_auth.user u
        WHERE (u.email ILIKE '%' || ${search} || '%' OR u.name ILIKE '%' || ${search} || '%')
          AND u.role = ${role}
      `
      totalCount = countResult[0]?.total || 0
    }

    // Get users with activity counts using LEFT JOINs
    let users: AdminUser[] = []

    if (!search && !role) {
      const result = await sql`
        SELECT
          u.id,
          u.email,
          u.name,
          u.image,
          u.role,
          u.email_verified as "emailVerified",
          u.created_at as "createdAt",
          COALESCE(alert_counts.count, 0)::int as "alertCount",
          COALESCE(watchlist_counts.count, 0)::int as "watchlistCount",
          COALESCE(push_counts.count, 0)::int as "pushCount",
          COALESCE(chat_counts.count, 0)::int as "chatCount"
        FROM neon_auth.user u
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM alert_subscriptions
          GROUP BY user_id
        ) alert_counts ON u.id = alert_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM watchlist_items
          GROUP BY user_id
        ) watchlist_counts ON u.id = watchlist_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM push_subscriptions
          GROUP BY user_id
        ) push_counts ON u.id = push_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM chat_sessions
          GROUP BY user_id
        ) chat_counts ON u.id = chat_counts.user_id
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      users = result as AdminUser[]
    } else if (search && !role) {
      const result = await sql`
        SELECT
          u.id,
          u.email,
          u.name,
          u.image,
          u.role,
          u.email_verified as "emailVerified",
          u.created_at as "createdAt",
          COALESCE(alert_counts.count, 0)::int as "alertCount",
          COALESCE(watchlist_counts.count, 0)::int as "watchlistCount",
          COALESCE(push_counts.count, 0)::int as "pushCount",
          COALESCE(chat_counts.count, 0)::int as "chatCount"
        FROM neon_auth.user u
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM alert_subscriptions
          GROUP BY user_id
        ) alert_counts ON u.id = alert_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM watchlist_items
          GROUP BY user_id
        ) watchlist_counts ON u.id = watchlist_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM push_subscriptions
          GROUP BY user_id
        ) push_counts ON u.id = push_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM chat_sessions
          GROUP BY user_id
        ) chat_counts ON u.id = chat_counts.user_id
        WHERE (u.email ILIKE '%' || ${search} || '%' OR u.name ILIKE '%' || ${search} || '%')
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      users = result as AdminUser[]
    } else if (!search && role) {
      const result = await sql`
        SELECT
          u.id,
          u.email,
          u.name,
          u.image,
          u.role,
          u.email_verified as "emailVerified",
          u.created_at as "createdAt",
          COALESCE(alert_counts.count, 0)::int as "alertCount",
          COALESCE(watchlist_counts.count, 0)::int as "watchlistCount",
          COALESCE(push_counts.count, 0)::int as "pushCount",
          COALESCE(chat_counts.count, 0)::int as "chatCount"
        FROM neon_auth.user u
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM alert_subscriptions
          GROUP BY user_id
        ) alert_counts ON u.id = alert_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM watchlist_items
          GROUP BY user_id
        ) watchlist_counts ON u.id = watchlist_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM push_subscriptions
          GROUP BY user_id
        ) push_counts ON u.id = push_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM chat_sessions
          GROUP BY user_id
        ) chat_counts ON u.id = chat_counts.user_id
        WHERE u.role = ${role}
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      users = result as AdminUser[]
    } else {
      const result = await sql`
        SELECT
          u.id,
          u.email,
          u.name,
          u.image,
          u.role,
          u.email_verified as "emailVerified",
          u.created_at as "createdAt",
          COALESCE(alert_counts.count, 0)::int as "alertCount",
          COALESCE(watchlist_counts.count, 0)::int as "watchlistCount",
          COALESCE(push_counts.count, 0)::int as "pushCount",
          COALESCE(chat_counts.count, 0)::int as "chatCount"
        FROM neon_auth.user u
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM alert_subscriptions
          GROUP BY user_id
        ) alert_counts ON u.id = alert_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM watchlist_items
          GROUP BY user_id
        ) watchlist_counts ON u.id = watchlist_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM push_subscriptions
          GROUP BY user_id
        ) push_counts ON u.id = push_counts.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*)::int as count
          FROM chat_sessions
          GROUP BY user_id
        ) chat_counts ON u.id = chat_counts.user_id
        WHERE (u.email ILIKE '%' || ${search} || '%' OR u.name ILIKE '%' || ${search} || '%')
          AND u.role = ${role}
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      users = result as AdminUser[]
    }

    return { users, total: totalCount }
  } catch (error) {
    console.error('Failed to list users:', error)
    return { users: [], total: 0 }
  }
}

/**
 * Get a single user by ID with full details
 */
export async function getUserById(userId: string): Promise<AdminUser | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.image,
        u.role,
        u.email_verified as "emailVerified",
        u.created_at as "createdAt",
        COALESCE(alert_counts.count, 0)::int as "alertCount",
        COALESCE(watchlist_counts.count, 0)::int as "watchlistCount",
        COALESCE(push_counts.count, 0)::int as "pushCount",
        COALESCE(chat_counts.count, 0)::int as "chatCount"
      FROM neon_auth.user u
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as count
        FROM alert_subscriptions
        WHERE user_id = ${userId}
        GROUP BY user_id
      ) alert_counts ON u.id = alert_counts.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as count
        FROM watchlist_items
        WHERE user_id = ${userId}
        GROUP BY user_id
      ) watchlist_counts ON u.id = watchlist_counts.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as count
        FROM push_subscriptions
        WHERE user_id = ${userId}
        GROUP BY user_id
      ) push_counts ON u.id = push_counts.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int as count
        FROM chat_sessions
        WHERE user_id = ${userId}
        GROUP BY user_id
      ) chat_counts ON u.id = chat_counts.user_id
      WHERE u.id = ${userId}
    `
    return (result[0] as AdminUser) || null
  } catch (error) {
    console.error('Failed to get user by ID:', error)
    return null
  }
}

/**
 * Get user activity (alerts, watchlist, push subscriptions, chat sessions)
 */
export async function getUserActivity(userId: string): Promise<UserActivity> {
  if (!isDatabaseConfigured()) {
    return { alerts: [], watchlist: [], pushSubscriptions: [], chatSessions: [] }
  }

  try {
    // Fetch all activity data in parallel
    const [alerts, watchlist, pushSubs, chatSessions] = await Promise.all([
      sql`
        SELECT
          id,
          alert_type as "alertType",
          enabled,
          created_at as "createdAt"
        FROM alert_subscriptions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT
          id,
          item_type as "itemType",
          item_id as "itemId",
          item_name as "itemName",
          created_at as "createdAt"
        FROM watchlist_items
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `,
      sql`
        SELECT
          id,
          created_at as "createdAt"
        FROM push_subscriptions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT
          id,
          started_at as "startedAt",
          message_count as "messageCount"
        FROM chat_sessions
        WHERE user_id = ${userId}
        ORDER BY started_at DESC
        LIMIT 20
      `
    ])

    return {
      alerts: alerts as UserActivity['alerts'],
      watchlist: watchlist as UserActivity['watchlist'],
      pushSubscriptions: pushSubs as UserActivity['pushSubscriptions'],
      chatSessions: chatSessions as UserActivity['chatSessions']
    }
  } catch (error) {
    console.error('Failed to get user activity:', error)
    return { alerts: [], watchlist: [], pushSubscriptions: [], chatSessions: [] }
  }
}

/**
 * Update user role (admin can promote/demote users)
 * Logs the change to system_logs for audit
 */
export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'user',
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isDatabaseConfigured()) {
    return { success: false, error: 'Database not configured' }
  }

  try {
    // Get current user info for audit log
    const userResult = await sql`
      SELECT email, role FROM neon_auth.user WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const oldRole = userResult[0].role
    const userEmail = userResult[0].email

    // Update the role in neon_auth.user
    await sql`
      UPDATE neon_auth.user
      SET role = ${newRole}, updated_at = NOW()
      WHERE id = ${userId}
    `

    // Log the change for audit
    await sql`
      INSERT INTO system_logs (source, level, message, metadata)
      VALUES (
        'admin',
        'info',
        ${`User role changed: ${userEmail} (${oldRole} -> ${newRole})`},
        ${JSON.stringify({
          action: 'role_change',
          targetUserId: userId,
          targetEmail: userEmail,
          oldRole,
          newRole,
          performedBy: adminUserId
        })}
      )
    `

    return { success: true }
  } catch (error) {
    console.error('Failed to update user role:', error)
    return { success: false, error: 'Failed to update role' }
  }
}

/**
 * Delete a user and all associated app data
 * This cascades deletes to: alert_subscriptions, watchlist_items, push_subscriptions, user_preferences
 * Note: Does NOT delete from neon_auth.user - that's managed by Neon Auth
 */
export async function deleteUserAppData(
  userId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string; deletedCounts?: Record<string, number> }> {
  if (!isDatabaseConfigured()) {
    return { success: false, error: 'Database not configured' }
  }

  try {
    // Get user info for audit log
    const userResult = await sql`
      SELECT email, name FROM neon_auth.user WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const userEmail = userResult[0].email
    const userName = userResult[0].name

    // Delete from all app tables and track counts
    const [alertsResult, watchlistResult, pushResult, prefsResult, triggeredResult] = await Promise.all([
      sql`DELETE FROM alert_subscriptions WHERE user_id = ${userId} RETURNING id`,
      sql`DELETE FROM watchlist_items WHERE user_id = ${userId} RETURNING id`,
      sql`DELETE FROM push_subscriptions WHERE user_id = ${userId} RETURNING id`,
      sql`DELETE FROM user_preferences WHERE user_id = ${userId} RETURNING id`,
      sql`DELETE FROM triggered_alerts WHERE user_id = ${userId} RETURNING id`
    ])

    const deletedCounts = {
      alertSubscriptions: alertsResult.length,
      watchlistItems: watchlistResult.length,
      pushSubscriptions: pushResult.length,
      userPreferences: prefsResult.length,
      triggeredAlerts: triggeredResult.length
    }

    // Delete from neon_auth tables (session, account first due to FK)
    await sql`DELETE FROM neon_auth.session WHERE user_id = ${userId}`
    await sql`DELETE FROM neon_auth.account WHERE user_id = ${userId}`

    // Finally delete the user
    await sql`DELETE FROM neon_auth.user WHERE id = ${userId}`

    // Log the deletion for audit
    await sql`
      INSERT INTO system_logs (source, level, message, metadata)
      VALUES (
        'admin',
        'warning',
        ${`User deleted: ${userEmail} (${userName || 'no name'})`},
        ${JSON.stringify({
          action: 'user_deleted',
          deletedUserId: userId,
          deletedEmail: userEmail,
          deletedName: userName,
          deletedCounts,
          performedBy: adminUserId
        })}
      )
    `

    return { success: true, deletedCounts }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}
