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

export default function DigestLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
