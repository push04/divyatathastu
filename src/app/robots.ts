import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/api', '/settings', '/mailbox'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://divyatathastu.com'}/sitemap.xml`,
  }
}
