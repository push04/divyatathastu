'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getUserLocation } from '@/lib/utils/getLocation'

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

const YANTRA_TEX = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='12,2 22,20 2,20' fill='none' stroke='white' stroke-width='0.5' stroke-opacity='0.03'/%3E%3Cpolygon points='12,22 2,4 22,4' fill='none' stroke='white' stroke-width='0.5' stroke-opacity='0.03'/%3E%3C/svg%3E")`

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
    <section className="py-8 bg-[var(--indigo-deep)]" style={{ backgroundImage: YANTRA_TEX }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_5fr_2fr] divide-y md:divide-y-0 md:divide-x divide-white/10 gap-0">

            {/* Left - date block */}
            <div className="flex items-start gap-4 pb-5 md:pb-0 md:pr-6">
              <div className="w-0.5 self-stretch bg-[var(--terracotta)] rounded-full opacity-70 flex-shrink-0" />
              <div>
                <p
                  className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--saffron)' }}
                >
                  Today's Panchang
                </p>
                <p
                  className="text-white leading-snug"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}
                >
                  {p.date}
                </p>
              </div>
            </div>

            {/* Center - 3×2 grid */}
            <div className="py-5 md:py-0 md:px-6">
              <div className="grid grid-cols-3">
                {cells.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={[
                      'py-2 px-3',
                      i < 3 ? 'border-b border-white/10' : '',
                      i % 3 !== 0 ? 'border-l border-white/10' : '',
                    ].join(' ')}
                  >
                    <p
                      className="text-[9px] uppercase tracking-widest mb-1"
                      style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.4)' }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-white font-semibold text-sm leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - CTA + rahu note */}
            <div className="flex flex-col justify-between gap-4 pt-5 md:pt-0 md:pl-6">
              <Link
                href="/panchang"
                className="self-start px-4 py-2 rounded-lg border border-white/20 text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ color: 'var(--saffron)', fontFamily: "'DM Sans', sans-serif" }}
              >
                Full Panchang{' '}
                <span className="material-symbols-outlined text-[13px]" style={{ verticalAlign: 'middle' }}>arrow_forward</span>
              </Link>
              <p
                className="text-[11px] leading-relaxed"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Rahu Kaal {p.rahuKaal} - avoid auspicious work
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
