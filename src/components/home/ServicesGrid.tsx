'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

/* ── Inline SVG glyphs - outer guide circle + inner symbol, terracotta 70% ── */
function Glyph({ id, size = 32 }: { id: string; size?: number }) {
  const s = 'rgba(198,125,83,0.7)'
  const sl = 'rgba(198,125,83,0.35)'
  const sym: Record<string, React.ReactNode> = {
    astrology: (
      <>
        <circle cx="16" cy="16" r="5" fill="none" stroke={s} strokeWidth="1.5" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI * 2) / 8
          return <line key={i} x1={16 + 7.5 * Math.sin(a)} y1={16 - 7.5 * Math.cos(a)} x2={16 + 11 * Math.sin(a)} y2={16 - 11 * Math.cos(a)} stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        })}
      </>
    ),
    dmit: (
      <>
        {[5, 8, 11].map(r => (
          <path key={r} d={`M ${16 - r},16 a ${r},${r} 0 0,1 ${r * 2},0`} fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <circle cx="16" cy="18" r="1.5" fill={s} />
      </>
    ),
    ayurveda: (
      <path d="M16,5 C22,8 23,16 16,27 C9,16 10,8 16,5 Z M16,5 L16,27" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
    ),
    vastu: (
      <path d="M16,5 L27,14 L27,27 L5,27 L5,14 Z M11,27 L11,20 L21,20 L21,27" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
    chakra: (
      <>
        <circle cx="16" cy="16" r="4" fill="none" stroke={s} strokeWidth="1.5" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI * 2) / 6
          return <line key={i} x1={16 + 4.8 * Math.sin(a)} y1={16 - 4.8 * Math.cos(a)} x2={16 + 11 * Math.sin(a)} y2={16 - 11 * Math.cos(a)} stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        })}
      </>
    ),
    mobile: (
      <>
        <rect x="11" y="5" width="10" height="22" rx="2" fill="none" stroke={s} strokeWidth="1.5" />
        <line x1="14.5" y1="8" x2="17.5" y2="8" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16" cy="24" r="1" fill={s} />
      </>
    ),
    yantra: (
      <>
        <polygon points="16,5 26.5,23 5.5,23" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="16,27 5.5,9 26.5,9" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
    child: (
      <>
        <circle cx="16" cy="9" r="3.5" fill="none" stroke={s} strokeWidth="1.5" />
        <path d="M16,12.5 L16,21 M16,21 L11,27 M16,21 L21,27 M10,16.5 L22,16.5" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    mantra: (
      <path d="M4,16 C7,11 9,21 12,16 C15,11 17,21 20,16 C23,11 25,21 28,16" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
    ),
  }

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" stroke={sl} strokeWidth="1" />
      {sym[id] ?? <circle cx="16" cy="16" r="5" stroke={s} strokeWidth="1.5" />}
    </svg>
  )
}

/* ── Data ── */
const REPORTS = [
  { id: 'astrology', name: 'Vedic Astrology', slug: 'astrology-report', desc: 'Birth chart, planetary positions & life predictions', tag: 'Core Focus' },
  { id: 'dmit', name: 'Neural Topology (DMIT)', slug: 'dmit-report', desc: 'Dermatoglyphics mapping to reveal innate psychological patterns', tag: 'DMIT' },
  { id: 'ayurveda', name: 'Ayurvedic Dosha', slug: 'prakriti-report', desc: 'Elemental body constitution for holistic equilibrium', tag: 'Prakriti' },
  { id: 'vastu', name: 'Astro-Vastu', slug: 'astro-vastu-report', desc: 'Home directions & energy alignment', tag: 'Vastu' },
  { id: 'chakra', name: 'Shakti Chakra', slug: 'shakti-chakra-report', desc: '7 chakra activation & healing for energy balance', tag: 'Chakra' },
  { id: 'mobile', name: 'Mobile Vibration', slug: 'mobile-number-report', desc: 'Vibration compatibility of your mobile number', tag: 'Numerology' },
  { id: 'yantra', name: 'Yantra & Colour', slug: 'yantra-colour-report', desc: 'Personal yantra creation & colour therapy prescription', tag: 'Spiritual' },
  { id: 'child', name: 'Child Development', slug: 'child-development-report', desc: 'Talent map & learning pathway guidance for kids', tag: 'Kids' },
  { id: 'mantra', name: 'Mantra Science', slug: 'mantra-chanting-report', desc: 'Personal beej mantra practice & likhit japa guidance', tag: 'Spiritual' },
]

const NUMEROLOGY_NUMS = [
  { n: '07', l: 'Life Path' },
  { n: '11', l: 'Expression' },
  { n: '09', l: 'Soul Urge' },
]

const PREVIEW_IDS = ['astrology', 'dmit', 'ayurveda', 'vastu', 'chakra']

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.07 } }),
}

/* ── Card Type B ── */
function CardB({ r, className = '' }: { r: typeof REPORTS[0]; className?: string }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
      className={className}
    >
      <Link
        href="/register"
        className="group bg-white border border-[var(--outline-variant)]/40 rounded-xl p-5 flex flex-col h-full min-h-[160px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(198,125,83,0.12)] block"
      >
        <div className="flex items-start justify-between mb-4">
          <Glyph id={r.id} size={32} />
          <span
            className="text-[9px] text-[var(--indigo-deep)]/30"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {r.tag}
          </span>
        </div>
        <h3 className="font-semibold text-[var(--indigo-deep)] text-sm mb-1.5">{r.name}</h3>
        <p className="text-xs text-[var(--indigo-deep)]/50 leading-relaxed">{r.desc}</p>
      </Link>
    </motion.div>
  )
}

