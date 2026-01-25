import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | Siouxland Online',
  description: 'Sign in or create an account to access your personalized Siouxland Online dashboard with alerts and favorites.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
