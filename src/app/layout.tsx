import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const SITE_URL = 'https://www.mahatathastu.com'

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'MahaTathastu',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
      description: "India's first comprehensive holistic life platform combining Vedic astrology, numerology, Vastu, chakra science, and Ayurveda.",
      telephone: '+91-9858784784',
      email: 'support@mahatathastu.com',
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'MahaTathastu',
      description: '14 personalized holistic life reports for your family - Vedic astrology, numerology, chakra, Vastu, Prakriti.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-IN',
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MahaTathastu - India's First 360° Holistic Life Reports",
    template: '%s | MahaTathastu',
  },
  description: "Get personalized Vedic astrology, numerology, chakra, Vastu, Prakriti, DMIT & psychology reports for your entire family. India's most comprehensive spiritual wellness platform.",
  keywords: ['Vedic astrology', 'Kundli online', 'numerology report', 'chakra analysis', 'Vastu report', 'DMIT test', 'family horoscope', 'mandir near me'],
  authors: [{ name: 'MahaTathastu' }],
  creator: 'MahaTathastu',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'MahaTathastu',
    title: 'MahaTathastu - 360° Holistic Life Report Platform',
    description: '14 personalized reports combining Vedic astrology, numerology, chakra, Vastu & Ayurveda for your family.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MahaTathastu - 360° Holistic Life Reports',
    description: '14 personalized holistic life reports for your family.',
  },
  robots: { index: true, follow: true },
  verification: { google: 'i2XgNN0Y2xc_4i7WgtyHGITi_AH42OXW-314j1v232k' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }} />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--indigo-deep)',
              color: 'var(--kutch-white)',
              border: '1px solid var(--plum-light)',
            },
          }}
        />
      </body>
    </html>
  )
}
