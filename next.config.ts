import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"
import { withWorkflow } from "workflow/next"

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disable in development to prevent caching issues
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  // Optimize package imports to avoid barrel file overhead
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },

  // Allow external images from camera/weather sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iowadotsnapshot.us-east-1.skyvdn.com',
        pathname: '/thumbs/**',
      },
      {
        protocol: 'https',
        hostname: 'webpubcontent.gray.tv',
        pathname: '/ktiv/cameras/**',
      },
      {
        protocol: 'https',
        hostname: 'weathercams.faa.gov',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdnjs.cloudflare.com',
        pathname: '/ajax/libs/leaflet/**',
      },
    ],
  },

  // TypeScript configuration
  typescript: {
    // Allow production builds to complete even with type errors
    // Remove this in production for strict type checking
    ignoreBuildErrors: false,
  },

  // Empty turbopack config to allow dev mode (Serwist is disabled in dev anyway)
  turbopack: {},

  // Security headers for PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
}

export default withWorkflow(withSerwist(nextConfig))
