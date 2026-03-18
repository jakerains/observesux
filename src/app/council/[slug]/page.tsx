import type { Metadata } from 'next'
import { getMeetingBySlug } from '@/lib/db/council-meetings'
import { MEETING_TYPE_LABELS } from '@/types/council-meetings'
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
      'article:section': meeting.meetingType ? MEETING_TYPE_LABELS[meeting.meetingType] : 'City Council',
      'og:locale': 'en_US',
    },
  }
}

export default async function CouncilPostPage({ params }: PageProps) {
  const { slug } = await params
  const meeting = await getMeetingBySlug(slug)

  const articleSchema = meeting?.recap
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: meeting.title,
        description: meeting.recap.summary,
        datePublished: meeting.publishedAt || meeting.createdAt,
        dateModified: meeting.updatedAt,
        author: {
          '@type': 'Organization',
          name: 'SUX - Siouxland AI Assistant',
          url: 'https://siouxland.online',
        },
        publisher: {
          '@id': 'https://siouxland.online/#organization',
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://siouxland.online/council/${slug}`,
        },
      }
    : null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://siouxland.online' },
      { '@type': 'ListItem', position: 2, name: 'Council Recaps', item: 'https://siouxland.online/council' },
      { '@type': 'ListItem', position: 3, name: meeting?.title ?? 'Meeting', item: `https://siouxland.online/council/${slug}` },
    ],
  }

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CouncilPostClient meeting={meeting} />
    </>
  )
}
