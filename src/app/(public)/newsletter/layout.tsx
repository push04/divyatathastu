import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Newsletter | MahaTathastu - Adhyatmic Digest',
  description: 'Subscribe to the Adhyatmic Digest - Vedic wisdom, mantras, and spiritual insights delivered every 3 days.',
  alternates: { canonical: '/newsletter' },
}

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
