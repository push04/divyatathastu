import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mahatathastu.com'),
  title: {
    default: "MahaTathastu — India's First 360° Holistic Life Report Platform",
    template: '%s | MahaTathastu',
  },
  description: "Get personalized Vedic astrology, numerology, chakra, Vastu, Prakriti, DMIT & psychology reports for your entire family. India's most comprehensive spiritual wellness platform.",
  keywords: ['Vedic astrology', 'Kundli online', 'numerology report', 'chakra analysis', 'Vastu report', 'DMIT test', 'family horoscope', 'mandir near me'],
  authors: [{ name: 'MahaTathastu' }],
  creator: 'MahaTathastu',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://mahatathastu.com',
    siteName: 'MahaTathastu',
    title: 'MahaTathastu — 360° Holistic Life Report Platform',
    description: '14 personalized reports combining Vedic astrology, numerology, chakra, Vastu & Ayurveda for your family.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MahaTathastu — 360° Holistic Life Reports',
    description: '14 personalized holistic life reports for your family.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
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
