'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Compass, Flame, Star, Heart, Mountain, Sun, Gem } from 'lucide-react'

const MANDIRS = [
  { name: 'Kashi Vishwanath', city: 'Varanasi', deity: 'Lord Shiva', Icon: Flame },
  { name: 'Tirupati Balaji', city: 'Tirupati', deity: 'Lord Vishnu', Icon: Star },
  { name: 'Shirdi Sai Baba', city: 'Shirdi', deity: 'Sai Baba', Icon: Heart },
  { name: 'Vaishno Devi', city: 'Katra', deity: 'Goddess Durga', Icon: Mountain },
  { name: 'Golden Temple', city: 'Amritsar', deity: 'Guru Granth Sahib', Icon: Sun },
  { name: 'Meenakshi Amman', city: 'Madurai', deity: 'Goddess Meenakshi', Icon: Gem },
]

/* Simplified India map outline - approximate path, stroke-only watermark */
function IndiaWatermark() {
  return (
    <svg
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute right-0 top-0 h-full max-w-[55%] pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        d="M180,20 L220,18 L270,30 L310,55 L340,90 L355,130 L350,170 L330,195 L340,230
           L320,260 L300,285 L290,320 L270,350 L250,380 L230,410 L210,440 L200,470
           L190,440 L175,410 L155,380 L135,355 L120,320 L110,285 L90,260 L70,230
           L60,195 L50,160 L55,120 L70,85 L100,55 L130,35 Z"
        stroke="white"
        strokeOpacity="0.03"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Sri Lanka */}
      <ellipse cx="215" cy="490" rx="18" ry="24" stroke="white" strokeOpacity="0.02" strokeWidth="1" fill="none" />
    </svg>
  )
}

const CROSS_HATCH = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12L12 0M-3 3L3 -3M9 15L15 9' stroke='white' stroke-width='0.5' stroke-opacity='0.04'/%3E%3C/svg%3E")`

export default function MandirTeaser() {
  return (
    <section
      className="section-padding bg-[var(--indigo-deep)] relative overflow-hidden"
      style={{ backgroundImage: CROSS_HATCH }}
    >
      <IndiaWatermark />
      <div className="ambient-orb animate-drift-3 pointer-events-none"
        style={{ width: 350, height: 350, top: '10%', left: '-80px', background: 'radial-gradient(circle, rgba(198,125,83,0.07) 0%, transparent 70%)' }} />
      <div className="ambient-orb animate-drift-1 pointer-events-none"
        style={{ width: 250, height: 250, bottom: '5%', right: '5%', background: 'radial-gradient(circle, rgba(185,152,107,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Chapter marker */}
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block w-8 border-t-2 border-[var(--terracotta)]" />
              <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--saffron)' }}>
                Mandir Finder
              </span>
            </div>

            <h2
              className="text-white mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(32px, 4vw, 44px)' }}
            >
              Find Mandirs Near You.<br />
              <span style={{ color: 'rgba(212,160,67,0.9)' }}>Plan Sacred Pilgrimages.</span>
            </h2>

            <p className="mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>
              Discover temples across India, get timings, history, and special puja information. Our AI pilgrimage planner creates perfect day-by-day itineraries with auspicious Panchang timings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link
                href="/mandir-finder"
                className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  background: 'var(--terracotta)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '12px 24px',
                }}
              >
                <MapPin size={16} />
                Find Mandirs Near Me
              </Link>
              <Link
                href="/pilgrimage"
                className="inline-flex items-center gap-2 transition-colors hover:bg-white/8"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '8px',
                  padding: '12px 24px',
                }}
              >
                <Compass size={16} />
                Plan a Pilgrimage
              </Link>
            </div>

            <p className="text-[11px]" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.35)' }}>
              Updated daily · 5,000+ temples indexed
            </p>
          </motion.div>

          {/* ── Right: mandir cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MANDIRS.map(({ name, city, deity, Icon }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-xl p-5 transition-colors duration-200 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.10)'
                  el.style.borderColor = 'rgba(255,255,255,0.20)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.06)'
                  el.style.borderColor = 'rgba(255,255,255,0.10)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} color="var(--saffron)" />
                  <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(212,160,67,0.7)' }}>
                    {deity}
                  </span>
                </div>
                <p className="font-semibold text-white mb-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px' }}>{name}</p>
                <p className="text-[11px] mb-3" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.45)' }}>{city}</p>
                <div
                  className="flex justify-end pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Link
                    href="/mandir-finder"
                    className="text-[10px] uppercase tracking-widest transition-opacity hover:opacity-100"
                    style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(198,125,83,0.6)' }}
                  >
                    View Details →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
