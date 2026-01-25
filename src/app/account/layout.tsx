import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Settings | Siouxland Online',
  description: 'Manage your Siouxland Online account settings, preferences, and notifications.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
