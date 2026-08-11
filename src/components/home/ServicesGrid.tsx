'use client'

import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { YantraWatermark } from '@/components/ui/Yantra'
import { useGsapScope } from '@/lib/motion/useGsap'

/* ═══════════════════════════════════════════════════════════════════════════
   THE 14 REPORTS - editorial card treatment.

   Previously every card here was the same white rounded rectangle used by
   Divine Services and How It Works, and one card in the grid was dark for no
   stated reason. Now:
     · reports use .card-editorial - index numeral, hairline rule, no resting
       shadow: a magazine contents page rather than a SaaS feature grid
     · the numeral treatment from the old "14" bundle card is extended
       system-wide (01 ... 09)
     · dark = premium tier ONLY, and always carries a Signature badge
   ═══════════════════════════════════════════════════════════════════════════ */

const REPORTS = [
  { id: 'astrology', icon: 'navagraha',  name: 'Vedic Astrology',         slug: 'astrology-report',         desc: 'Birth chart, planetary positions and life predictions read from your exact moment of birth.', tag: 'Core Focus' },
  { id: 'dmit',      icon: 'palm',       name: 'Neural Topology (DMIT)',  slug: 'dmit-report',              desc: 'Dermatoglyphic mapping that reveals innate psychological patterns and learning style.',        tag: 'DMIT' },
  { id: 'ayurveda',  icon: 'dosha',      name: 'Ayurvedic Dosha',         slug: 'prakriti-report',          desc: 'Your elemental body constitution, with diet and routine for holistic equilibrium.',            tag: 'Prakriti' },
  { id: 'vastu',     icon: 'shikhara',   name: 'Astro-Vastu',             slug: 'astro-vastu-report',       desc: 'Directional energy alignment for your home and workspace, mapped against your chart.',         tag: 'Vastu' },
  { id: 'chakra',    icon: 'chakra',     name: 'Shakti Chakra',           slug: 'shakti-chakra-report',     desc: 'Seven-chakra activation and healing practice for restoring energetic balance.',                tag: 'Chakra' },
  { id: 'mobile',    icon: 'waves',      name: 'Mobile Vibration',        slug: 'mobile-number-report',     desc: 'Numerological compatibility between your mobile number and your birth vibration.',             tag: 'Numerology' },
  { id: 'yantra',    icon: 'yantra',     name: 'Yantra & Colour',         slug: 'yantra-colour-report',     desc: 'A personal yantra and colour therapy prescription drawn from your planetary map.',             tag: 'Spiritual' },
  { id: 'child',     icon: 'child_care', name: 'Child Development',       slug: 'child-development-report', desc: 'Talent map and learning pathway guidance for children, from fingerprint and chart.',           tag: 'Kids' },
  { id: 'mantra',    icon: 'mantra',     name: 'Mantra Science',          slug: 'mantra-chanting-report',   desc: 'Your personal beej mantra, with likhit japa practice and a daily chanting schedule.',          tag: 'Spiritual' },
]

const NUMEROLOGY_NUMS = [
  { n: '07', l: 'Life Path' },
  { n: '11', l: 'Expression' },
  { n: '09', l: 'Soul Urge' },
]

const BUNDLE_PREVIEW = ['navagraha', 'palm', 'dosha', 'shikhara', 'chakra'] as const

/* ── Editorial report card ───────────────────────────────────────────────── */
function ReportCard({ r, index, className = '' }: { r: typeof REPORTS[0]; index: number; className?: string }) {
  return (
    <div className={className} data-gsap-item>
      <Link href="/register" className="card-editorial group h-full min-h-[190px]">
        <div className="flex items-start justify-between mb-4">
          <span className="icon-frame">
            <Icon name={r.icon} size={22} />
          </span>
          <span className="card-editorial-index">{String(index).padStart(2, '0')}</span>
        </div>

        {/* Eyebrow: was 12px / weight 400 / 30% opacity - the least legible
            text on the page. Now the shared .t-eyebrow token: 13px, weight
            700, full-strength colour at 9.6:1. */}
        <span className="t-eyebrow mb-2">{r.tag}</span>

        <h3 className="t-h4 text-[var(--text-primary)] mb-1.5">{r.name}</h3>
        <p className="t-body-sm text-[var(--text-muted)]">{r.desc}</p>
      </Link>
    </div>
  )
}

