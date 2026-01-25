import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account/', '/admin'],
      },
    ],
    sitemap: 'https://siouxland.online/sitemap.xml',
  }
}
