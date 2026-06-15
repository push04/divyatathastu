'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getUserLocation } from '@/lib/utils/getLocation'

const SHLOKAS = [
  { shloka: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', meaning: 'केवल कर्म करना तुम्हारा अधिकार है, फल में कभी नहीं। फल की कामना से कर्म न करो, और अकर्म में भी आसक्त न हो।', source: 'भगवद्गीता २.४७' },
  { shloka: 'असतो मा सद्गमय।\nतमसो मा ज्योतिर्गमय।\nमृत्योर्माऽमृतं गमय॥', meaning: 'असत्य से सत्य की ओर, अन्धकार से प्रकाश की ओर, और मृत्यु से अमरत्व की ओर मुझे ले चलो।', source: 'बृहदारण्यक उपनिषद् १.३.२८' },
  { shloka: 'वसुधैव कुटुम्बकम्।', meaning: 'यह सम्पूर्ण पृथ्वी ही एक परिवार है।', source: 'महोपनिषद् ६.७२' },
  { shloka: 'सत्यमेव जयते।', meaning: 'सत्य की ही विजय होती है, असत्य की नहीं।', source: 'मुण्डकोपनिषद् ३.१.६' },
  { shloka: 'ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते।\nपूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते॥', meaning: 'वह परब्रह्म पूर्ण है, यह जगत् भी पूर्ण है। पूर्ण से पूर्ण निकाल लेने पर भी पूर्ण ही शेष रहता है।', source: 'ईशावास्योपनिषद् शान्तिपाठ' },
  { shloka: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥', meaning: 'जब-जब धर्म की हानि होती है और अधर्म बढ़ता है, तब-तब मैं स्वयं को प्रकट करता हूँ।', source: 'भगवद्गीता ४.७' },
  { shloka: 'सर्वे भवन्तु सुखिनः। सर्वे सन्तु निरामयाः।\nसर्वे भद्राणि पश्यन्तु। मा कश्चिद् दुःखभाग्भवेत्॥', meaning: 'सभी सुखी हों, सभी रोगमुक्त हों, सभी शुभ देखें, कोई भी दुःखी न हो।', source: 'बृहदारण्यक उपनिषद्' },
  { shloka: 'योगः कर्मसु कौशलम्।', meaning: 'कर्मों में कुशलता ही योग है।', source: 'भगवद्गीता २.५०' },
  { shloka: 'ॐ तत् सत्।', meaning: 'ॐ — वही परम सत्य है।', source: 'भगवद्गीता १७.२३' },
  { shloka: 'तत् त्वम् असि।', meaning: 'वह परम ब्रह्म तुम ही हो।', source: 'छांदोग्य उपनिषद् ६.८.७' },
  { shloka: 'मनः एव मनुष्याणां कारणं बन्धमोक्षयोः।', meaning: 'मन ही मनुष्य के बंधन और मोक्ष का एकमात्र कारण है।', source: 'अमृतबिन्दु उपनिषद् २' },
  { shloka: 'स्वधर्मे निधनं श्रेयः परधर्मो भयावहः।', meaning: 'अपने धर्म में मरना भी श्रेयस्कर है; दूसरे का धर्म भय उत्पन्न करता है।', source: 'भगवद्गीता ३.३५' },
  { shloka: 'अहम् ब्रह्मास्मि।', meaning: 'मैं स्वयं ब्रह्म हूँ — यह परम ज्ञान ही मुक्ति का द्वार है।', source: 'बृहदारण्यक उपनिषद् १.४.१०' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
}

interface PanchangSnap { tithi: string; nakshatra: string; yoga: string }

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
      {/* ── Slowly rotating outer ring group ── */}
      <g style={{ transformOrigin: '240px 240px', animation: 'orbit-cw 40s linear infinite' }}>
        <circle cx={cx} cy={cy} r="222" fill="none" stroke="#C67D53" strokeWidth="1.2" opacity="0.32" />
        <circle cx={cx} cy={cy} r="210" fill="none" stroke="#C67D53" strokeWidth="0.8" opacity="0.18" strokeDasharray="4 8" />
        {marks.map((m, i) => (
          <line key={`rm${i}`} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#D4A043" strokeWidth="1.2" opacity="0.28" />
        ))}
      </g>

      {/* ── Counter-rotating lotus ring ── */}
      <g style={{ transformOrigin: '240px 240px', animation: 'orbit-ccw 28s linear infinite' }}>
        <circle cx={cx} cy={cy} r="174" fill="none" stroke="#D4A043" strokeWidth="0.8" opacity="0.22" />
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={`op${i}`} cx={cx} cy={75} rx={13} ry={29}
            fill="#C67D53" fillOpacity="0.12" stroke="#C67D53" strokeWidth="1" strokeOpacity="0.26"
            transform={`rotate(${i * 22.5} ${cx} ${cy})`} />
        ))}
      </g>

      {/* ── Slowly rotating inner lotus ── */}
      <g style={{ transformOrigin: '240px 240px', animation: 'orbit-cw 18s linear infinite' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={`ip${i}`} cx={cx} cy={112} rx={10} ry={20}
            fill="#D4A043" fillOpacity="0.11" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.28"
            transform={`rotate(${i * 45} ${cx} ${cy})`} />
        ))}
      </g>

      {/* ── Static triangles (Sri Yantra core — stable) ── */}
      <polygon points={dn(145)} fill="#1C1E4A" fillOpacity="0.18" stroke="#1C1E4A" strokeWidth="1.6" strokeOpacity="0.42" />
      <polygon points={up(145)} fill="#C67D53" fillOpacity="0.16" stroke="#C67D53" strokeWidth="1.6" strokeOpacity="0.42" />
      <polygon points={dn(100)} fill="#1C1E4A" fillOpacity="0.16" stroke="#1C1E4A" strokeWidth="1.4" strokeOpacity="0.38" />
      <polygon points={up(100)} fill="#D4A043" fillOpacity="0.16" stroke="#D4A043" strokeWidth="1.4" strokeOpacity="0.38" />
      <polygon points={up(58)} fill="#C67D53" fillOpacity="0.20" stroke="#C67D53" strokeWidth="1.2" strokeOpacity="0.46" />
      <polygon points={dn(36)} fill="#1C1E4A" fillOpacity="0.22" stroke="#1C1E4A" strokeWidth="1.2" strokeOpacity="0.46" />

      {/* ── Breathing inner circles ── */}
      <circle cx={cx} cy={cy} r="48" fill="none" stroke="#D4A043" strokeWidth="1.2"
        style={{ animation: 'divine-pulse 4s ease-in-out infinite', opacity: 0.34 }} />
      <circle cx={cx} cy={cy} r="22" fill="none" stroke="#C67D53" strokeWidth="1.2" opacity="0.38" />

      {/* Bindu */}
      <circle cx={cx} cy={cy} r="6" fill="#C67D53"
        style={{ animation: 'divine-pulse 3s ease-in-out infinite', opacity: 0.55 }} />
      <circle cx={cx} cy={cy} r="2.5" fill="#D4A043" opacity="0.75" />
    </svg>
  )
}

