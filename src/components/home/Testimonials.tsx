'use client'

import { motion } from 'framer-motion'

const testimonials = [
  { name: 'Priya Sharma', location: 'Mumbai', avatar: 'PS', report: 'Full Bundle', text: "The Full Tathastu bundle completely changed how I understand my family. The child development report for my son was spot-on - identified his talent for music that we had been ignoring." },
  { name: 'Rajesh Gupta', location: 'Delhi', avatar: 'RG', report: 'Astro-Vastu', text: "Astro-Vastu report helped us rearrange our office. Within a month, business improved noticeably. The remedies were practical and specific, not generic advice." },
  { name: 'Anita Verma', location: 'Bangalore', avatar: 'AV', report: 'Numerology', text: "My numerology and psychology reports gave me such clarity about my career change. I finally understood why certain paths felt wrong. Best investment I've made this year." },
  { name: 'Suresh Patel', location: 'Ahmedabad', avatar: 'SP', report: 'Shakti Chakra', text: "The Shakti Chakra report identified my root chakra blockage perfectly. The healing mantras and crystal suggestions have made a real difference in my energy levels." },
  { name: 'Meera Krishnan', location: 'Chennai', avatar: 'MK', report: 'Prakriti', text: "Prakriti report revealed I am primarily Vata-Pitta. The diet and yoga recommendations aligned so well with what actually works for me. Remarkably accurate." },
  { name: 'Arun Tiwari', location: 'Varanasi', avatar: 'AT', report: 'Pilgrimage', text: "Our family pilgrimage to Char Dham was perfectly planned using the itinerary maker. The panchang timing for each temple made the experience spiritually powerful." },
]

const GRAD_A = 'linear-gradient(135deg, var(--terracotta), var(--saffron))'
const GRAD_B = 'linear-gradient(135deg, var(--indigo-deep), var(--plum-light, #7c6fa0))'

function TestimonialCard({ t, alt }: { t: typeof testimonials[0]; alt: boolean }) {
  return (
    <div
      className="relative bg-[var(--kutch-white)] border border-[var(--outline-variant)]/40 rounded-xl p-6 flex flex-col flex-shrink-0"
      style={{ width: '320px' }}
    >
      {/* Decorative quote mark */}
      <div
        className="absolute top-3 left-4 leading-none pointer-events-none select-none"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '64px',
          color: 'var(--terracotta)',
          opacity: 0.15,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      <p
        className="relative z-10 pt-7 text-sm leading-relaxed flex-1 mb-5"
        style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--indigo-deep)', opacity: 0.7 }}
      >
        {t.text}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: alt ? GRAD_A : GRAD_B }}
          >
            {t.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--indigo-deep)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.name}</p>
            <p className="text-xs text-[var(--indigo-deep)]/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.location}</p>
          </div>
        </div>
        <span
          className="text-[10px] text-[var(--indigo-deep)]/35"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {t.report}
        </span>
      </div>
    </div>
  )
}

const row1 = [...testimonials, ...testimonials]
const row2 = [...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)]

export default function Testimonials() {
  return (
    <section className="section-padding bg-[var(--warm-sand)] overflow-hidden">
      <style>{`
        @keyframes dtScrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes dtScrollRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dt-marquee { animation: none !important; overflow-x: auto; flex-wrap: wrap; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl text-[var(--indigo-deep)]"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
          >
            What families are saying
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-sm text-[var(--indigo-deep)]/50"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Real stories from families across India
          </motion.p>
        </div>
      </div>

      {/* Row 1 - scrolls left */}
      <div className="mb-4 overflow-hidden">
        <div
          className="dt-marquee flex gap-4"
          style={{ animation: 'dtScrollLeft 90s linear infinite', width: 'max-content' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
        >
          {row1.map((t, i) => (
            <TestimonialCard key={i} t={t} alt={i % 2 === 0} />
          ))}
        </div>
      </div>

      {/* Row 2 - scrolls right */}
      <div className="overflow-hidden">
        <div
          className="dt-marquee flex gap-4"
          style={{ animation: 'dtScrollRight 75s linear infinite', width: 'max-content' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
        >
          {row2.map((t, i) => (
            <TestimonialCard key={i} t={t} alt={i % 2 !== 0} />
          ))}
        </div>
      </div>
    </section>
  )
}
