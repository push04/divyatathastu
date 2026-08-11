'use client'

import Link from 'next/link'
import { useServiceItems } from '@/lib/hooks/useServiceItems'

import Icon from '@/components/ui/Icon'
const SECTIONS = [
  {
    href: '/ardra-jalam/nakshatra-jal',
    eyebrow: 'Charged Sacred Water',
    title: 'Nakshatra Jal',
    sanskrit: 'नक्षत्र जल',
    tagline: 'Water charged under Ardra Nakshatra, the star of transformation ruled by Lord Rudra.',
    points: [
      'Prepared only during the Ardra Nakshatra window, once every 27 days',
      'Seven days of mantra japa over a sanctified copper vessel',
      'For daily sips, space purification, abhishek and meditation',
    ],
    icon: 'water_drop',
    cta: 'Explore Nakshatra Jal',
    gradient: 'linear-gradient(160deg, #ecfdf5 0%, #d1fae5 45%, #a7f3d0 100%)',
    ring: 'rgba(16,185,129,0.35)',
    accent: '#047857',
    accentSoft: '#065f46',
    button: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    shadow: '0 10px 34px rgba(16,185,129,0.32)',
  },
  {
    href: '/ardra-jalam/crystal-manifestation',
    eyebrow: 'Programmed Crystal Kits',
    title: 'Crystal Manifestation',
    sanskrit: 'स्फटिक संकल्प',
    tagline: 'Crystals cleansed, charged and programmed to hold a single, clearly stated sankalpa.',
    points: [
      'Each stone matched to your chakra, planet and birth number',
      'Cleansed in Nakshatra Jal, then charged through a 21-day mantra cycle',
      'Arrives with your written sankalpa card and a daily activation vidhi',
    ],
    icon: 'diamond',
    cta: 'Explore Crystal Manifestation',
    gradient: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 45%, #ddd6fe 100%)',
    ring: 'rgba(124,58,237,0.32)',
    accent: '#6d28d9',
    accentSoft: '#5b21b6',
    button: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a78bfa 100%)',
    shadow: '0 10px 34px rgba(124,58,237,0.32)',
  },
]

const SHARED_PRINCIPLES = [
  {
    icon: 'schedule',
    title: 'Timed to the Sky',
    desc: 'Nothing is prepared on demand. Every batch waits for the correct nakshatra, tithi and hora before work begins.',
  },
  {
    icon: 'record_voice_over',
    title: 'Charged by Mantra',
    desc: 'Continuous japa through the whole preparation window. The sound is the charge, not a finishing touch.',
  },
  {
    icon: 'volunteer_activism',
    title: 'Prepared by Hand',
    desc: 'Small batches, sealed with kumkum, checked one by one before they leave. No factory line, no shortcuts.',
  },
  {
    icon: 'menu_book',
    title: 'Given With Vidhi',
    desc: 'Every item ships with the exact method of use. A sacred object without its vidhi is only an object.',
  },
]

