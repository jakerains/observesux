import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { getCurrentUserFromRequest } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

interface UserPreferences {
  userId: string
  widgetSettings: Record<string, unknown>
  theme: string
  updatedAt: string
}

/**
 * GET /api/user/preferences
 * Get user preferences
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      SELECT
        user_id as "userId",
        widget_settings as "widgetSettings",
        theme,
        updated_at as "updatedAt"
      FROM user_preferences
      WHERE user_id = ${user.id}
    `

    if (result.length === 0) {
      // Return defaults if no preferences saved
      return NextResponse.json({
        preferences: {
          userId: user.id,
          widgetSettings: {},
          theme: 'system',
          updatedAt: null
        }
      })
    }

    return NextResponse.json({
      preferences: result[0] as UserPreferences
    })
  } catch (error) {
    console.error('Failed to get preferences:', error)
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/preferences
 * Update user preferences
 */
export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { widgetSettings, theme } = body

    // Validate theme if provided
    const validThemes = ['light', 'dark', 'system']
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme. Must be light, dark, or system' },
        { status: 400 }
      )
    }

    // Upsert preferences
    const result = await sql`
      INSERT INTO user_preferences (user_id, widget_settings, theme)
      VALUES (
        ${user.id},
        ${JSON.stringify(widgetSettings || {})},
        ${theme || 'system'}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        widget_settings = COALESCE(
          ${widgetSettings ? JSON.stringify(widgetSettings) : null},
          user_preferences.widget_settings
        ),
        theme = COALESCE(${theme || null}, user_preferences.theme),
        updated_at = NOW()
      RETURNING
        user_id as "userId",
        widget_settings as "widgetSettings",
        theme,
        updated_at as "updatedAt"
    `

    return NextResponse.json({
      success: true,
      preferences: result[0] as UserPreferences
    })
  } catch (error) {
    console.error('Failed to update preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/preferences
 * Partial update (merge with existing)
 */
export async function PATCH(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { widgetSettings, theme } = body

    // Get existing preferences
    const existing = await sql`
      SELECT widget_settings
      FROM user_preferences
      WHERE user_id = ${user.id}
    `

    // Merge widget settings if provided
    let mergedSettings = existing[0]?.widget_settings || {}
    if (widgetSettings) {
      mergedSettings = {
        ...mergedSettings,
        ...widgetSettings
      }
    }

    // Upsert with merged settings
    const result = await sql`
      INSERT INTO user_preferences (user_id, widget_settings, theme)
      VALUES (
        ${user.id},
        ${JSON.stringify(mergedSettings)},
        ${theme || 'system'}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        widget_settings = ${JSON.stringify(mergedSettings)},
        theme = COALESCE(${theme || null}, user_preferences.theme),
        updated_at = NOW()
      RETURNING
        user_id as "userId",
        widget_settings as "widgetSettings",
        theme,
        updated_at as "updatedAt"
    `

    return NextResponse.json({
      success: true,
      preferences: result[0] as UserPreferences
    })
  } catch (error) {
    console.error('Failed to patch preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
