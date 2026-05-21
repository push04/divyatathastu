'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const STATS = [
  { num: '10,000+', label: 'Families Guided' },
  { num: '14', label: 'Report Types' },
  { num: '98%', label: 'Satisfaction Rate' },
  { num: '5.0', label: 'Google Rating' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
}

interface PanchangSnap { tithi: string; nakshatra: string; yoga: string }

function getTodaySnap(): PanchangSnap {
  const now = new Date()
  const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const tithis = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima']
  const nakshatras = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
  const yogas = ['Vishkamba','Preeti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti']
  return { tithi: tithis[day % 15], nakshatra: nakshatras[day % 27], yoga: yogas[day % 27] }
}

function MandalaSVG() {
  const cx = 240, cy = 240, s60 = 0.86603
  const up = (r: number) => `${cx},${cy - r} ${cx - r * s60},${cy + r * 0.5} ${cx + r * s60},${cy + r * 0.5}`
  const dn = (r: number) => `${cx},${cy + r} ${cx - r * s60},${cy - r * 0.5} ${cx + r * s60},${cy - r * 0.5}`
  const marks = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI * 2) / 24
    const r1 = 168, r2 = 177
    return { x1: cx + r1 * Math.sin(a), y1: cy - r1 * Math.cos(a), x2: cx + r2 * Math.sin(a), y2: cy - r2 * Math.cos(a) }
  })

  return (
    <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[480px] select-none" aria-hidden="true">
      {/* Outer frame */}
      <circle cx={cx} cy={cy} r="222" fill="none" stroke="#C67D53" strokeWidth="0.6" opacity="0.13" />
      <circle cx={cx} cy={cy} r="210" fill="none" stroke="#C67D53" strokeWidth="0.4" opacity="0.07" />
      <circle cx={cx} cy={cy} r="174" fill="none" stroke="#D4A043" strokeWidth="0.4" opacity="0.09" />

      {/* 16-petal outer lotus */}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={`op${i}`} cx={cx} cy={75} rx={13} ry={29}
          fill="#C67D53" fillOpacity="0.055" stroke="#C67D53" strokeWidth="0.5" strokeOpacity="0.11"
          transform={`rotate(${i * 22.5} ${cx} ${cy})`} />
      ))}

      {/* 8-petal inner lotus */}
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={`ip${i}`} cx={cx} cy={112} rx={10} ry={20}
          fill="#D4A043" fillOpacity="0.05" stroke="#D4A043" strokeWidth="0.5" strokeOpacity="0.11"
          transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}

      {/* Large interlocking triangles (Shiva ↑ / Shakti ↓) */}
      <polygon points={dn(145)} fill="#1C1E4A" fillOpacity="0.04" stroke="#1C1E4A" strokeWidth="0.9" strokeOpacity="0.18" />
      <polygon points={up(145)} fill="#C67D53" fillOpacity="0.03" stroke="#C67D53" strokeWidth="0.9" strokeOpacity="0.18" />

      {/* Medium interlocking triangles */}
      <polygon points={dn(100)} fill="#1C1E4A" fillOpacity="0.04" stroke="#1C1E4A" strokeWidth="0.7" strokeOpacity="0.13" />
      <polygon points={up(100)} fill="#D4A043" fillOpacity="0.03" stroke="#D4A043" strokeWidth="0.7" strokeOpacity="0.13" />

      {/* Small inner triangles */}
      <polygon points={up(58)} fill="#C67D53" fillOpacity="0.045" stroke="#C67D53" strokeWidth="0.65" strokeOpacity="0.22" />
      <polygon points={dn(36)} fill="#1C1E4A" fillOpacity="0.06" stroke="#1C1E4A" strokeWidth="0.65" strokeOpacity="0.22" />

      {/* Inner circles */}
      <circle cx={cx} cy={cy} r="48" fill="none" stroke="#D4A043" strokeWidth="0.5" opacity="0.17" />
      <circle cx={cx} cy={cy} r="22" fill="none" stroke="#C67D53" strokeWidth="0.65" opacity="0.22" />

      {/* Gate marks */}
      {marks.map((m, i) => (
        <line key={`rm${i}`} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#D4A043" strokeWidth="0.8" opacity="0.14" />
      ))}

      {/* Bindu */}
      <circle cx={cx} cy={cy} r="5" fill="#C67D53" opacity="0.45" />
      <circle cx={cx} cy={cy} r="2" fill="#D4A043" opacity="0.75" />
    </svg>
  )
}

