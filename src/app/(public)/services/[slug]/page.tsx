import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const SERVICES: Record<string, {
  title: string; subtitle: string; icon: string; reportId: string
  priceFrom: number; color: string; gradient: string
  description: string; includes: string[]; benefits: { icon: string; title: string; desc: string }[]
}> = {
  'astrology-report': {
    title: 'Vedic Astrology & Kundli Report',
    subtitle: 'Your birth chart decoded through 5,000 years of Jyotish wisdom',
    icon: 'brightness_7',
    reportId: 'kundli',
    priceFrom: 499,
    color: '#2F2A44',
    gradient: 'from-[#2F2A44] to-[#460B2F]',
    description: 'Your Kundli is a celestial map of your soul at the moment of birth. Our AI-powered Jyotish engine analyzes Lagna, Rashi, planetary positions, house lords, divisional charts, yogas, and Vimshottari Dasha to generate a report that traditional astrologers take hours to compile — delivered in minutes.',
    includes: [
      'Lagna & Rashi (Ascendant & Moon Sign)',
      'All 9 planetary positions and strengths',
      'Planetary yogas (Raj Yoga, Dhana Yoga, etc.)',
      'Vimshottari Dasha & Antardasha timeline',
      'Career and business path analysis',
      'Marriage, love & partnership insights',
      'Health, longevity & wellbeing guidance',
      'Gemstone & mantra remedy recommendations',
    ],
    benefits: [
      { icon: 'stars', title: 'Nakshatra-Precise', desc: 'Calculations accurate to the exact nakshatra pada of your birth time — not just your sun sign.' },
      { icon: 'psychology', title: 'AI-Powered Insights', desc: 'Over 200 classical yoga combinations analyzed by our Vedic AI engine for personalized guidance.' },
      { icon: 'download', title: 'Instant PDF', desc: 'Your full Kundli report with charts is ready to download as a PDF within seconds.' },
    ],
  },
  'numerology-report': {
    title: 'Master Numerology Report',
    subtitle: 'The sacred mathematics woven into your name and birth date',
    icon: 'tag',
    reportId: 'numerology',
    priceFrom: 299,
    color: '#C67D53',
    gradient: 'from-[#C67D53] to-[#B9986B]',
    description: 'Numbers carry divine vibrations — the Chaldean numerology tradition, refined over millennia, reveals the hidden patterns governing your life path, soul urge, and destiny. This report combines both Chaldean and Pythagorean systems for a complete numerical profile.',
    includes: [
      'Life Path Number — your soul\'s purpose',
      'Destiny Number from your full birth name',
      'Soul Urge Number — deepest desires',
      'Personality Number — how others see you',
      'Maturity Number — your evolved self',
      'Personal Year, Month & Day forecasts',
      'Name correction for better vibrations',
      'Lucky numbers, dates & power colors',
    ],
    benefits: [
      { icon: 'calculate', title: 'Dual System Analysis', desc: 'Both Chaldean (ancient) and Pythagorean systems analyzed for cross-verified accuracy.' },
      { icon: 'abc', title: 'Name Compatibility', desc: 'See how your current name\'s vibration aligns with your birth path number — and what adjustments could help.' },
      { icon: 'calendar_month', title: 'Year Forecast', desc: 'Monthly numerological weather forecast for the next 12 months included with every report.' },
    ],
  },
  'shakti-chakra-report': {
    title: 'Shakti & Chakra Analysis Report',
    subtitle: 'Unlock your energy body for complete transformation',
    icon: 'spa',
    reportId: 'chakra',
    priceFrom: 299,
    color: '#7C3AED',
    gradient: 'from-purple-700 to-indigo-800',
    description: 'Your seven chakras are spinning vortices of life energy (prana) that govern physical health, emotional balance, and spiritual evolution. Our analysis maps your chakra activation levels from your nakshatra and planetary placements, identifies specific blockages, and prescribes personalized healing protocols.',
    includes: [
      'All 7 chakra energy levels assessed',
      'Dominant and blocked chakra identification',
      'Kundalini Shakti activation status',
      'Specific healing mantras for each chakra',
      'Crystal and gemstone recommendations',
      'Yoga asanas for chakra balancing',
      'Pranayama (breathwork) protocols',
      'Color therapy and dietary guidance',
    ],
    benefits: [
      { icon: 'psychology', title: 'Astrologically Derived', desc: 'Chakra states are calculated from your actual planetary positions — not a generic quiz.' },
      { icon: 'self_improvement', title: 'Personalized Practice', desc: 'Your healing prescription is unique to your chakra profile, not one-size-fits-all advice.' },
      { icon: 'healing', title: 'Complete Protocol', desc: 'Mantra + crystal + food + yoga — a complete multi-modal healing system for each blocked chakra.' },
    ],
  },
  'prakriti-report': {
    title: 'Ayurvedic Prakriti Report',
    subtitle: 'Know your body-mind constitution for radiant health',
    icon: 'eco',
    reportId: 'prakriti',
    priceFrom: 299,
    color: '#059669',
    gradient: 'from-emerald-600 to-teal-700',
    description: 'Ayurveda says your Prakriti (body-mind constitution) is determined at birth and governs your health, temperament, and life patterns. This analysis derives your Vata-Pitta-Kapha constitution from your nakshatra, prescribes a personalized lifestyle, and reveals how to live in harmony with your innate nature.',
    includes: [
      'Vata-Pitta-Kapha constitution percentages',
      'Dominant dosha deep analysis',
      'Vikruti (current imbalance) assessment',
      'Personalized food & diet recommendations',
      'Daily routine (Dinacharya) prescription',
      'Seasonal practices (Ritucharya)',
      'Ayurvedic herbs and supplements',
      'Yoga style aligned with your prakriti',
    ],
    benefits: [
      { icon: 'eco', title: 'Nakshatra-Derived', desc: 'Your dosha is calculated from your lunar nakshatra — the most precise Ayurvedic method.' },
      { icon: 'restaurant', title: 'Practical Food Guide', desc: 'Specific foods to favor and avoid, meal timing, and seasonal dietary shifts for your dosha.' },
      { icon: 'schedule', title: 'Daily Routine Plan', desc: 'Wake time, exercise type, and evening routine tailored to keep your dominant dosha in balance.' },
    ],
  },
  'full-tathastu-bundle': {
    title: 'Full Tathastu Bundle',
    subtitle: 'India\'s most comprehensive personal transformation package',
    icon: 'auto_awesome',
    reportId: 'full_tathastu',
    priceFrom: 2999,
    color: '#D4A017',
    gradient: 'from-[#2F2A44] to-[#B9986B]',
    description: 'The Full Tathastu Bundle unifies all 14 sacred sciences into one complete life blueprint. This is our most powerful offering — a 360° view of who you are, where you are going, and how to live your dharma. It covers every dimension: stars, numbers, energy, body, mind, home, and soul.',
    includes: [
      'All 14 complete Vedic reports included',
      'Kundli, Nakshatra & Annual Prediction',
      'Numerology + Colour Therapy',
      'Shakti Chakra + Prakriti (Ayurveda)',
      'Vastu, Yantra & Mantra Science',
      'DMIT + Child Development (for families)',
      'Vedic Psychology + Remedies Summary',
      'Lifetime dashboard access + PDF downloads',
    ],
    benefits: [
      { icon: 'auto_awesome', title: 'Complete 360° View', desc: 'Every dimension of your life — career, health, relationships, spirituality — covered in one report.' },
      { icon: 'family_restroom', title: 'Full Family Coverage', desc: 'Add all family members and generate reports for each. One bundle price covers the whole household.' },
      { icon: 'savings', title: 'Best Value', desc: 'All 14 reports individually cost ₹5,200+. The bundle delivers everything at a fraction of the price.' },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = SERVICES[slug]
  if (!s) return { title: 'Service Not Found' }
  return {
    title: `${s.title} | MahaTathastu`,
    description: s.description.slice(0, 160),
    alternates: { canonical: `/services/${slug}` },
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = SERVICES[slug]
  if (!s) notFound()

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[var(--saffron)] text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
          </div>
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>MahaTathastu Report</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{s.title}</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-lg leading-relaxed max-w-xl mx-auto">{s.subtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/reports/generate"
              className="btn-divine px-8 py-3.5 text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              Generate This Report
            </Link>
            <span className="text-white/50 text-sm">Starting from ₹{s.priceFrom.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-[var(--warm-charcoal)]/70 leading-relaxed">{s.description}</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>Why Choose This Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {s.benefits.map(b => (
              <div key={b.title} className="card-divine p-6 text-center">
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <span className="material-symbols-outlined text-[24px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                </div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{b.title}</h3>
                <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>What&apos;s Included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s.includes.map(item => (
              <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-xl" style={{ border: '1px solid var(--warm-sand)' }}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5" style={{ color: 'var(--terracotta)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm text-[var(--warm-charcoal)]/80 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: 'person_add', title: 'Create Your Profile', desc: 'Add your birth date, time, and place to your MahaTathastu family dashboard.' },
              { step: '02', icon: 'auto_awesome', title: 'AI Generates Report', desc: 'Our Vedic AI engine calculates your full report in under 60 seconds.' },
              { step: '03', icon: 'download', title: 'Read & Download', desc: 'Access your complete report online and download as a beautiful PDF.' },
            ].map(step => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #460B2F)' }}>
                  <span className="material-symbols-outlined text-[28px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                </div>
                <div className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--terracotta)', fontFamily: "'Sora', sans-serif" }}>STEP {step.step}</div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{step.title}</h3>
                <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, #460B2F 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Begin Your {s.title.split(' ').slice(0, 2).join(' ')} Journey
          </h2>
          <p className="text-white/60 mb-8 text-lg">Create your free account, add your birth details, and unlock your report instantly.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/reports/generate" className="btn-divine px-10 py-4 text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              Generate Now — From ₹{s.priceFrom.toLocaleString('en-IN')}
            </Link>
            <Link href="/services" className="px-8 py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-colors">
              View All Services
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
