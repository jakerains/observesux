import { ImageResponse } from 'next/og'
import { getMeetingBySlug } from '@/lib/db/council-meetings'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meeting = await getMeetingBySlug(slug)

  const title = meeting?.title ?? 'City Council Meeting'
  const date = meeting?.meetingDate
    ? new Date(meeting.meetingDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Chicago',
      })
    : null

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          padding: '60px',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>
            SIOUXLAND ONLINE
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {date && (
            <p style={{ color: '#6366f1', fontSize: '20px', fontWeight: 600, margin: 0 }}>
              {date}
            </p>
          )}
          <p style={{ color: '#64748b', fontSize: '18px', margin: 0 }}>
            City Council Recap
          </p>
          <h1
            style={{
              color: '#f1f5f9',
              fontSize: title.length > 60 ? '40px' : '52px',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Footer */}
        <p style={{ color: '#475569', fontSize: '18px', margin: 0 }}>
          siouxland.online/council
        </p>
      </div>
    ),
    { ...size }
  )
}
