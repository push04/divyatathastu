import { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://divyatathastu.com'

const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { url: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/services', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
  { url: '/login', priority: 0.5, changeFrequency: 'monthly' as const },
  { url: '/register', priority: 0.6, changeFrequency: 'monthly' as const },
]

const BLOG_SLUGS = [
  'what-is-your-life-path-number',
  'understanding-nakshatra',
  'vastu-home-guide',
  'chakra-healing-guide',
  'pradosh-vrat-significance',
  'prakriti-ayurveda',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map(r => ({
      url: `${BASE}${r.url}`,
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...BLOG_SLUGS.map(slug => ({
      url: `${BASE}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
