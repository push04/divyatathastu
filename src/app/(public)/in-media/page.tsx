import type { Metadata } from 'next'
import Link from 'next/link'

import Icon from '@/components/ui/Icon'
import MediaClient from './MediaClient'
export const metadata: Metadata = {
  title: 'In the Media | MahaTathastu - Press & Coverage',
  description: 'MahaTathastu featured in leading Indian media outlets - Times of India, NDTV, Hindustan Times and more.',
  alternates: { canonical: '/in-media' },
}

export default function InMediaPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="t-eyebrow t-eyebrow-dark mb-4 inline-block">Press & Media</p>
          <h1 className="t-display-2 text-[var(--text-on-dark)] mb-4">MahaTathastu in the Media</h1>
          <div className="ornate-divider">
            <Icon name="yantra" size={16} className="text-[var(--gold-300)]" />
          </div>
          <p className="text-[var(--text-on-dark-secondary)] text-lg leading-relaxed">Trusted by India's leading journalists, researchers and spiritual leaders</p>
        </div>
      </section>


      {/* Featured press + awards - both read from the database. The page used
          to ship a hardcoded array of invented outlets and headlines. */}
      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-5xl mx-auto">
          <MediaClient />
        </div>
      </section>

      {/* Press kit CTA */}
      <section className="py-12 px-6 bg-[var(--indigo-deep)] text-center">
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>Media Inquiries</h2>
        <p className="text-[var(--text-on-dark-secondary)] mb-6 max-w-md mx-auto">Journalists, bloggers and researchers - we'd love to share our story. Download our press kit or reach out directly.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button className="btn-divine px-6 py-3 flex items-center gap-2"><Icon name="folder_open" size={18} />Download Press Kit</button>
          <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9858784784'}?text=Hi%2C%20I%20am%20a%20journalist%20interested%20in%20MahaTathastu`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <Icon name="chat" size={18} />WhatsApp Us
          </a>
        </div>
        <p className="text-[var(--text-on-dark-muted)] text-sm mt-4">media@mahatathastu.com · Response within 24 hours</p>
      </section>
    </div>
  )
}