export default function HeroSection() {
  const [snap, setSnap] = useState<PanchangSnap | null>(null)
  const [shlokaIdx, setShlokaIdx] = useState(0)
  const [shlokaVisible, setShlokaVisible] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    getUserLocation().then(loc => {
      fetch(`/api/panchang?lat=${loc.lat}&lng=${loc.lng}&date=${today}`)
        .then(r => r.json())
        .then(j => { if (j.success) setSnap({ tithi: j.data.tithi, nakshatra: j.data.nakshatra, yoga: j.data.yoga }) })
        .catch(() => {})
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setShlokaVisible(false)
      setTimeout(() => {
        setShlokaIdx(i => (i + 1) % SHLOKAS.length)
        setShlokaVisible(true)
      }, 400)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative bg-[var(--kutch-white)] overflow-hidden">
      {/* Fine dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(198,125,83,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* Ambient floating orbs */}
      <div className="ambient-orb animate-drift-1"
        style={{ width: 320, height: 320, top: '-80px', right: '10%', background: 'radial-gradient(circle, rgba(198,125,83,0.12) 0%, transparent 70%)' }} />
      <div className="ambient-orb animate-drift-2"
        style={{ width: 240, height: 240, bottom: '5%', left: '5%', background: 'radial-gradient(circle, rgba(185,152,107,0.10) 0%, transparent 70%)' }} />
      <div className="ambient-orb animate-drift-3"
        style={{ width: 180, height: 180, top: '40%', right: '30%', background: 'radial-gradient(circle, rgba(47,42,68,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Two-column split */}
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-6 items-center pt-12 pb-16 lg:pt-16 lg:pb-20">

          {/* ── Left column ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="flex flex-col"
          >
            {/* H1 */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[58px] sm:text-[74px] lg:text-[88px] leading-[1.04] tracking-[-0.022em] text-[var(--indigo-deep)] mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
            >
              Your Existence,
              <br />
              <span className="shimmer-text" style={{
                  textDecorationLine: 'underline',
                  textDecorationStyle: 'solid',
                  textDecorationColor: 'rgba(198,125,83,0.38)',
                  textDecorationThickness: '3px',
                  textUnderlineOffset: '8px',
              }}>
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
                <div className="absolute bottom-4 left-0 lg:-left-4 hidden sm:block z-10 animate-float">
                  <div
                    className="rounded-2xl border border-[var(--warm-sand)] bg-white/85 backdrop-blur-sm shadow-lg p-4 animate-glow"
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

        {/* ── Shloka carousel — full width below columns ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.52 }}
          className="border-t border-[var(--indigo-deep)]/10 py-8 px-4 sm:px-6 flex flex-col items-center gap-3"
        >
          <div
            style={{
              opacity: shlokaVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
              textAlign: 'center',
              maxWidth: '720px',
            }}
          >
            <p
              className="text-[15px] sm:text-[17px] leading-relaxed mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: 'var(--indigo-deep)', whiteSpace: 'pre-line' }}
            >
              {SHLOKAS[shlokaIdx].shloka}
            </p>
            <p
              className="text-[13px] leading-relaxed mb-1"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--indigo-deep)', opacity: 0.58 }}
            >
              {SHLOKAS[shlokaIdx].meaning}
            </p>
            <p
              className="text-[10px] uppercase tracking-widest"
              style={{ fontFamily: "'Sora', sans-serif", color: 'var(--terracotta)', opacity: 0.75 }}
            >
              — {SHLOKAS[shlokaIdx].source}
            </p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5 mt-1">
            {SHLOKAS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setShlokaVisible(false); setTimeout(() => { setShlokaIdx(i); setShlokaVisible(true) }, 400) }}
                aria-label={`Shloka ${i + 1}`}
                style={{
                  width: i === shlokaIdx ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === shlokaIdx ? 'var(--terracotta)' : 'rgba(28,30,74,0.18)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.3s, background 0.3s',
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
