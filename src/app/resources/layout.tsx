import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sioux City Resources | Siouxland Online',
  description: 'Local resources for Sioux City and Siouxland — government services, parks, education, dining, healthcare, and community organizations.',
  openGraph: {
    title: 'Sioux City Resources | Siouxland Online',
    description: 'Your guide to local resources in the Siouxland tri-state area.',
    url: 'https://siouxland.online/resources',
    type: 'website',
  },
}

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children
}
