import type { Metadata } from 'next'
import { DM_Sans, Martel, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/components/i18n/LanguageProvider'
import LanguagePrompt from '@/components/i18n/LanguagePrompt'
import ChatWidget from '@/components/chat/ChatWidget'

/* ── Type system ───────────────────────────────────────────────────────────
   All four families are self-hosted through next/font: no render-blocking
   <link> to fonts.googleapis.com, and each gets a size-adjusted fallback so
   swapping in doesn't shift layout.

   Martel replaces Playfair Display as the display face. It's a Devanagari-
   native serif - sturdy and low-contrast rather than high-contrast "luxury
   editorial" - which both gives the brand a voice of its own and finally sets
   the Sanskrit shlokas in the real typeface instead of a system fallback. */
const martel = Martel({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-martel',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const fontVars = `${martel.variable} ${dmSans.variable} ${sora.variable} ${jetbrains.variable}`

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
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        {/* No font <link>s and no Material Symbols icon font: all four families
            are self-hosted via next/font, and every icon on the site now comes
            from the single in-app <Icon> set (see components/ui/Icon.tsx). */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }} />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider>
          {children}
          <LanguagePrompt />
          <ChatWidget />
        </LanguageProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--surface-dark-raised)',
              color: 'var(--text-on-dark)',
              border: '1px solid var(--border-dark)',
            },
          }}
        />
      </body>
    </html>
  )
}
