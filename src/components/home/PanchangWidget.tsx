'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { getUserLocation } from '@/lib/utils/getLocation'

/* ═══════════════════════════════════════════════════════════════════════════
   TODAY'S PANCHANG strip.

   Contrast fix: the TITHI / NAKSHATRA / YOGA / KARANA labels were 12px at
   weight 400 in rgba(255,255,255,0.4) - about 2.9:1 on the indigo ground,
   well under AA, and the smallest text on the page. They now use the shared
   .t-datalabel token: 13px, weight 700, --text-on-dark-muted at 6.0:1.
   The Rahu Kaal note was 30% white (≈2.2:1); it is now a real token too.
   ═══════════════════════════════════════════════════════════════════════════ */

interface PanchangData {
  tithi: string
  nakshatra: string
  yoga: string
  karana: string
  sunrise: string
  sunset: string
  rahuKaal: string
  date: string
}

export default function PanchangWidget() {
  const [p, setP] = useState<PanchangData | null>(null)

  useEffect(() => {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    getUserLocation().then(loc => {
      fetch(`/api/panchang?lat=${loc.lat}&lng=${loc.lng}&date=${dateStr}`)
        .then(r => r.json())
        .then(j => {
          if (j.success) {
            setP({
              tithi: j.data.tithi,
              nakshatra: j.data.nakshatra,
              yoga: j.data.yoga,
              karana: j.data.karana,
              sunrise: j.data.sunrise,
              sunset: j.data.sunset,
              rahuKaal: j.data.rahuKaal,
              date: dateLabel,
            })
          }
        })
        .catch(() => {})
    })
  }, [])

  if (!p) return null

  const cells = [
    { label: 'Tithi', value: p.tithi },
    { label: 'Nakshatra', value: p.nakshatra },
    { label: 'Yoga', value: p.yoga },
    { label: 'Karana', value: p.karana },
    { label: 'Sunrise', value: p.sunrise },
    { label: 'Sunset', value: p.sunset },
  ]

  return (
    <section className="py-8 relative overflow-hidden" style={{ background: 'var(--surface-dark)' }}>
      <div className="absolute inset-0 motif-yantra-tile-dark pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="rounded-[var(--radius-lg)] p-6 backdrop-blur-sm"
          style={{ background: 'rgba(245,239,227,0.05)', border: '1px solid var(--border-dark-subtle)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[3fr_5fr_2fr] divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--border-dark-subtle)' }}>

            {/* ── Date block ── */}
            <div className="flex items-start gap-4 pb-5 md:pb-0 md:pr-6">
              <span className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
              <div>
                <p className="t-eyebrow t-eyebrow-dark mb-2">Today&rsquo;s Panchang</p>
                <p className="t-h4 text-[var(--text-on-dark)]">{p.date}</p>
              </div>
            </div>

            {/* ── 3 × 2 data grid ── */}
            <div className="py-5 md:py-0 md:px-6">
              <dl className="grid grid-cols-2 sm:grid-cols-3">
                {cells.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={[
                      'py-2.5 px-3',
                      i < 3 ? 'sm:border-b' : '',
                      i % 3 !== 0 ? 'sm:border-l' : '',
                    ].join(' ')}
                    style={{ borderColor: 'var(--border-dark-subtle)' }}
                  >
                    <dt className="t-datalabel t-datalabel-dark mb-1">{label}</dt>
                    <dd className="t-body-sm font-semibold text-[var(--text-on-dark)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── CTA + Rahu Kaal ── */}
            <div className="flex flex-col justify-between gap-4 pt-5 md:pt-0 md:pl-6">
              <Link
                href="/panchang"
                className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors t-body-sm font-medium"
                style={{ color: 'var(--gold-300)', border: '1px solid rgba(201,153,46,0.34)' }}
              >
                Full Panchang
                <Icon name="arrow_forward" size={15} />
              </Link>
              <p className="t-meta text-[var(--text-on-dark-muted)]">
                <span className="t-datalabel t-datalabel-dark block mb-0.5">Rahu Kaal</span>
                {p.rahuKaal} - avoid auspicious work
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
