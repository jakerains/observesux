import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Community Events | Siouxland Online',
  description: 'Upcoming events in Sioux City and the Siouxland tri-state area — festivals, city events, community gatherings, and more.',
  openGraph: {
    title: 'Community Events | Siouxland Online',
    description: 'Upcoming events in Sioux City and the Siouxland tri-state area — festivals, city events, community gatherings, and more.',
    url: 'https://siouxland.online/events',
    type: 'website',
  },
}

function EventsJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://siouxland.online/events',
    name: 'Community Events | Siouxland Online',
    description: 'Upcoming events in Sioux City and the Siouxland tri-state area — festivals, city events, community gatherings, and more.',
    url: 'https://siouxland.online/events',
    isPartOf: { '@id': 'https://siouxland.online/#website' },
    about: {
      '@type': 'City',
      name: 'Sioux City',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sioux City',
        addressRegion: 'IA',
        addressCountry: 'US',
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://siouxland.online',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Community Events',
          item: 'https://siouxland.online/events',
        },
      ],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default function EventsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EventsJsonLd />
      {children}
    </>
  )
}
