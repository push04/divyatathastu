import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Our Services | MahaTathastu - 14 Vedic Reports',
  description: 'Explore all 14 Nakshatra reports: Kundli, Numerology, Chakra, Prakriti, Yantra, Mantra, Vastu, DMIT, and more.',
  alternates: { canonical: '/services' },
}

// Maps each service's id to the pricing key used in report_pricing settings
const PRICING_KEY: Record<string, string> = {
  full_tathastu:    'full_tathastu',
  kundli:           'astrology',
  numerology:       'numerology',
  chakra:           'shakti_chakra',
  prakriti:         'prakriti',
  yantra_colour:    'yantra_colour',
  mantra:           'mantra_chanting',
  mantra_writing:   'mantra_writing',
  vastu:            'astro_vastu',
  child_development:'child_development',
  dmit:             'dmit',
  colour_therapy:   'colour_therapy',
  psychology:       'psychology',
}

const DEFAULT_PRICES: Record<string, number> = {
  full_tathastu: 2999, astrology: 499, numerology: 299, shakti_chakra: 299,
  prakriti: 299, yantra_colour: 299, mantra_chanting: 299, mantra_writing: 199,
  astro_vastu: 399, child_development: 399, dmit: 499, colour_therapy: 299, psychology: 399,
}

const SERVICES = [
  { id: 'full_tathastu', icon: 'auto_awesome', label: 'Full Tathastu', badge: 'BEST VALUE', desc: 'The complete spiritual blueprint - all 14 reports in one comprehensive analysis for your entire family.', features: ['Kundli & Birth Chart', 'Numerology', 'Chakra Analysis', 'Prakriti (Ayurveda)', '10+ more reports', 'Lifetime access', 'All family members'] },
  { id: 'kundli', icon: 'brightness_7', label: 'Kundli / Horoscope', desc: 'Vedic birth chart with planetary positions, 12 houses, dashas, current transits, and predictions.', features: ['Lagna & Rashi', 'Planetary positions', 'Vimshottari Dasha', 'Mahadasha periods', 'Current transits'] },
  { id: 'numerology', icon: 'tag', label: 'Numerology', desc: 'Chaldean & Pythagorean numerology - life path, destiny, mobile number compatibility, lucky numbers.', features: ['Life Path Number', 'Destiny Number', 'Soul Urge Number', 'Mobile compatibility', 'Lucky numbers & colors'] },
  { id: 'chakra', icon: 'spa', label: 'Chakra Analysis', desc: 'All 7 chakras analyzed from your birth chart - balance levels, mantras, crystals, yoga, and foods.', features: ['7 chakra levels', 'Blocked/balanced status', 'Healing mantras', 'Crystals & gemstones', 'Dietary guidance'] },
  { id: 'prakriti', icon: 'eco', label: 'Prakriti (Ayurveda)', desc: 'Your Vata-Pitta-Kapha constitution derived from nakshatra - personalized diet, herbs, yoga & daily routine.', features: ['Dosha percentages', 'Dominant dosha', 'Personalized diet', 'Ayurvedic herbs', 'Daily routine'] },
  { id: 'yantra_colour', icon: 'palette', label: 'Yantra & Colour', desc: 'Personal yantra, power colors for success, gemstone recommendation with wearing protocol.', features: ['Personal yantra', 'Deity & mantra', 'Power colors', 'Wealth colors', 'Gemstone guidance'] },
  { id: 'mantra', icon: 'self_improvement', label: 'Mantra Science', desc: 'Your personal beej mantra, deity mantra, likhit japa (written mantra) guidance with full protocol.', features: ['Beej mantra', 'Deity mantra', 'Daily count', 'Likhit japa guide', 'Best timing'] },
  { id: 'mantra_writing', icon: 'edit_note', label: 'Likhit Japa (Mantra Lekhnan)', badge: 'NEW', desc: 'Nakshatra-specific written mantra practice with precise 4-step protocol — personalized Vishnu Sahasranama shloka for your pada.', features: ['Universal Ganpati mantra', 'Gayatri mantra', 'Nakshatra Ganpati', 'Vishnu Sahasranama shloka', 'Pada-specific guidance'] },
  { id: 'vastu', icon: 'house', label: 'Vastu Report', desc: 'Home and office Vastu analysis with direction-based remedies, color suggestions, and zone healing.', features: ['Direction analysis', 'Vastu score', 'Defect identification', 'Easy remedies', 'Zone mapping'] },
  { id: 'child_development', icon: 'child_care', label: 'Child Development', desc: 'Learning style, natural talents, ideal career paths, and parenting approach based on nakshatra.', features: ['Learning style', 'Natural talents', 'Career aptitude', 'Parenting tips', 'Education path'] },
  { id: 'dmit', icon: 'psychology', label: 'DMIT Report', desc: 'Dermatoglyphics Multiple Intelligence Test mapping based on Howard Gardner\'s 8 intelligences.', features: ['8 intelligences', 'Dominant intelligence', 'Career fit', 'Study methods', 'Leadership style'] },
  { id: 'colour_therapy', icon: 'colorize', label: 'Colour Therapy', desc: 'Vedic color healing - specific colors for health, wealth, relationships, and home based on planets.', features: ['Health colors', 'Wealth colors', 'Love colors', 'Home colors', 'Colors to avoid'] },
  { id: 'psychology', icon: 'neurology', label: 'Vedic Psychology', desc: 'Moon sign personality profile, EQ analysis, shadow work, and relationship compatibility patterns.', features: ['Moon personality', 'Emotional intelligence', 'Shadow work', 'Relationship patterns', 'Growth areas'] },
]

