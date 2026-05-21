'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const NODES = [
  { abbr: 'VA', label: 'Vedic Astrology' },
  { abbr: 'NM', label: 'Numerology' },
  { abbr: 'CH', label: 'Chakra' },
  { abbr: 'AV', label: 'Astro-Vastu' },
  { abbr: 'DM', label: 'DMIT' },
  { abbr: 'PK', label: 'Prakriti' },
  { abbr: 'MV', label: 'Mobile Vib.' },
  { abbr: 'YC', label: 'Yantra' },
  { abbr: 'CD', label: 'Child Dev.' },
  { abbr: 'MS', label: 'Mantra' },
  { abbr: 'KP', label: 'Kundli Pro' },
  { abbr: 'SH', label: 'Shadbala' },
  { abbr: 'TP', label: 'Tarot' },
  { abbr: 'GN', label: 'Gem & Rudra' },
]

const CROSS_HATCH = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12L12 0M-3 3L3 -3M9 15L15 9' stroke='white' stroke-width='0.5' stroke-opacity='0.04'/%3E%3C/svg%3E")`

const cx = 210, cy = 210, R = 120, nodeR = 16

function BundleSVG() {
  return (
    <svg width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* radial bg glow */}
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4A043" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#D4A043" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="200" fill="url(#cg)" />

      {/* spoke lines */}
      {NODES.map((_, i) => {
        const a = (i * Math.PI * 2) / 14 - Math.PI / 2
        const nx = cx + (R + nodeR + 32) * Math.cos(a)
        const ny = cy + (R + nodeR + 32) * Math.sin(a)
        return <line key={i} x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeOpacity="0.08" strokeWidth="0.5" />
      })}

      {/* center circle */}
      <circle cx={cx} cy={cy} r={R} stroke="#D4A043" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
      <circle cx={cx} cy={cy} r={R - 12} stroke="white" strokeOpacity="0.05" strokeWidth="0.5" fill="none" />

      {/* center text */}
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
        fill="#D4A043" fontSize="48" fontFamily="'Playfair Display', serif" fontWeight="700">14</text>
      <text x={cx} y={cy + 36} textAnchor="middle" dominantBaseline="middle"
        fill="white" fillOpacity="0.5" fontSize="10" fontFamily="'Sora', sans-serif" letterSpacing="2">REPORTS</text>

      {/* nodes */}
      {NODES.map((n, i) => {
        const a = (i * Math.PI * 2) / 14 - Math.PI / 2
        const nx = cx + (R + nodeR + 32) * Math.cos(a)
        const ny = cy + (R + nodeR + 32) * Math.sin(a)
        return (
          <g key={i}>
            <circle cx={nx} cy={ny} r={nodeR} stroke="#C67D53" strokeOpacity="0.5" strokeWidth="1" fill="#1C1E4A" />
            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="middle"
              fill="white" fillOpacity="0.7" fontSize="9" fontFamily="'JetBrains Mono', monospace">{n.abbr}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function TathastuCTA() {
  return (
    <section className="section-padding" style={{ background: '#0F1628', backgroundImage: CROSS_HATCH }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[48fr_52fr] gap-12 items-center">

          {/* ── Left ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-6" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--saffron)' }}>
              Signature Bundle · One-Time Purchase
            </p>

            <h2
              className="text-white leading-tight mb-5"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(40px, 5vw, 56px)' }}
            >
              All 14 Reports for<br />Your Entire Family
            </h2>

            <p className="mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.6)' }}>
              One-time purchase covering every family member. 60–100 page comprehensive PDF per report. Expert consultation session included.
            </p>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>₹4,999</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: 700, color: 'var(--saffron)' }}>₹2,999</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.4)' }}>
                Limited time offer
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="inline-flex items-center justify-center font-semibold transition-opacity hover:opacity-90 mb-6"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: 'var(--terracotta)',
                color: 'white',
                borderRadius: '9999px',
                padding: '14px 32px',
                minWidth: '220px',
                fontSize: '15px',
              }}
            >
              Get the Full Bundle →
            </Link>

            {/* Micro trust */}
            <p className="text-[11px]" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.4)' }}>
              60–100 page PDF · Expert session included · Instant delivery
            </p>
          </motion.div>

          {/* ── Right: SVG illustration ── */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex items-center justify-center"
          >
            <div className="hidden lg:block">
              <BundleSVG />
            </div>
            <div className="block lg:hidden">
              <svg width="280" height="280" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx={cx} cy={cy} r={R} stroke="#D4A043" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
                <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fill="#D4A043" fontSize="48" fontFamily="'Playfair Display', serif" fontWeight="700">14</text>
                <text x={cx} y={cy + 36} textAnchor="middle" dominantBaseline="middle" fill="white" fillOpacity="0.5" fontSize="10" fontFamily="'Sora', sans-serif" letterSpacing="2">REPORTS</text>
              </svg>
            </div>

            {/* Glass card overlay */}
            <div
              className="absolute bottom-4 right-4 lg:bottom-8 lg:right-0 rounded-xl p-4 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', minWidth: '180px' }}
            >
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--saffron)' }}>
                Family Account
              </p>
              <p className="text-[11px] leading-relaxed" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.6)' }}>
                All members. All reports.<br />One price.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