export default function HeroSection() {
  const [snap, setSnap] = useState<PanchangSnap | null>(null)
  useEffect(() => { setSnap(getTodaySnap()) }, [])

  return (
    <section className="relative bg-[var(--kutch-white)] overflow-hidden pt-20">
      {/* Fine dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(198,125,83,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Two-column split */}
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-6 items-center py-16 lg:py-0 lg:min-h-[calc(100vh-80px)]">

          {/* ── Left column ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="flex flex-col"
          >
            {/* Editorial annotation */}
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-[var(--terracotta)]" style={{ opacity: 0.35 }} />
              <code
                className="text-[11px] text-[var(--indigo-deep)] tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.45 }}
              >
                const platform = "India's First 360° Holistic Platform"
              </code>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[58px] sm:text-[74px] lg:text-[88px] leading-[1.04] tracking-[-0.022em] text-[var(--indigo-deep)] mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
            >
              Your Existence,
              <br />
              <span
                style={{
                  color: 'var(--terracotta)',
                  textDecorationLine: 'underline',
                  textDecorationStyle: 'solid',
                  textDecorationColor: 'rgba(198,125,83,0.38)',
                  textDecorationThickness: '3px',
                  textUnderlineOffset: '8px',
                }}
              >
                Decoded.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg leading-relaxed max-w-md mb-10"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--indigo-deep)', opacity: 0.62 }}
            >
              14 personalized reports powered by Vedic astrology, numerology, psychology,
              Vastu, chakra science &amp; Ayurveda. One family. One account. Infinite guidance.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/register"
                className="btn-divine px-7 py-3.5 text-sm font-semibold"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Get Your Free Report &nbsp;→
              </Link>
              <Link
                href="/services"
                className="btn-outline-divine px-7 py-3.5 text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Explore 14 Reports
              </Link>
            </motion.div>

            {/* Trust signals — no icons, · separator, monospaced */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {['Vedic AI Engine', 'Instant Reports', 'Expert Validated'].map((tag, i) => (
                <span key={tag} className="flex items-center gap-2">
                  <span
                    className="text-[11px] text-[var(--indigo-deep)]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.44 }}
                  >
                    {tag}
                  </span>
                  {i < 2 && (
                    <span className="text-[var(--indigo-deep)] text-xs" style={{ opacity: 0.2 }}>·</span>
                  )}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right column: mandala illustration ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.22 }}
            className="relative flex items-center justify-center"
          >
            {/* Textured background patch behind illustration */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='%23C67D53' fill-opacity='0.04'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Mandala + floating card container */}
            <div className="relative w-full h-[300px] lg:h-[520px] flex items-center justify-center">
              <MandalaSVG />

              {/* Floating panchang card — lower-left of illustration */}
              {snap && (
                <div className="absolute bottom-4 left-0 lg:-left-4 hidden sm:block z-10">
                  <div
                    className="rounded-2xl border border-[var(--warm-sand)] bg-white/85 backdrop-blur-sm shadow-lg p-4"
                    style={{ minWidth: '196px' }}
                  >
                    <p
                      className="text-[9px] uppercase tracking-widest mb-3"
                      style={{ fontFamily: "'Sora', sans-serif", color: 'var(--terracotta)' }}
                    >
                      Today's Panchang
                    </p>
                    {[
                      { label: 'Tithi', value: snap.tithi },
                      { label: 'Nakshatra', value: snap.nakshatra },
                      { label: 'Yoga', value: snap.yoga },
                    ].map(({ label, value }) => (
                      <div key={label} className="mb-2.5 last:mb-0">
                        <p
                          className="text-[9px] uppercase tracking-widest"
                          style={{ fontFamily: "'Sora', sans-serif", color: 'var(--indigo-deep)', opacity: 0.38 }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-sm font-semibold text-[var(--indigo-deep)]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Stat row — full width below columns ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.52 }}
          className="grid grid-cols-2 sm:grid-cols-4 border-t border-[var(--indigo-deep)]/10"
        >
          {STATS.map(({ num, label }, i) => (
            <div
              key={label}
              className={`py-8 px-4 sm:px-6 ${i > 0 ? 'border-l border-[var(--indigo-deep)]/[0.08]' : ''}`}
            >
              <div
                className="text-[32px] sm:text-[38px] font-bold text-[var(--indigo-deep)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {num}
              </div>
              <div
                className="text-[10px] uppercase tracking-widest text-[var(--indigo-deep)] mt-1.5"
                style={{ fontFamily: "'Sora', sans-serif", opacity: 0.36 }}
              >
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
