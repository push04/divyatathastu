'use client'

import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { YantraWatermark } from '@/components/ui/Yantra'

/* ═══════════════════════════════════════════════════════════════════════════
   DIVINE SERVICES - temple card treatment.

   Was: the same white rounded rectangle as the reports grid, with each icon
   in its own differently-tinted square (purple, pink, green, blue, amber,
   emerald, orange, blue again) at a filled weight that matched nothing else
   on the page. Eight accent hues on one row, none of them brand colours.

   Now: .card-temple - a squared upper edge with a gilded shrine arch, on a
   sand ground, yantra line-work surfacing on hover. One accent (temple gold),
   one icon frame, one stroke weight. The section reads as a different room
   from the reports grid without inventing a new palette.
   ═══════════════════════════════════════════════════════════════════════════ */

const SERVICES = [
  { href: '/sadhana',                        label: 'Saadhana',                     tag: 'Practice', icon: 'lotus',                 desc: 'Guided Vedic spiritual practice, 21-day programmes and mantra sadhana for inner transformation.' },
  { href: '/mahaganpati',                    label: 'Mahaganpati Puja',             tag: 'Puja',     icon: 'diya',                  desc: 'Sacred Ganesh puja, Chaturthi rituals and blessings for new beginnings and the removal of obstacles.' },
  { href: '/ayurveda',                       label: 'Ayurveda & Medical Astrology', tag: 'Healing',  icon: 'dosha',                 desc: 'Dosha analysis, planetary health mapping and Vedic remedies for body-mind-spirit equilibrium.' },
  { href: '/courses',                        label: 'Learning Courses',             tag: 'Learn',    icon: 'menu_book',             desc: 'Live and recorded lectures on Vedic astrology, numerology, Vastu, mantra and Ayurveda.' },
  { href: '/gyanampeetham',                  label: 'Gyanampeetham',                tag: 'Wisdom',   icon: 'school',                desc: 'Immersive programmes to discover the divine within - ancient wisdom decoded for modern seekers.' },
  { href: '/ardra-jalam',                    label: 'Ardra Jalam',                  tag: 'Special',  icon: 'kalash',                desc: 'Sacred healing water consecrated during Ardra Nakshatra - rare, potent and spiritually charged.' },
  { href: '/puja',                           label: 'Pooja & Rituals',              tag: 'Ceremony', icon: 'local_fire_department', desc: 'Authentic Vedic ceremony - havan, yagna, navagraha puja and personalised anushthaan rituals.' },
  { href: '/shop?category=vastu-paintings',  label: 'Vastu Paintings',              tag: 'Art',      icon: 'yantra',                desc: 'Hand-crafted sacred art energised with Vedic yantras to harmonise your home and workspace.' },
]

export default function DivineServicesSection() {
  return (
    <section className="section-padding relative overflow-hidden" style={{ background: 'var(--surface-light-sunken)' }}>
      <YantraWatermark size={400} className="-top-20 -left-24" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

        {/* ── Header ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-14 reveal">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-block w-6 border-t border-[var(--gold-700)]/50" />
              <span className="t-eyebrow t-eyebrow-gold">Anushthaan India · Gyanampeetham</span>
            </div>
            <h2 className="t-display-2 text-[var(--text-primary)]">Divine Services</h2>
          </div>
          <p className="t-body text-[var(--text-secondary)] md:text-right">
            Beyond reports - sacred practice, puja, healing and learning programmes rooted in Vedic tradition.
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger">
          {SERVICES.map(s => (
            <Link key={s.href} href={s.href} className="card-temple group h-full min-h-[236px]">
              <span className="icon-frame icon-frame-gold mb-5">
                <Icon name={s.icon} size={22} />
              </span>

              <span className="t-eyebrow t-eyebrow-gold mb-2">{s.tag}</span>

              <h3 className="t-h4 text-[var(--text-primary)] mb-2 leading-snug">{s.label}</h3>
              <p className="t-body-sm text-[var(--text-muted)] flex-1">{s.desc}</p>

              {/* Affordance is always present - it used to be opacity-0 until
                  hover, which hid it entirely from touch users. */}
              <span className="t-eyebrow t-eyebrow-gold flex items-center gap-1.5 mt-5">
                Explore
                <Icon
                  name="arrow_forward"
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
