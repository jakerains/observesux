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

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