export default function ArdraJalamHubPage() {
  const { items: jalItems } = useServiceItems('ardra_jalam')
  const { items: crystalItems } = useServiceItems('crystal_manifestation')

  const priceFor = (items: { price?: number }[]) => {
    const prices = items.map(i => i.price).filter((p): p is number => typeof p === 'number' && p > 0)
    return prices.length ? Math.min(...prices) : null
  }

  const prices: Record<string, number | null> = {
    '/ardra-jalam/nakshatra-jal': priceFor(jalItems),
    '/ardra-jalam/crystal-manifestation': priceFor(crystalItems),
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(150deg, #064e3b 0%, #10233f 55%, #3b0764 100%)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center">
          <p
            className="text-[13px] sm:text-sm uppercase tracking-[0.22em] text-emerald-300/80 mb-4"
            style={{ fontFamily: "var(--font-label)" }}
          >
            Ardra Jalam
          </p>
          <h1
            className="text-3xl sm:text-5xl font-black text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Two sacred instruments,<br className="hidden sm:block" /> one Rudra lineage
          </h1>
          <p className="text-base sm:text-xl text-[var(--text-on-dark-secondary)] max-w-2xl mx-auto leading-relaxed">
            Both are prepared under the Ardra Nakshatra, the star of dissolution and renewal.
            One works through water. The other works through stone. Choose the path that suits your practice.
          </p>
        </div>
      </div>

      {/* ── The two sections ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {SECTIONS.map(s => (
            <div
              key={s.href}
              className="rounded-3xl overflow-hidden flex flex-col"
              style={{ background: s.gradient, border: `2px solid ${s.ring}` }}
            >
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-white/70"
                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                  >
                    <Icon name={s.icon} size={34} style={{ color: s.accent }} />
                  </div>
                  {prices[s.href] != null && (
                    <div className="text-right">
                      <p className="text-[13px] uppercase tracking-widest font-semibold" style={{ color: s.accentSoft, opacity: 0.7 }}>
                        From
                      </p>
                      <p className="text-2xl font-black" style={{ color: s.accent, fontFamily: "var(--font-display)" }}>
                        ₹{prices[s.href]!.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                <p
                  className="text-[13px] uppercase tracking-[0.16em] font-bold mb-2"
                  style={{ color: s.accentSoft, opacity: 0.75, fontFamily: "var(--font-label)" }}
                >
                  {s.eyebrow}
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-black mb-1 leading-tight"
                  style={{ color: s.accent, fontFamily: "var(--font-display)" }}
                >
                  {s.title}
                </h2>
                <p className="text-lg mb-4" style={{ color: s.accentSoft, opacity: 0.65 }}>
                  {s.sanskrit}
                </p>

                <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: s.accentSoft, opacity: 0.85 }}>
                  {s.tagline}
                </p>

                <ul className="space-y-3 mb-8">
                  {s.points.map(p => (
                    <li key={p} className="flex items-start gap-3">
                      <Icon name="check_circle" size={20} className="shrink-0 mt-0.5" style={{ color: s.accent }} />
                      <span className="text-base leading-relaxed" style={{ color: s.accentSoft, opacity: 0.82 }}>
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={s.href}
                  className="mt-auto inline-flex items-center justify-center gap-2.5 w-full px-6 py-4 rounded-2xl font-black text-base sm:text-lg text-white transition-transform active:scale-[0.98]"
                  style={{ background: s.button, boxShadow: s.shadow }}
                >
                  {s.cta}
                  <Icon name="arrow_forward" size={20} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shared principles ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-16">
        <div className="text-center mb-9">
          <h2
            className="text-2xl sm:text-3xl font-black text-[var(--indigo-deep)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What Both Share
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            The material changes. The discipline behind it does not.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {SHARED_PRINCIPLES.map(p => (
            <div key={p.title} className="bento-card p-5 sm:p-6">
              <div className="w-11 h-11 rounded-xl bg-[var(--warm-sand)] flex items-center justify-center mb-4">
                <Icon name={p.icon} size={22} className="text-[var(--terracotta)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {p.title}
              </h3>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Help strip ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-16">
        <div
          className="rounded-3xl px-6 sm:px-10 py-9 text-center"
          style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
        >
          <h3 className="text-xl sm:text-2xl font-black text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Not sure which one is for you?
          </h3>
          <p className="text-base sm:text-lg text-[var(--text-on-dark-secondary)] max-w-xl mx-auto mb-7 leading-relaxed">
            Tell us what you are working on and our team will point you to the right preparation.
            No obligation to buy anything.
          </p>
          <a
            href="https://wa.me/919858784784?text=Namaste!%20I%20need%20help%20choosing%20between%20Nakshatra%20Jal%20and%20Crystal%20Manifestation."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white transition-transform active:scale-[0.98]"
            style={{ background: '#25D366', boxShadow: '0 8px 26px rgba(37,211,102,0.35)' }}
          >
            <Icon name="chat" size={20} />
            Ask on WhatsApp
          </a>
          <p className="text-sm text-[var(--text-on-dark-muted)] mt-6">9858784784 · info@mahatathastu.com</p>
        </div>
      </div>
    </div>
  )
}
