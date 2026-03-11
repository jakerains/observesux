import { getLatestDigest } from '@/lib/db/digest'
import { editionLabels } from '@/lib/digest/types'
import { createSectionOgImage, ogImageContentType, ogImageSize } from '@/lib/og/section-card'

export const runtime = 'edge'
export const size = ogImageSize
export const contentType = ogImageContentType

function formatDigestDate(date: string | Date | null) {
  if (!date) return null

  const normalizedDate = date instanceof Date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : date

  return new Date(`${normalizedDate}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  })
}

function formatMetric(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default async function Image() {
  const latestDigest = await getLatestDigest()
  const editionLabel = latestDigest ? editionLabels[latestDigest.edition] : null

  const contentMetrics = latestDigest?.dataSnapshot
    ? [
        { count: latestDigest.dataSnapshot.news.length, label: formatMetric(latestDigest.dataSnapshot.news.length, 'story', 'stories') },
        { count: latestDigest.dataSnapshot.events.length, label: formatMetric(latestDigest.dataSnapshot.events.length, 'event') },
        { count: latestDigest.dataSnapshot.weather.alerts.length, label: formatMetric(latestDigest.dataSnapshot.weather.alerts.length, 'alert') },
      ]
        .filter(metric => metric.count > 0)
        .map(metric => metric.label)
    : []

  const metrics = editionLabel
    ? [editionLabel, ...contentMetrics].slice(0, 3)
    : contentMetrics.length > 0
      ? contentMetrics
      : ['Morning Edition', 'Midday Update', 'Evening Edition']

  return createSectionOgImage({
    eyebrow: 'Siouxland Daily Digest',
    title: 'What You Need to Know, Siouxland',
    date: formatDigestDate(latestDigest?.date ?? null),
    metrics,
    footerPath: 'siouxland.online/digest',
    footerNote: 'Weather, traffic, news, and local context',
    imageTopBadge: 'Generated daily',
    imagePanelEyebrow: editionLabel ?? 'Daily briefing',
    imagePanelTitle: 'What you need to know',
    imagePanelBody: 'A quick Siouxland briefing on weather, traffic, local news, and community signals.',
  })
}