export default function ServicesGrid() {
  /* The one place on this page GSAP earns its keep: a stagger keyed to the
     grid's scroll position, sequenced across a 12-column bento layout that a
     native view() timeline can't order correctly. Everything else is CSS. */
  const gridRef = useGsapScope<HTMLDivElement>((gsap, scope) => {
    /* GSAP arrives after a dynamic import, so the grid can already be on
       screen by the time this runs (back-navigation, a #hash deep link, a
       short viewport). A `from` tween would then yank visible cards to
       opacity 0 and fade them back in - a flash of disappearing content.
       If the grid is already in view, leave it exactly as painted. */
    const { top } = scope.getBoundingClientRect()
    if (top < window.innerHeight * 0.78) return

    gsap.from(scope.querySelectorAll('[data-gsap-item]'), {
      opacity: 0,
      y: 28,
      duration: 0.6,
      ease: 'power2.out',
      stagger: { each: 0.06, from: 'start' },
      scrollTrigger: { trigger: scope, start: 'top 78%', once: true },
    })
  })

  return (
    <section className="section-padding bg-[var(--surface-light)] relative overflow-hidden">
      {/* Motif as connective tissue: the yantra now sits behind every section
          header, not only in the hero. */}
      <YantraWatermark size={420} className="-top-24 -right-24" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

        {/* ── Section header ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-14 reveal">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-block w-6 border-t border-[var(--primary)]/40" />
              <span className="t-eyebrow">14 Reports</span>
            </div>
            <h2 className="t-display-2 text-[var(--text-primary)]">
              The Tathastu<br />Report Ecosystem
            </h2>
          </div>
          <p className="t-body text-[var(--text-secondary)] md:text-right">
            Every report is generated uniquely from your birth data using the classical Vedic sciences.
          </p>
        </div>

        {/* ── Bento grid ── */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* ── PREMIUM TIER: the Full Bundle. Dark because it is the signature
               product - the badge states the reason, and it spans 8 columns so
               the grid reads it as the anchor rather than an odd one out. */}
          <div className="md:col-span-8" data-gsap-item>
            <Link href="/register" className="card-premium group flex flex-col justify-between h-full min-h-[300px] p-8">
              {/* The "14" watermark: origin of the numeral treatment that now
                  runs across every card in the grid. */}
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(120px, 16vw, 200px)',
                  fontWeight: 900,
                  color: 'var(--gold-500)',
                  opacity: 0.13,
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                14
              </span>

              <div className="relative z-10 sm:max-w-[62%]">
                <span className="badge-signature">
                  <Icon name="yantra" size={13} />
                  Signature
                </span>
                <h3 className="t-h2 text-[var(--text-on-dark)] mt-5 mb-3">Full Tathastu Bundle</h3>
                <p className="t-body-sm text-[var(--text-on-dark-secondary)]">
                  All 14 reports - the complete 360° life guidance system, covering every member of your family.
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap mt-8">
                <div className="flex -space-x-1.5">
                  {BUNDLE_PREVIEW.map(id => (
                    <span key={id} className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(245,239,227,0.08)', border: '1px solid rgba(201,153,46,0.34)', color: 'var(--gold-300)' }}>
                      <Icon name={id} size={15} />
                    </span>
                  ))}
                  <span className="w-8 h-8 rounded-full flex items-center justify-center t-data"
                    style={{ background: 'rgba(201,153,46,0.16)', border: '1px solid rgba(201,153,46,0.34)', color: 'var(--gold-300)', fontSize: '13px' }}>
                    +9
                  </span>
                </div>
                <span className="t-eyebrow t-eyebrow-dark flex items-center gap-1.5">
                  Start Now
                  <Icon name="arrow_forward" size={15} />
                </span>
              </div>
            </Link>
          </div>

          <ReportCard r={REPORTS[0]} index={1} className="md:col-span-4" />

          <ReportCard r={REPORTS[1]} index={2} className="md:col-span-4" />
          <ReportCard r={REPORTS[2]} index={3} className="md:col-span-4" />
          <ReportCard r={REPORTS[3]} index={4} className="md:col-span-4" />

          {/* ── PREMIUM TIER: Genetic Numerology. Also dark, also badged - the
               two dark cards on this page are now exactly the two signature-
               tier products, which is the entire rule. */}
          <div className="md:col-span-8" data-gsap-item>
            <Link href="/register" className="card-premium group flex flex-col justify-between h-full p-8">
              <div className="relative z-10">
                <span className="badge-signature">
                  <Icon name="bindu" size={13} />
                  Signature
                </span>
                <h3 className="t-h2 text-[var(--text-on-dark)] mt-5 mb-3">Genetic Numerology</h3>
                <p className="t-body-sm text-[var(--text-on-dark-secondary)] mb-7 max-w-md">
                  The resonance of your name and birth digits, forming a vibrational signature carried across generations.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {NUMEROLOGY_NUMS.map(({ n, l }) => (
                    <div key={l} className="border-b pb-3" style={{ borderColor: 'rgba(201,153,46,0.22)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 600, lineHeight: 1, color: 'var(--gold-500)' }}>
                        {n}
                      </div>
                      <div className="t-eyebrow mt-2" style={{ color: 'var(--text-on-dark-muted)', letterSpacing: '0.12em' }}>
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          <ReportCard r={REPORTS[4]} index={5} className="md:col-span-4" />

          <ReportCard r={REPORTS[5]} index={6} className="md:col-span-4" />
          <ReportCard r={REPORTS[6]} index={7} className="md:col-span-4" />
          <ReportCard r={REPORTS[7]} index={8} className="md:col-span-4" />

          <ReportCard r={REPORTS[8]} index={9} className="md:col-span-4" />

          {/* ── Tail CTA ── */}
          <div className="md:col-span-8" data-gsap-item>
            <div
              className="h-full min-h-[190px] rounded-[var(--radius)] border border-[var(--border-subtle)] flex flex-wrap gap-5 items-center justify-between px-8 py-6 motif-lotus-tile"
              style={{ background: 'var(--surface-light-sunken)' }}
            >
              <div>
                <p className="t-eyebrow mb-2">Full Ecosystem</p>
                <p className="t-h3 text-[var(--text-primary)]">Explore all 14 reports &amp; pricing</p>
              </div>
              <Link href="/services" className="btn-outline-divine shrink-0">
                View All
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
