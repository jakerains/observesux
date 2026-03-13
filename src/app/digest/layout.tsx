import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Siouxland Daily Digest | Siouxland Online',
  description: "Your morning, midday, and evening briefing on what's happening in Sioux City — weather, traffic, local news, and more from SUX.",
  openGraph: {
    title: 'Siouxland Daily Digest | Siouxland Online',
    description: "Your morning, midday, and evening briefing on Sioux City — weather, traffic, local news, and more.",
    url: 'https://siouxland.online/digest',
    type: 'website',
  },
}

function DigestJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://siouxland.online/digest',
    name: 'Siouxland Daily Digest',
    description: "Your morning, midday, and evening briefing on what's happening in Sioux City — weather, traffic, local news, and more from SUX.",
    url: 'https://siouxland.online/digest',
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
    publisher: { '@id': 'https://siouxland.online/#organization' },
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
          name: 'Daily Digest',
          item: 'https://siouxland.online/digest',
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

export default function DigestLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DigestJsonLd />
      {children}
    </>
  )
}
