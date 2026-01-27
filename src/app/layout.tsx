import type { Metadata } from "next"
import { Inter, Source_Serif_4, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatProvider } from "@/lib/contexts/ChatContext"
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui"
import { authClient } from "@/lib/auth/client"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import "./globals.css"

// Inter - clean, highly readable for body text and UI
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

// Source Serif 4 - sturdy, trustworthy serif for headings
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
})

// Keep Geist Mono for code/technical content
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://siouxland.online'),
  title: "Siouxland.Online | Your Community Dashboard",
  description: "Stay connected to Sioux City with live weather, traffic cameras, local news, AI-powered daily digests, river levels, and more. Your free community dashboard for the Siouxland region.",
  keywords: ["Sioux City", "Iowa", "Siouxland", "traffic", "weather", "dashboard", "local news", "real-time", "traffic cameras", "weather forecast", "river levels", "air quality", "community", "daily digest"],
  authors: [{ name: "Siouxland.Online" }],
  creator: "Siouxland.Online",
  publisher: "Siouxland.Online",
  robots: {
    index: true,
    follow: true,
  },
  applicationName: "Siouxland.Online",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Siouxland",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Siouxland.Online - Your Community Dashboard",
    description: "Stay connected to Sioux City with live weather, traffic cameras, local news, and AI-powered daily digests. Free real-time updates for the Siouxland region.",
    url: "https://siouxland.online",
    siteName: "Siouxland.Online",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-screenshot.png",
        width: 1200,
        height: 630,
        alt: "Siouxland.Online Dashboard - Live weather and community updates for Sioux City",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Siouxland.Online - Your Community Dashboard",
    description: "Stay connected to Sioux City with live weather, traffic cameras, local news, and AI-powered daily digests. Free real-time updates for the Siouxland region.",
    images: ["/og-screenshot.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/icon-512x512.png", color: "#0f172a" },
    ],
  },
  other: {
    "theme-color": "#0f172a",
    "mobile-web-app-capable": "yes",
  },
}

// JSON-LD Structured Data for SEO
function JsonLdSchema() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://siouxland.online/#website',
        url: 'https://siouxland.online',
        name: 'Siouxland Online',
        description: 'Real-time observability dashboard for Sioux City, Iowa',
        publisher: { '@id': 'https://siouxland.online/#organization' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://siouxland.online/#organization',
        name: 'Siouxland Online',
        url: 'https://siouxland.online',
        logo: {
          '@type': 'ImageObject',
          url: 'https://siouxland.online/icons/icon-512x512.png',
          width: 512,
          height: 512,
        },
        sameAs: ['https://github.com/jakerains/siouxland-online'],
      },
      {
        '@type': 'LocalBusiness',
        '@id': 'https://siouxland.online/#localbusiness',
        name: 'Siouxland Online',
        description:
          'Real-time community dashboard providing weather, traffic, news, and local information for the Siouxland region.',
        url: 'https://siouxland.online',
        areaServed: {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: 42.4997,
            longitude: -96.4003,
          },
          geoRadius: '80467', // 50 miles in meters
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Sioux City',
          addressRegion: 'IA',
          addressCountry: 'US',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 42.4997,
          longitude: -96.4003,
        },
        knowsAbout: [
          'Weather',
          'Traffic',
          'Local News',
          'Air Quality',
          'River Levels',
          'Transit',
          'Aviation',
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLdSchema />
      </head>
      <body
        className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <NeonAuthUIProvider authClient={authClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <ChatProvider>
              {children}
              <InstallPrompt />
            </ChatProvider>
          </ThemeProvider>
        </NeonAuthUIProvider>
        <Analytics />
      </body>
    </html>
  )
}
