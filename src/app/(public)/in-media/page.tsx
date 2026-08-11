import type { Metadata } from 'next'
import Link from 'next/link'

import Icon from '@/components/ui/Icon'
export const metadata: Metadata = {
  title: 'In the Media | MahaTathastu - Press & Coverage',
  description: 'MahaTathastu featured in leading Indian media outlets - Times of India, NDTV, Hindustan Times and more.',
  alternates: { canonical: '/in-media' },
}

const PRESS_FEATURES: { id: number; outlet: string; logo: string; date: string; headline: string; excerpt: string; category: string; color: string; url?: string }[] = [
  { id: 1, outlet: 'Times of India', logo: 'TOI', date: '2025-08-15', headline: '"MahaTathastu Is Bringing Ancient Vedic Sciences Into the Digital Age"', excerpt: 'The platform has quietly become one of India\'s most comprehensive spiritual technology platforms, offering deeply personalised astrological reports that rival traditional consultations.', category: 'Feature', color: 'bg-red-600' },
  { id: 2, outlet: 'NDTV', logo: 'NDTV', date: '2025-07-22', headline: 'How This Startup Is Making Astrology Accessible to Millions of Indians', excerpt: 'With over 50,000 reports generated in its first year, MahaTathastu is proving that spirituality and technology can coexist beautifully.', category: 'Startup', color: 'bg-red-700' },
  { id: 3, outlet: 'Hindustan Times', logo: 'HT', date: '2025-06-10', headline: 'The Engine That Reads Your Kundli: Inside India\'s First 360° Spiritual Platform', excerpt: 'Nakshatra, the engine powering MahaTathastu\'s reports, combines 14 different Vedic sciences into a single comprehensive life analysis.', category: 'Technology', color: 'bg-teal-700' },
  { id: 4, outlet: 'Economic Times', logo: 'ET', date: '2025-05-30', headline: 'Spiritual Tech Is a ₹5,000 Crore Opportunity - And MahaTathastu Is Chasing It', excerpt: 'As India\'s spiritual economy booms, platforms like MahaTathastu are finding that combining ancient wisdom with modern UX creates a powerful product.', category: 'Business', color: 'bg-[var(--indigo-deep)]' },
  { id: 5, outlet: 'The Print', logo: 'TP', date: '2025-04-18', headline: 'Vastu, Numerology and Nakshatra: How MahaTathastu Is Reinventing the Jyotishi', excerpt: 'Traditional astrologers typically offer one service. MahaTathastu offers fourteen - all built on one Vedic engine and delivered instantly.', category: 'Analysis', color: 'bg-[var(--plum)]' },
  { id: 6, outlet: 'YourStory', logo: 'YS', date: '2025-03-05', headline: 'From Zero to 50K Users: The MahaTathastu Story', excerpt: 'Founder\'s vision to democratize Vedic knowledge has resonated deeply with India\'s growing wellness-conscious middle class.', category: 'Startup', color: 'bg-emerald-700' },
]

const AWARDS: { year: string; title: string; org: string; icon: string }[] = []

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


      {/* Featured press */}
      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mb-6" style={{ fontFamily: "var(--font-display)" }}>Featured Coverage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PRESS_FEATURES.map(item => (
              <div key={item.id} className="card-divine p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white font-bold text-xs`}>{item.logo}</div>
                    <div>
                      <p className="font-bold text-sm text-[var(--indigo-deep)]">{item.outlet}</p>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-[var(--warm-sand)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">{item.category}</span>
                </div>
                <h3 className="font-bold text-[var(--indigo-deep)] leading-snug text-base" style={{ fontFamily: "var(--font-display)" }}>{item.headline}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.excerpt}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--indigo-deep)] font-medium hover:underline text-left mt-auto flex items-center gap-1">
                    Read full article <Icon name="arrow_forward" size={13} style={{ verticalAlign: 'middle'  }} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards - only rendered when AWARDS array has entries */}
      {AWARDS.length > 0 && (
        <section className="py-12 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mb-6 text-center">Awards & Recognition</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AWARDS.map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-[var(--warm-sand)] rounded-xl bg-[var(--kutch-white)]">
                  <Icon name={a.icon} size={36} className="text-[var(--saffron)]" />
                  <div>
                    <p className="font-bold text-[var(--indigo-deep)]">{a.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{a.org}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{a.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
