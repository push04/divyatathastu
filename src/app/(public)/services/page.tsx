import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

import Icon from '@/components/ui/Icon'
export const revalidate = 3600

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
  { id: 'full_tathastu', icon: 'all_inclusive', label: 'Full Tathastu', badge: 'BEST VALUE', desc: 'The complete spiritual blueprint - all 14 reports in one comprehensive analysis for your entire family.', features: ['Kundli & Birth Chart', 'Numerology', 'Chakra Analysis', 'Prakriti (Ayurveda)', '10+ more reports', 'Lifetime access', 'All family members'] },
  { id: 'kundli', icon: 'brightness_7', label: 'Kundli / Horoscope', desc: 'Vedic birth chart with planetary positions, 12 houses, dashas, current transits, and predictions.', features: ['Lagna & Rashi', 'Planetary positions', 'Vimshottari Dasha', 'Mahadasha periods', 'Current transits'] },
  { id: 'numerology', icon: 'tag', label: 'Numerology', desc: 'Chaldean & Pythagorean numerology - life path, destiny, mobile number compatibility, lucky numbers.', features: ['Life Path Number', 'Destiny Number', 'Soul Urge Number', 'Mobile compatibility', 'Lucky numbers & colors'] },
  { id: 'chakra', icon: 'spa', label: 'Chakra Analysis', desc: 'All 7 chakras analyzed from your birth chart - balance levels, mantras, crystals, yoga, and foods.', features: ['7 chakra levels', 'Blocked/balanced status', 'Healing mantras', 'Crystals & gemstones', 'Dietary guidance'] },
  { id: 'prakriti', icon: 'eco', label: 'Prakriti (Ayurveda)', desc: 'Your Vata-Pitta-Kapha constitution derived from nakshatra - personalized diet, herbs, yoga & daily routine.', features: ['Dosha percentages', 'Dominant dosha', 'Personalized diet', 'Ayurvedic herbs', 'Daily routine'] },
  { id: 'yantra_colour', icon: 'palette', label: 'Yantra & Colour', desc: 'Personal yantra, power colors for success, gemstone recommendation with wearing protocol.', features: ['Personal yantra', 'Deity & mantra', 'Power colors', 'Wealth colors', 'Gemstone guidance'] },
  { id: 'mantra', icon: 'self_improvement', label: 'Mantra Science', desc: 'Your personal beej mantra, deity mantra, likhit japa (written mantra) guidance with full protocol.', features: ['Beej mantra', 'Deity mantra', 'Daily count', 'Likhit japa guide', 'Best timing'] },
  { id: 'mantra_writing', icon: 'edit_note', label: 'Likhit Japa (Mantra Lekhnan)', badge: 'NEW', desc: 'Nakshatra-specific written mantra practice with precise 4-step protocol - personalized Vishnu Sahasranama shloka for your pada.', features: ['Universal Ganpati mantra', 'Gayatri mantra', 'Nakshatra Ganpati', 'Vishnu Sahasranama shloka', 'Pada-specific guidance'] },
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

  // Fetch live prices and the bundle product in parallel - both are independent reads
  const [{ data: pricingRow }, { data: bundle }] = await Promise.all([
    (supabase as any).from('settings').select('value').eq('key', 'report_pricing').single(),
    supabase.from('products').select('price,sale_price').eq('slug', 'full-tathastu-bundle').single(),
  ])
  const livePrices: Record<string, number> = pricingRow?.value || {}

  const bundlePrice = livePrices['full_tathastu'] ?? bundle?.sale_price ?? bundle?.price ?? 2999
  const bundleOriginal = (bundle?.sale_price != null && bundle.price != null) ? bundle.price : null

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-3xl mx-auto">
          <p className="t-eyebrow t-eyebrow-dark mb-4 inline-block">The Nakshatra Engine</p>
          <h1 className="t-display-2 text-[var(--text-on-dark)] mb-4">Nakshatra Report System</h1>
          <div className="ornate-divider">
            <Icon name="yantra" size={16} className="text-[var(--gold-300)]" />
          </div>
          <p className="text-[var(--text-on-dark-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">14 Vedic reports covering every dimension of life, prepared in 60 seconds</p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-6xl mx-auto">
          {/* ── Signature tier. Same rule as the homepage grid: a card is dark
               because it is the bundle, and it says so on the badge. ── */}
          <div className="card-premium p-7 mb-6">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <span className="icon-frame icon-frame-dark w-16 h-16 rounded-2xl">
                <Icon name={SERVICES[0].icon} size={30} />
              </span>
              <div className="flex-1">
                <span className="badge-signature mb-3">
                  <Icon name="yantra" size={13} />
                  {SERVICES[0].badge || 'Signature'}
                </span>
                <h2 className="t-h2 text-[var(--text-on-dark)] mt-3 mb-2">{SERVICES[0].label}</h2>
                <p className="t-body-sm text-[var(--text-on-dark-secondary)] mb-4">{SERVICES[0].desc}</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICES[0].features.map(f => (
                    <span key={f} className="t-meta flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[var(--text-on-dark-secondary)]"
                      style={{ background: 'rgba(245,239,227,0.07)', border: '1px solid var(--border-dark-subtle)' }}>
                      <Icon name="check_circle" size={13} style={{ color: 'var(--gold-300)' }} />{f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="t-h1 text-[var(--gold-300)]">₹{bundlePrice.toLocaleString('en-IN')}</div>
                {bundleOriginal != null && (
                  <div className="t-body-sm text-[var(--text-on-dark-muted)] line-through">₹{bundleOriginal.toLocaleString('en-IN')}</div>
                )}
                <Link href="/reports/generate" className="btn-gold mt-3 w-full">Get Full Report</Link>
              </div>
            </div>
          </div>

          {/* ── The remaining reports use the same editorial treatment as the
               homepage grid: index numeral, icon frame, no resting shadow. ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.slice(1).map((s, i) => {
              const price = getPrice(s.id, livePrices)
              return (
                <div key={s.id} className="card-editorial group">
                  <div className="flex items-start justify-between mb-4">
                    <span className="icon-frame">
                      <Icon name={s.icon} size={22} />
                    </span>
                    <span className="card-editorial-index">{String(i + 1).padStart(2, '0')}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="t-h4 text-[var(--text-primary)] leading-tight">{s.label}</h3>
                    {'badge' in s && s.badge && (
                      <span className="badge-signature badge-signature-light">{s.badge}</span>
                    )}
                  </div>
                  <span className="t-data text-[var(--primary-strong)] block mb-3">₹{price.toLocaleString('en-IN')}</span>

                  <p className="t-body-sm text-[var(--text-muted)] mb-4 flex-1">{s.desc}</p>

                  <ul className="space-y-1 mb-5">
                    {s.features.slice(0, 3).map(f => (
                      <li key={f} className="t-meta text-[var(--text-secondary)] flex gap-2 items-center">
                        <Icon name="check_circle" size={14} className="text-[var(--primary)]" />{f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/reports/generate" className="btn-outline-divine w-full mt-auto">Generate Report</Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
