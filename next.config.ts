import type { NextConfig } from "next"

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
}

export default nextConfig
