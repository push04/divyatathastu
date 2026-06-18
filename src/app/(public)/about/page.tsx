import type { Metadata } from 'next'
import Link from 'next/link'
import SudarshanLoader from '@/components/SudarshanLoader'

export const metadata: Metadata = {
  title: 'About Us | MahaTathastu',
  description: "India's First 360° Holistic Life Platform - combining Vedic astrology, numerology, Ayurveda, and spiritual guidance.",
}

const TEAM = [
  { name: 'Acharya Devraj Sharma', role: 'Chief Vedic Astrologer', exp: '30+ years', icon: 'brightness_7' },
  { name: 'Dr. Meera Krishnan', role: 'Ayurveda & Prakriti Expert', exp: '20+ years', icon: 'eco' },
  { name: 'Pt. Suresh Mishra', role: 'Vastu Shastra Expert', exp: '25+ years', icon: 'house' },
  { name: 'Dr. Ananya Goswami', role: 'Numerology & DMIT', exp: '15+ years', icon: 'tag' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <div className="page-banner-inner max-w-3xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-6"><SudarshanLoader px={80} /></div>
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Our Story</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>About MahaTathastu</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-lg leading-relaxed">India's First 360° Holistic Life Platform - bridging ancient Vedic wisdom with modern AI technology to illuminate every soul's divine path.</p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--indigo-deep)] mb-6 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Our Mission</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'my_location', title: 'Accuracy', desc: 'Our Nakshatra AI engine combines Vedic calculations with machine learning for unparalleled accuracy in astrology reports.' },
              { icon: 'public', title: 'Accessibility', desc: 'Making 5,000 years of Vedic wisdom accessible to every Indian family - in their language, at their budget.' },
              { icon: 'favorite', title: 'Authenticity', desc: 'Every recommendation is validated by our panel of expert astrologers, Ayurvedic doctors, and Vastu consultants.' },
            ].map(v => (
              <div key={v.title} className="card-divine p-6 text-center">
                <div className="flex justify-center mb-4"><span className="material-symbols-outlined text-[40px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span></div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{v.title}</h3>
                <p className="text-sm text-[var(--warm-charcoal)]/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[var(--indigo-deep)]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '10,000+', label: 'Families Served' },
            { value: '14', label: 'Report Types' },
            { value: '98%', label: 'Satisfaction Rate' },
            { value: '5,000+', label: 'Years of Wisdom' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-[var(--saffron)] mb-1">{s.value}</div>
              <div className="text-sm text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--indigo-deep)] mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Our Expert Panel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEAM.map(t => (
              <div key={t.name} className="card-divine p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--indigo-deep)] text-base" style={{ fontFamily: "'Playfair Display', serif" }}>{t.name}</h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/70">{t.role}</p>
                  <p className="text-xs text-[var(--terracotta)]">{t.exp} experience</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold text-[var(--indigo-deep)] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Start Your Spiritual Journey</h2>
        <p className="text-[var(--warm-charcoal)]/60 mb-8 max-w-lg mx-auto">Join 10,000+ families who have discovered their divine path with MahaTathastu.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="btn-divine px-8 py-3">Get Started Free</Link>
          <Link href="/reports/generate" className="px-8 py-3 rounded-xl border-2 border-[var(--indigo-deep)] text-[var(--indigo-deep)] font-semibold hover:bg-[var(--indigo-deep)] hover:text-white transition-all">Generate Report</Link>
        </div>
      </section>
    </div>
  )
}
