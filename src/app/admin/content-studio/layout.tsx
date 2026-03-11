import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content Studio | Admin | Siouxland Online',
  robots: { index: false },
}

export default function ContentStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