export default function ServicesGrid() {
  return (
    <section className="section-padding bg-[var(--kutch-white)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* ── Section header - two-column ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-14">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-block w-6 border-t border-[var(--terracotta)]/30" />
              <span
                className="text-[11px] uppercase tracking-widest text-[var(--terracotta)]"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                14 Reports
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl text-[var(--indigo-deep)] leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
            >
              The Tathastu<br />Report Ecosystem
            </h2>
          </motion.div>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-[var(--indigo-deep)]/55 text-sm leading-relaxed md:text-right"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Every report uniquely generated from your birth data using the ancient Vedic sciences.
          </motion.p>
        </div>

        {/* ── Bento grid - 12 col ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Row 1 - Type A Featured (8) + Type B (4) */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="md:col-span-8"
          >
            <Link
              href="/register"
              className="block relative overflow-hidden rounded-xl min-h-[280px] p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(198,125,83,0.14)]"
              style={{ background: 'linear-gradient(145deg, #F5EFE6, #EDE4D8)' }}
            >
              {/* Watermark "14" */}
              <div
                className="absolute right-0 top-0 bottom-0 w-[40%] flex items-center justify-center pointer-events-none select-none overflow-hidden"
                aria-hidden="true"
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '180px',
                    fontWeight: 700,
                    color: 'var(--terracotta)',
                    opacity: 0.08,
                    lineHeight: 1,
                  }}
                >
                  14
                </span>
              </div>

              {/* Content - left 60% */}
              <div className="relative z-10 w-[60%] flex flex-col h-full justify-between">
                <div>
                  <span
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '9px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--terracotta)',
                      borderBottom: '1px solid rgba(198,125,83,0.3)',
                      paddingBottom: '2px',
                    }}
                  >
                    Signature Bundle
                  </span>
                  <h3
                    className="text-2xl text-[var(--indigo-deep)] mt-5 mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
                  >
                    Full Tathastu Bundle
                  </h3>
                  <p className="text-[var(--indigo-deep)]/60 text-sm leading-relaxed">
                    All 14 reports - the complete 360° life guidance system for your entire family.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-8">
                  <div className="flex -space-x-1.5">
                    {PREVIEW_IDS.map(id => (
                      <div key={id} className="w-7 h-7 rounded-full bg-white border border-[var(--outline-variant)]/60 flex items-center justify-center shadow-sm">
                        <Glyph id={id} size={16} />
                      </div>
                    ))}
                    <div className="w-7 h-7 rounded-full bg-[var(--warm-sand)] border border-[var(--outline-variant)]/60 flex items-center justify-center text-[10px] font-bold text-[var(--terracotta)] shadow-sm">+9</div>
                  </div>
                  <span
                    className="text-[var(--terracotta)] text-sm font-semibold flex items-center gap-1"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Start Now
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          <CardB r={REPORTS[0]} className="md:col-span-4" />

          {/* Row 2 - 3 × Type B */}
          <CardB r={REPORTS[1]} className="md:col-span-4" />
          <CardB r={REPORTS[2]} className="md:col-span-4" />
          <CardB r={REPORTS[3]} className="md:col-span-4" />

          {/* Row 3 - Type C Numerology (8) + Type B (4) */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="md:col-span-8"
          >
            <Link
              href="/register"
              className="block bg-[var(--indigo-deep)] rounded-xl p-7 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(28,30,74,0.18)] h-full"
            >
              <div>
                <span
                  className="text-[9px] uppercase tracking-widest"
                  style={{ fontFamily: "'Sora', sans-serif", color: 'var(--saffron)', borderBottom: '1px solid rgba(212,160,67,0.3)', paddingBottom: '2px' }}
                >
                  Ancestral Data
                </span>
                <h3
                  className="text-xl text-white mt-4 mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Genetic Numerology
                </h3>
                <p className="text-white/50 text-sm mb-6 max-w-md leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  The resonance of your name and birth digits forming a unique vibrational signature across lifetimes.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {NUMEROLOGY_NUMS.map(({ n, l }) => (
                    <div key={l} className="border-b border-white/10 pb-3">
                      <div
                        className="text-[var(--saffron)] mb-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '32px', fontWeight: 600, lineHeight: 1 }}
                      >
                        {n}
                      </div>
                      <div
                        className="text-[9px] uppercase tracking-widest text-white/40"
                        style={{ fontFamily: "'Sora', sans-serif" }}
                      >
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>

          <CardB r={REPORTS[4]} className="md:col-span-4" />

          {/* Row 4 - 3 × Type B */}
          <CardB r={REPORTS[5]} className="md:col-span-4" />
          <CardB r={REPORTS[6]} className="md:col-span-4" />
          <CardB r={REPORTS[7]} className="md:col-span-4" />

          {/* Row 5 - Type B (4) + View All CTA (8) */}
          <CardB r={REPORTS[8]} className="md:col-span-4" />

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="md:col-span-8"
          >
            <div className="h-full min-h-[160px] rounded-xl border border-[var(--outline-variant)]/30 flex items-center justify-between px-8 bg-[var(--kutch-white)]">
              <div>
                <p
                  className="text-[11px] uppercase tracking-widest text-[var(--terracotta)] mb-2"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  Full Ecosystem
                </p>
                <p className="text-[var(--indigo-deep)] font-semibold text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Explore all 14 reports & pricing
                </p>
              </div>
              <Link href="/services" className="btn-outline-divine flex items-center gap-2 shrink-0">
                View All
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
