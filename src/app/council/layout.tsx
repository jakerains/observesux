import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'City Council Recaps | Siouxland Online',
  description: 'AI-generated summaries of Sioux City Council meetings — decisions, votes, and what they mean for the Siouxland community.',
  openGraph: {
    title: 'City Council Recaps | Siouxland Online',
    description: 'AI-generated summaries of Sioux City Council meetings — decisions, votes, and what they mean for the Siouxland community.',
    url: 'https://siouxland.online/council',
    type: 'website',
  },
}

export default function CouncilLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
