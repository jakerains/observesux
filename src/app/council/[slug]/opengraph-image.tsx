import { getMeetingBySlug } from '@/lib/db/council-meetings'
import { createSectionOgImage, ogImageContentType, ogImageSize } from '@/lib/og/section-card'

export const runtime = 'edge'
export const size = ogImageSize
export const contentType = ogImageContentType

function formatMeetingDate(date: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!date) return null

  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
    ...options,
  })
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function trimTrailingDate(title: string, trailingDate: string | null) {
  if (!trailingDate) return title

  const trailingDatePattern = new RegExp(`\\s[-–:]?\\s${escapeRegExp(trailingDate)}$`, 'i')
  return title.replace(trailingDatePattern, '').trim() || title
}

function simplifyCouncilTitle(title: string) {
  return title.replace(/^City of Sioux City /i, 'Sioux City ').trim()
}

function formatMetric(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meeting = await getMeetingBySlug(slug)

  const title = meeting?.title ?? 'City Council Meeting'
  const fullDate = formatMeetingDate(meeting?.meetingDate ?? null, { weekday: 'long' })
  const shortDate = formatMeetingDate(meeting?.meetingDate ?? null)
  const displayTitle = simplifyCouncilTitle(trimTrailingDate(title, shortDate))
  const metricCounts = [
    { count: meeting?.recap?.decisions.length ?? 0, label: formatMetric(meeting?.recap?.decisions.length ?? 0, 'decision') },
    { count: meeting?.recap?.topics.length ?? 0, label: formatMetric(meeting?.recap?.topics.length ?? 0, 'topic') },
    { count: meeting?.recap?.publicComments.length ?? 0, label: formatMetric(meeting?.recap?.publicComments.length ?? 0, 'comment') },
  ]
  const metrics = metricCounts.filter(metric => metric.count > 0).map(metric => metric.label)
  const fallbackMetric = !metrics.length ? 'AI summary ready' : null

  return createSectionOgImage(
    {
      eyebrow: 'City Council Recap',
      title: displayTitle,
      date: fullDate,
      metrics,
      fallbackMetric,
      footerPath: 'siouxland.online/council',
      footerNote: 'Decisions, debate, and what changed',
      imageTopBadge: 'Sioux City, Iowa',
      imagePanelEyebrow: 'Council coverage',
      imagePanelTitle: 'What changed at City Hall',
      imagePanelBody: 'Faster context from the official meeting transcript.',
    }
  )
}
