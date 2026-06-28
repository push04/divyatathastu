'use client'

import Link from 'next/link'
import SudarshanLoader from '@/components/SudarshanLoader'

const DIVINE_SERVICES = [
  {
    href: '/gyanampeetham',
    label: 'Gyanampeetham',
    labelHi: 'ज्ञानपीठम्',
    desc: 'Live satsangs, guru-shishya wisdom sessions, monthly Q&A with senior Jyotish Acharya',
    icon: 'school',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderColor: '#d97706',
    badge: null,
    color: '#92400e',
  },
  {
    href: '/shop?category=vastu-paintings',
    label: 'Vastu Paintings',
    labelHi: 'वास्तु चित्र',
    desc: 'Sacred Vedic art energized with yantra geometry — for home harmony & positive energy',
    icon: 'palette',
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#3b82f6',
    badge: null,
    color: '#1e40af',
  },
  {
    href: '/sadhana',
    label: 'Saadhana',
    labelHi: 'साधना',
    desc: 'Personalized mantra deeksha, 21-day japa programs, guided spiritual practices from birth chart',
    icon: 'self_improvement',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    borderColor: '#7c3aed',
    badge: 'Book',
    color: '#6b21a8',
  },
  {
    href: '/mahaganpati',
    label: 'Mahaganpati',
    labelHi: 'महागणपति',
    desc: 'Ganesh Abhishek, Chaturthi rituals, remove obstacles — performed by trained priests',
    icon: 'brightness_5',
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    borderColor: '#db2777',
    badge: 'Book',
    color: '#9d174d',
  },
  {
    href: '/puja',
    label: 'Pooja & Rituals',
    labelHi: 'पूजा व अनुष्ठान',
    desc: 'Navgraha Homa, Rudrabhishek, Satyanarayan Katha — AI guide + expert booking',
    icon: 'local_fire_department',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    borderColor: '#ea580c',
    badge: 'Book',
    color: '#9a3412',
  },
  {
    href: '/ardra-jalam',
    label: 'Ardra Jalam',
    labelHi: 'आर्द्रा जलम्',
    desc: 'Sacred healing water charged under Ardra Nakshatra — limited batches, 500ml glass bottle',
    icon: 'water_drop',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
    borderColor: '#059669',
    badge: 'Special',
    color: '#065f46',
  },
  {
    href: '/ayurveda',
    label: 'Ayurveda & Medical Astrology',
    labelHi: 'आयुर्वेद व ज्योतिष',
    desc: 'Prakriti analysis, dosha assessment, planetary health signatures — holistic healing',
    icon: 'spa',
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)',
    borderColor: '#16a34a',
    badge: null,
    color: '#166534',
  },
  {
    href: '/courses',
    label: 'Learning Courses',
    labelHi: 'पाठ्यक्रम',
    desc: 'Vedic astrology, Vastu, numerology, meditation — live & recorded expert courses',
    icon: 'menu_book',
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)',
    borderColor: '#2563eb',
    badge: 'New',
    color: '#1e3a8a',
  },
]

export default function DivineServicesPage() {
  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero banner with golden frame */}
      <div style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
        borderBottom: '3px solid #D4A017',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(rgba(212,160,23,0.8) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        {/* Sudarshan watermark */}
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none">
          <SudarshanLoader px={200} spin={false} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-[10px] font-bold tracking-[0.5em] uppercase mb-3" style={{ color: '#D4A017', fontFamily: "'Sora', sans-serif" }}>
            Anushthaan India · Gyanampeetham
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 20px rgba(212,160,23,0.3)' }}>
            Divine Services
          </h1>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Eight sacred pathways of Vedic wisdom — from spiritual practice and sacred rituals to Ayurvedic healing and cosmic learning.
          </p>

          {/* Golden divider */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #D4A017)' }} />
            <span className="text-xl" style={{ color: '#D4A017' }}>ॐ</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #D4A017)' }} />
          </div>
        </div>
      </div>

      {/* Services grid */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5">
          {DIVINE_SERVICES.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex gap-5 items-start rounded-2xl p-5 border-2 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 bg-white"
              style={{ borderColor: s.borderColor + '30' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = s.borderColor + '80')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = s.borderColor + '30')}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                style={{ background: s.gradient }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-base text-[var(--indigo-deep)] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {s.label}
                  </h3>
                  {s.badge && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                      style={{ background: s.borderColor + '20', color: s.borderColor }}>
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-semibold mb-2" style={{ color: s.color, fontFamily: "'Sora', sans-serif" }}>{s.labelHi}</p>
                <p className="text-sm text-[var(--warm-charcoal)]/65 leading-relaxed">{s.desc}</p>
              </div>

              {/* Arrow */}
              <span className="material-symbols-outlined text-[20px] text-[var(--outline-variant)] shrink-0 mt-1 group-hover:translate-x-1 transition-transform"
                style={{ color: s.borderColor + '60' }}>arrow_forward</span>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)', border: '2px solid #D4A017' }}>
          <p className="text-[10px] tracking-[0.4em] uppercase font-bold mb-2" style={{ color: '#D4A017', fontFamily: "'Sora', sans-serif" }}>
            Personalized Guidance
          </p>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Not sure which path is right for you?
          </h2>
          <p className="text-white/50 text-sm mb-6">Book a 1-on-1 consultation with our Vedic experts for personalized guidance.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/consultations" className="btn-divine inline-flex items-center gap-2 px-6 py-3 text-sm">
              <span className="material-symbols-outlined text-[16px]">event</span>
              Book Consultation
            </Link>
            <Link href="/mailbox" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-white border border-white/20 hover:border-white/50 transition-all">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              Send a Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
