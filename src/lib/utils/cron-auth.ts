import { NextRequest } from 'next/server'

/**
 * Verify a request is authorized to run a cron job.
 *
 * Accepts requests from:
 * 1. Vercel Cron (x-vercel-cron header)
 * 2. Manual testing with CRON_SECRET Bearer token
 * 3. Local development
 */
export function verifyCronRequest(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  const isDev = process.env.NODE_ENV === 'development'

  return isVercelCron || hasValidSecret || isDev
}
