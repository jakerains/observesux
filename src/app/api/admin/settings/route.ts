import { NextResponse } from 'next/server'
import { isAdminWithUser } from '@/lib/auth/server'
import { getSettings, setSetting } from '@/lib/db/app-settings'

export const runtime = 'nodejs'

// GET: returns all model settings
export async function GET() {
  const { isAdmin } = await isAdminWithUser()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const settings = await getSettings('model:')
  return NextResponse.json(settings)
}

// POST: upserts a setting { key, value }
export async function POST(req: Request) {
  const { isAdmin } = await isAdminWithUser()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { key, value } = body

  if (!key || typeof key !== 'string' || !key.startsWith('model:')) {
    return NextResponse.json({ error: 'Invalid key — must start with "model:"' }, { status: 400 })
  }

  const success = await setSetting(key, value)
  if (!success) {
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
