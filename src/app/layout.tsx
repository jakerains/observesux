import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://observesux.vercel.app'),
  title: "Sioux City Observatory | Real-Time Dashboard",
  description: "Real-time observability dashboard for Sioux City, Iowa - Traffic cameras, weather, river levels, air quality, and more.",
  keywords: ["Sioux City", "Iowa", "traffic", "weather", "dashboard", "observability", "real-time", "traffic cameras", "weather forecast", "river levels", "air quality"],
  authors: [{ name: "ObserveSUX" }],
  creator: "ObserveSUX",
  publisher: "ObserveSUX",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Sioux City Observatory",
    description: "Real-time observability dashboard for Sioux City, Iowa - Traffic cameras, weather, river levels, air quality, and more.",
    url: "https://observesux.vercel.app",
    siteName: "Sioux City Observatory",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sioux City Observatory",
    description: "Real-time observability dashboard for Sioux City, Iowa - Traffic cameras, weather, river levels, air quality, and more.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  other: {
    "theme-color": "#0f172a",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
