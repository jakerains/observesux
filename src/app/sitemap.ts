import type { MetadataRoute } from 'next'
import { getRecentMeetingRecaps } from '@/lib/db/council-meetings'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://siouxland.online'

  const meetings = await getRecentMeetingRecaps(200)

  const councilEntries: MetadataRoute.Sitemap = meetings
    .filter(m => m.meetingDate)
    .map(m => ({
      url: `${baseUrl}/council/${m.meetingDate}`,
      lastModified: new Date(m.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/council`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/digest`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...councilEntries,
  ]
}