function getPrice(serviceId: string, livePrices: Record<string, number>): number {
  const key = PRICING_KEY[serviceId]
  if (key && livePrices[key] != null) return livePrices[key]
  if (key && DEFAULT_PRICES[key] != null) return DEFAULT_PRICES[key]
  return 299
}

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch live prices from settings table
  const { data: pricingRow } = await (supabase as any)
    .from('settings')
    .select('value')
    .eq('key', 'report_pricing')
    .single()
  const livePrices: Record<string, number> = pricingRow?.value || {}

  // Full Tathastu bundle — also check products table for sale_price
  const { data: bundle } = await supabase
    .from('products')
    .select('price,sale_price')
    .eq('slug', 'full-tathastu-bundle')
    .single()

  const bundlePrice = livePrices['full_tathastu'] ?? bundle?.sale_price ?? bundle?.price ?? 2999
  const bundleOriginal = (bundle?.sale_price != null && bundle.price != null) ? bundle.price : null

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-3xl mx-auto">
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>The Nakshatra Engine</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Nakshatra Report System</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-lg max-w-2xl mx-auto leading-relaxed">14 AI-powered Vedic reports covering every dimension of life - generated in 60 seconds</p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-6xl mx-auto">
          {/* Featured */}
          <div className="card-divine p-6 mb-6 border-2 border-[var(--terracotta)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="icon-divine w-16 h-16 rounded-2xl flex-shrink-0 shadow-lg shadow-[var(--terracotta)]/30">
                <span className="material-symbols-outlined text-[32px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{SERVICES[0].icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>{SERVICES[0].label}</h2>
                  {SERVICES[0].badge && <span className="text-xs bg-[var(--terracotta)] text-white px-2 py-0.5 rounded-full font-bold">{SERVICES[0].badge}</span>}
                </div>
                <p className="text-[var(--warm-charcoal)]/70 mb-3">{SERVICES[0].desc}</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICES[0].features.map(f => <span key={f} className="text-xs bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/70 px-2.5 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{f}</span>)}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-[var(--indigo-deep)]">₹{bundlePrice.toLocaleString('en-IN')}</div>
                {bundleOriginal != null && (
                  <div className="text-sm text-[var(--warm-charcoal)]/40 line-through">₹{bundleOriginal.toLocaleString('en-IN')}</div>
                )}
                <Link href="/reports/generate" className="btn-divine mt-3 px-6 py-2.5 text-sm block text-center">Get Full Report</Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.slice(1).map(s => {
              const price = getPrice(s.id, livePrices)
              return (
                <div key={s.id} className="card-divine p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="icon-divine w-10 h-10 rounded-xl flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-[var(--indigo-deep)] text-base leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{s.label}</h3>
                        {'badge' in s && s.badge && <span className="text-[10px] bg-[var(--terracotta)] text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{s.badge}</span>}
                      </div>
                      <span className="text-sm font-bold text-[var(--terracotta)]">₹{price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--warm-charcoal)]/70 mb-3 flex-1">{s.desc}</p>
                  <div className="space-y-1 mb-4">
                    {s.features.slice(0, 3).map(f => <p key={f} className="text-xs text-[var(--warm-charcoal)]/60 flex gap-1.5 items-center"><span className="material-symbols-outlined text-[12px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{f}</p>)}
                  </div>
                  <Link href="/reports/generate" className="text-center py-2 rounded-lg border border-[var(--indigo-deep)] text-[var(--indigo-deep)] text-sm font-medium hover:bg-[var(--indigo-deep)] hover:text-white transition-all">Generate Report</Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
