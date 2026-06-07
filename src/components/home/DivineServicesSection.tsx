'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06 } }),
}

const SERVICES = [
  {
    href: '/sadhana',
    label: 'Saadhana',
    desc: 'Guided Vedic spiritual practices, 21-day programs and mantra sadhana for inner transformation.',
    icon: 'self_improvement',
    tag: 'Practice',
    accent: '#6b21a8',
    bg: '#f3e8ff',
  },
  {
    href: '/mahaganpati',
    label: 'Mahaganpati Puja',
    desc: 'Sacred Ganesh puja, Chaturthi rituals and divine blessings for new beginnings and obstacle removal.',
    icon: 'brightness_5',
    tag: 'Puja',
    accent: '#9d174d',
    bg: '#fce7f3',
  },
  {
    href: '/ayurveda',
    label: 'Ayurveda & Medical Astrology',
    desc: 'Dosha analysis, planetary health mapping and Vedic remedies for body-mind-spirit equilibrium.',
    icon: 'spa',
    tag: 'Healing',
    accent: '#166534',
    bg: '#f0fdf4',
  },
  {
    href: '/courses',
    label: 'Learning Courses',
    desc: 'Live and recorded lectures on Vedic astrology, numerology, Vastu, mantra and Ayurveda.',
    icon: 'menu_book',
    tag: 'Learn',
    accent: '#1e3a8a',
    bg: '#eff6ff',
  },
  {
    href: '/gyanampeetham',
    label: 'Gyanampeetham',
    desc: 'Immersive programs to discover the divine within — ancient wisdom decoded for modern seekers.',
    icon: 'school',
    tag: 'Wisdom',
    accent: '#92400e',
    bg: '#fef3c7',
  },
  {
    href: '/ardra-jalam',
    label: 'Ardra Jalam',
    desc: 'Sacred healing water consecrated during Ardra Nakshatra — rare, potent and spiritually charged.',
    icon: 'water_drop',
    tag: 'Special',
    accent: '#065f46',
    bg: '#ecfdf5',
  },
  {
    href: '/puja',
    label: 'Pooja & Rituals',
    desc: 'Authentic Vedic ceremonies — havan, yagna, navagraha puja and personalised anushthaan rituals.',
    icon: 'local_fire_department',
    tag: 'Ceremony',
    accent: '#9a3412',
    bg: '#fff7ed',
  },
  {
    href: '/shop?category=vastu-paintings',
    label: 'Vastu Paintings',
    desc: 'Hand-crafted sacred art energised with Vedic yantras to harmonise your home and workspace.',
    icon: 'palette',
    tag: 'Art',
    accent: '#1e40af',
    bg: '#dbeafe',
  },
]

export default function DivineServicesSection() {
  return (
    <section className="section-padding" style={{ background: 'var(--kutch-white)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-14">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-block w-6 border-t border-[var(--terracotta)]/30" />
              <span className="text-[11px] uppercase tracking-widest text-[var(--terracotta)]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Anushthaan India · Gyanampeetham
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--indigo-deep)] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
              Divine Services
            </h2>
          </motion.div>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-[var(--indigo-deep)]/55 text-sm leading-relaxed md:text-right"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Beyond reports — sacred practices, pujas, healing and learning programs rooted in Vedic tradition.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s, i) => (
            <motion.div key={s.href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Link
                href={s.href}
                className="group bg-white border border-[var(--outline-variant)]/40 rounded-xl p-5 flex flex-col h-full min-h-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(198,125,83,0.12)] block relative overflow-hidden"
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: s.bg }}
                >
                  <span className="material-symbols-outlined text-[22px]" style={{ color: s.accent, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>

                {/* Tag */}
                <span
                  className="text-[9px] uppercase tracking-widest font-semibold mb-2"
                  style={{ fontFamily: "'Sora', sans-serif", color: `${s.accent}99` }}
                >
                  {s.tag}
                </span>

                {/* Label + desc */}
                <h3 className="font-semibold text-[var(--indigo-deep)] text-sm mb-1.5 leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {s.label}
                </h3>
                <p className="text-xs text-[var(--indigo-deep)]/50 leading-relaxed flex-1">{s.desc}</p>

                {/* Arrow */}
                <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] font-semibold" style={{ color: s.accent, fontFamily: "'Sora', sans-serif" }}>Explore</span>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: s.accent }}>arrow_forward</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
