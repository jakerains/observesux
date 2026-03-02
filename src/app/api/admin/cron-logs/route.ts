import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { sql, isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return (user as { role?: string }).role === 'admin'
}

/**
 * GET /api/admin/cron-logs
 * Returns cron run history with per-job summary cards.
 *
 * Query params:
 * - job: filter by job_name
 * - limit: default 100, max 200
 * - offset: default 0
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const job = searchParams.get('job') || null
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  try {
    // Latest run per job (summary cards)
    const summary = await sql`
      SELECT DISTINCT ON (job_name)
        id,
        job_name      AS "jobName",
        status,
        started_at    AS "startedAt",
        duration_ms   AS "durationMs",
        result,
        error_message AS "errorMessage"
      FROM cron_runs
      ORDER BY job_name, started_at DESC
    `

    // Paginated run list, optionally filtered by job
    const runs = job
      ? await sql`
          SELECT
            id,
            job_name      AS "jobName",
            status,
            started_at    AS "startedAt",
            duration_ms   AS "durationMs",
            result,
            error_message AS "errorMessage"
          FROM cron_runs
          WHERE job_name = ${job}
          ORDER BY started_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT
            id,
            job_name      AS "jobName",
            status,
            started_at    AS "startedAt",
            duration_ms   AS "durationMs",
            result,
            error_message AS "errorMessage"
          FROM cron_runs
          ORDER BY started_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `

    return NextResponse.json({ runs, summary })
  } catch (error) {
    console.error('[Admin Cron Logs] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch cron logs' }, { status: 500 })
  }
}
