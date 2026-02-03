import type { Metadata } from 'next'
import { getMeetingBySlug } from '@/lib/db/council-meetings'
import { CouncilPostClient } from './CouncilPostClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const meeting = await getMeetingBySlug(slug)

  if (!meeting || !meeting.recap) {
    return {
      title: 'Meeting Not Found | Siouxland Online',
      description: 'This council meeting recap could not be found.',
    }
  }

  const formattedDate = meeting.meetingDate
    ? new Date(meeting.meetingDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Chicago',
      })
    : 'Recent Meeting'

  const title = `${meeting.title} | Siouxland Online`
  const description = meeting.recap.summary

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: meeting.createdAt,
      modifiedTime: meeting.updatedAt,
      authors: ['SUX - Siouxland AI Assistant'],
      siteName: 'Siouxland Online',
      locale: 'en_US',
      url: `https://siouxland.online/council/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    other: {
      'article:published_time': meeting.createdAt,
      'article:modified_time': meeting.updatedAt,
      'article:section': 'City Council',
      'og:locale': 'en_US',
    },
  }
}

export default async function CouncilPostPage({ params }: PageProps) {
  const { slug } = await params
  const meeting = await getMeetingBySlug(slug)

  return <CouncilPostClient meeting={meeting} />
}
