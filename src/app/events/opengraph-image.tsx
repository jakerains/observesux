import { fetchCommunityEvents } from '@/lib/fetchers/events'
import { getApprovedUserEvents } from '@/lib/db/userEvents'
import { createSectionOgImage, ogImageContentType, ogImageSize } from '@/lib/og/section-card'

export const runtime = 'edge'
export const size = ogImageSize
export const contentType = ogImageContentType

function formatMetric(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default async function Image() {
  const [scrapedData, userEvents] = await Promise.all([
    fetchCommunityEvents(),
    getApprovedUserEvents(),
  ])

  const allEvents = scrapedData.events.length + userEvents.length
  const sourceNames = new Set(scrapedData.events.map(event => event.source).filter(Boolean))
  if (userEvents.length > 0) {
    sourceNames.add('Community')
  }

  const dynamicMetrics = [
    allEvents > 0 ? formatMetric(allEvents, 'event') : null,
    sourceNames.size > 0 ? formatMetric(sourceNames.size, 'source') : null,
    userEvents.length > 0 ? formatMetric(userEvents.length, 'community post') : null,
  ].filter(Boolean) as string[]

  const metrics = dynamicMetrics.length > 0
    ? [...dynamicMetrics, ...(dynamicMetrics.length < 3 ? ['Fresh weekly'] : [])].slice(0, 3)
    : ['Fresh weekly', 'Community submissions', 'Local calendar']

  return createSectionOgImage({
    eyebrow: 'Community Events',
    title: 'Find What Is Happening in Siouxland',
    date: 'Festivals, shows, and local plans',
    metrics,
    footerPath: 'siouxland.online/events',
    footerNote: 'Across Sioux City and the tri-state',
    imageTopBadge: 'Across Siouxland',
    imagePanelEyebrow: 'Plan something local',
    imagePanelTitle: 'Find what is happening nearby',
    imagePanelBody: 'Concerts, festivals, family activities, and community gatherings across the tri-state.',
  })
}
