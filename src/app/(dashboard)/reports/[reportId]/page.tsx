'use client'

import SudarshanLoader from '@/components/SudarshanLoader'
import KundliWheel from '@/components/charts/KundliWheel'
import NumerologyGrid from '@/components/charts/NumerologyGrid'
import ChakraChart from '@/components/charts/ChakraChart'
import { NorthIndianKundli, NavamshaChart, DashaTimeline } from '@/components/charts/VedicCharts'

import { useEffect, useState, useRef, useMemo, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

class SectionErrorBoundary extends Component<{ children: ReactNode; name?: string }, { error: Error | null }> {
  constructor(props: { children: ReactNode; name?: string }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary${this.props.name ? ` ${this.props.name}` : ''}]`, error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card-divine p-6 text-center print:hidden">
          <span className="material-symbols-outlined text-[32px] text-amber-400 mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="font-semibold text-[var(--indigo-deep)] text-sm">This section could not be displayed</p>
          <p className="text-xs text-[var(--warm-charcoal)]/50 mt-1">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

interface Report {
  id: string
  report_type: string
  status: string
  report_content: any
  created_at: string
  family_members: { full_name: string; date_of_birth: string; place_of_birth: string | null } | null
}

const REPORT_TITLES: Record<string, string> = {
  full_tathastu: 'Full Tathastu Report', astrology: 'Kundli & Birth Chart',
  numerology: 'Numerology Analysis', shakti_chakra: 'Shakti Chakra Report',
  prakriti: 'Prakriti (Ayurveda)', yantra_colour: 'Yantra & Colour Therapy',
  mantra_chanting: 'Mantra Chanting Guide', mantra_writing: 'Likhit Japa Guide',
  astro_vastu: 'Astro Vastu Report', psychology: 'Vedic Psychology',
  dmit: 'DMIT Intelligence Profile', colour_therapy: 'Colour Therapy',
  child_development: 'Child Development', mobile_number: 'Mobile Number Analysis',
}

const REPORT_TITLES_HI: Record<string, string> = {
  full_tathastu: 'पूर्ण तथास्तु रिपोर्ट', astrology: 'कुंडली और जन्म कुंडली',
  numerology: 'अंकशास्त्र विश्लेषण', shakti_chakra: 'शक्ति चक्र रिपोर्ट',
  prakriti: 'प्रकृति (आयुर्वेद)', yantra_colour: 'यंत्र और रंग चिकित्सा',
  mantra_chanting: 'मंत्र जप मार्गदर्शन', mantra_writing: 'लिखित जप मार्गदर्शन',
  astro_vastu: 'ज्योतिष वास्तु रिपोर्ट', psychology: 'वैदिक मनोविज्ञान',
  dmit: 'DMIT बुद्धिमत्ता प्रोफाइल', colour_therapy: 'रंग चिकित्सा',
  child_development: 'बाल विकास', mobile_number: 'मोबाइल नंबर विश्लेषण',
}

function Section({ title, icon, children, printAlwaysOpen }: { title: string; icon?: string; children: React.ReactNode; printAlwaysOpen?: boolean }) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('print')
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setOpen(true) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="card-divine overflow-hidden print:overflow-visible print:shadow-none print:border-0 print:rounded-none print:mb-3">
      {/* Screen: accordion toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left print:hidden"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>}
          <h2 className="font-black text-[var(--indigo-deep)] text-lg">{title}</h2>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/40">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {/* Print: static section heading */}
      <div className="hidden print:block px-5 pt-3 pb-2" style={{ borderBottom: '1.5px solid rgba(212,160,23,0.35)' }}>
        <h2 className="font-black text-[var(--indigo-deep)] text-base m-0">{title}</h2>
      </div>
      {/* Content */}
      <div className={`${open ? 'block' : 'hidden'} print:block px-5 pb-5 border-t border-[var(--warm-sand)] print:border-0 print:pt-3`}>
        {children}
      </div>
    </div>
  )
}

function nameToColor(name: unknown): string {
  if (!name || typeof name !== 'string') return '#c4a882'
  const map: Record<string, string> = {
    red: '#ef4444', 'dark red': '#991b1b', 'deep red': '#7f1d1d', 'blood red': '#b91c1c',
    orange: '#f97316', 'dark orange': '#ea580c', saffron: '#f59e0b', amber: '#f59e0b',
    yellow: '#eab308', 'light yellow': '#fde68a', gold: '#d97706', 'pale yellow': '#fef9c3',
    green: '#22c55e', 'light green': '#86efac', 'dark green': '#15803d', emerald: '#10b981',
    blue: '#3b82f6', 'light blue': '#93c5fd', 'dark blue': '#1d4ed8', 'sky blue': '#38bdf8', 'pale blue': '#dbeafe',
    navy: '#1e3a8a', indigo: '#6366f1', violet: '#7c3aed', purple: '#a855f7', 'dark purple': '#7e22ce',
    pink: '#ec4899', 'light pink': '#f9a8d4', 'soft pink': '#fda4af', rose: '#fb7185',
    lavender: '#c4b5fd', 'light lavender': '#ede9fe', lilac: '#d8b4fe',
    white: '#f8fafc', 'warm white': '#fef9f0', cream: '#fef3c7', ivory: '#fffff0',
    silver: '#cbd5e1', grey: '#9ca3af', gray: '#9ca3af',
    black: '#1e293b', 'dark maroon': '#450a0a', maroon: '#7f1d1d', brown: '#92400e',
    turquoise: '#2dd4bf', teal: '#0d9488', cyan: '#06b6d4', aqua: '#22d3ee',
    coral: '#f87171', salmon: '#fca5a5', peach: '#fdba74', magenta: '#e879f9',
  }
  const lower = name.toLowerCase().trim()
  if (map[lower]) return map[lower]
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v
  }
  // Try CSS named colors as broader fallback
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#c4a882'
      ctx.fillStyle = lower
      const resolved = ctx.fillStyle
      if (resolved !== '#c4a882') return resolved
    }
  } catch {}
  return '#c4a882'
}

function ColorSwatch({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const bg = nameToColor(name)
  const dim = size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-6 h-6' : 'w-3.5 h-3.5'
  const isLight = ['#f8fafc','#fef9f0','#fef3c7','#fef9c3','#fde68a','#fef9c3','#fffff0','#dbeafe','#ede9fe','#fce7f3','#f9a8d4','#fdba74'].includes(bg)
  return (
    <span
      className={`${dim} rounded-full flex-shrink-0 border shadow-sm`}
      style={{ backgroundColor: bg, borderColor: isLight ? '#d1d5db' : 'rgba(255,255,255,0.35)' }}
      title={name}
    />
  )
}

function ColorBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white border border-[var(--warm-sand)] font-medium text-[var(--indigo-deep)] shadow-sm">
      <ColorSwatch name={name} size="sm" />
      {name}
    </span>
  )
}

function InfoCard({ label, value, large }: { label: string; value: string | number | undefined; large?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <div className="bg-[var(--warm-sand)] rounded-xl p-3 text-center">
      <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">{label}</p>
      <p className={`font-bold text-[var(--indigo-deep)] ${large ? 'text-2xl' : ''}`}>{value}</p>
    </div>
  )
}

function KundliSection({ data, birthDate }: { data: any; birthDate?: string }) {
  if (!data) return null
  const k = data.kundli || data
  const analysis = data.analysis
  return (
    <Section title="Kundli & Birth Chart" icon="brightness_7">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <InfoCard label="Ascendant (Lagna)" value={k.ascendant} />
        <InfoCard label="Moon Sign (Rashi)" value={k.moonSign} />
        <InfoCard label="Sun Sign" value={k.sunSign} />
        <InfoCard label="Nakshatra" value={k.nakshatra} />
        <InfoCard label="Nakshatra Pada" value={k.nakshatraPada ? `Pada ${k.nakshatraPada}` : undefined} />
        <InfoCard label="Current Dasha" value={k.currentDasha} />
        <InfoCard label="Antardasha" value={k.currentAntardasha} />
        <InfoCard label="Dasha Lord" value={k.dashaLord} />
      </div>

      {/* Indian Chart Grids */}
      {k.planets?.length > 0 && k.ascendant && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>grid_4x4</span>
              North Indian Kundli (D-1)
            </h3>
            <NorthIndianKundli kundli={k} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[var(--plum)]" style={{ fontVariationSettings: "'FILL' 1" }}>grid_4x4</span>
              Navamsha Chart (D-9)
            </h3>
            <NavamshaChart kundli={k} />
          </div>
        </div>
      )}

      {/* Vimshottari Dasha Timeline */}
      {k.dashaLord && (
        <div className="mt-6">
          <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>timeline</span>
            Vimshottari Dasha Sequence
          </h3>
          <DashaTimeline kundli={k} birthDate={birthDate} />
        </div>
      )}

      {k.planets?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-3">Planetary Positions</h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--warm-sand)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 text-xs">
                  <th className="text-left px-3 py-2.5 font-semibold">Planet</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Sign (Rashi)</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Degree</th>
                  <th className="text-left px-3 py-2.5 font-semibold">House</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Nakshatra</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Pada</th>
                </tr>
              </thead>
              <tbody>
                {k.planets.map((p: any, i: number) => (
                  <tr key={p.name} className={`border-t border-[var(--warm-sand)] ${i % 2 === 0 ? '' : 'bg-[var(--warm-sand)]/30'}`}>
                    <td className="px-3 py-2 font-semibold text-[var(--indigo-deep)]">
                      {p.name}
                      {p.retrograde && <span className="ml-1 text-xs text-[var(--terracotta)]">(R)</span>}
                    </td>
                    <td className="px-3 py-2 text-[var(--warm-charcoal)]/80">{p.rashi}</td>
                    <td className="px-3 py-2 text-[var(--warm-charcoal)]/60">{p.degree?.toFixed(2)}°</td>
                    <td className="px-3 py-2 text-[var(--warm-charcoal)]/80">{p.house}</td>
                    <td className="px-3 py-2 text-[var(--warm-charcoal)]/70">{p.nakshatra}</td>
                    <td className="px-3 py-2 text-[var(--warm-charcoal)]/60">{p.pada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-5 space-y-4">
          {analysis.yogas?.length > 0 && (
            <div>
              <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                Yogas in your Chart
              </h3>
              <div className="space-y-2">
                {analysis.yogas.map((y: any) => (
                  <div key={y.name} className="bg-gradient-to-r from-[var(--warm-sand)] to-amber-50 rounded-xl p-3 border-l-4 border-[var(--saffron)]">
                    <p className="font-bold text-[var(--indigo-deep)] text-sm">{y.name}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/70 mt-0.5">{y.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Career Outlook', icon: 'work', value: analysis.career },
              { label: 'Relationships', icon: 'favorite', value: analysis.marriage },
              { label: 'Health Focus', icon: 'favorite_border', value: analysis.health },
              { label: 'Finance', icon: 'payments', value: analysis.finance },
            ].filter(i => i.value).map(item => (
              <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-4">
                <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>

          {analysis.currentPhase && (
            <div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-4 text-white">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Current Dasha Phase</p>
              <p className="text-sm leading-relaxed">{analysis.currentPhase}</p>
            </div>
          )}

          {analysis.nakshatraProfile && (
            <div className="bg-[var(--warm-sand)] rounded-xl p-4">
              <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Nakshatra Profile</p>
              <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed">{analysis.nakshatraProfile}</p>
            </div>
          )}

          {analysis.houseThemes?.length > 0 && (
            <div>
              <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Key House Influences</h3>
              <div className="space-y-1.5">
                {analysis.houseThemes.map((h: any) => (
                  <div key={h.house} className="flex gap-3 text-sm py-1.5 border-b border-[var(--warm-sand)]">
                    <span className="font-bold text-[var(--terracotta)] w-24 flex-shrink-0">{h.house}</span>
                    <span className="text-[var(--warm-charcoal)]/70">{h.insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.remedies?.length > 0 && (
            <div className="bg-[var(--warm-sand)] rounded-xl p-4">
              <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-2">Remedies</p>
              {analysis.remedies.map((r: string, i: number) => (
                <p key={i} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  )
}

function NumerologySection({ data }: { data: any }) {
  const n = data.numerology || data
  if (!n?.lifePathNumber) return null
  return (
    <Section title="Numerology Analysis" icon="tag">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <InfoCard label="Life Path" value={n.lifePathNumber} large />
        <InfoCard label="Destiny" value={n.destinyNumber} large />
        <InfoCard label="Soul Urge" value={n.soulUrgeNumber} large />
        <InfoCard label="Personality" value={n.personalityNumber} large />
        <InfoCard label="Chaldean Name" value={n.chaldeanNameNumber} />
        <InfoCard label="Personal Year" value={n.personalYearNumber} />
        <InfoCard label="Birthday Number" value={n.birthdayNumber} />
        <InfoCard label="Maturity Number" value={n.maturityNumber} />
      </div>

      {n.interpretation?.lifePath && (
        <div className="mt-4 bg-gradient-to-br from-violet-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-violet-400">
          <p className="text-sm font-bold text-[var(--indigo-deep)] mb-1">Life Path {n.lifePathNumber}: {n.interpretation.lifePathTitle || 'Your Soul Mission'}</p>
          <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed">{n.interpretation.lifePath}</p>
        </div>
      )}

      {n.interpretation?.destiny && (
        <div className="mt-3 bg-[var(--warm-sand)] rounded-xl p-3">
          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Destiny Number {n.destinyNumber}</p>
          <p className="text-sm text-[var(--warm-charcoal)]/80">{n.interpretation.destiny}</p>
        </div>
      )}

      {n.interpretation?.soulUrge && (
        <div className="mt-3 bg-[var(--warm-sand)] rounded-xl p-3">
          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Soul Urge Number {n.soulUrgeNumber}</p>
          <p className="text-sm text-[var(--warm-charcoal)]/80">{n.interpretation.soulUrge}</p>
        </div>
      )}

      {n.interpretation?.personalYear && (
        <div className="mt-3 bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] rounded-xl p-3 border-l-4 border-[var(--saffron)]">
          <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Personal Year {n.personalYearNumber} - {new Date().getFullYear()}</p>
          <p className="text-sm text-[var(--warm-charcoal)]/80">{n.interpretation.personalYear}</p>
        </div>
      )}

      {n.luckyNumbers?.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap items-center">
          {n.luckyNumbers.map((num: number) => (
            <span key={num} className="px-3 py-1.5 bg-[var(--indigo-deep)] text-white text-sm rounded-full font-bold">{num}</span>
          ))}
          <span className="text-xs text-[var(--warm-charcoal)]/50 self-center ml-1">Lucky Numbers</span>
        </div>
      )}

      {n.luckyDays?.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap items-center">
          {n.luckyDays.map((d: string) => (
            <span key={d} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">{d}</span>
          ))}
          <span className="text-xs text-[var(--warm-charcoal)]/50 self-center ml-1">Lucky Days</span>
        </div>
      )}

      {n.karmaNumbers?.length > 0 && (
        <div className="mt-3 bg-[var(--warm-sand)] rounded-xl p-3">
          <p className="text-xs font-bold text-[var(--terracotta)]/80 uppercase tracking-wider mb-1">Karmic Lessons</p>
          <p className="text-sm text-[var(--warm-charcoal)]/70">{n.interpretation?.karmaLesson || `Numbers ${n.karmaNumbers.join(', ')} indicate areas where karmic growth is needed.`}</p>
        </div>
      )}
    </Section>
  )
}

function ChakraSection({ data }: { data: any }) {
  const chakras = Array.isArray(data) ? data : (data.chakras || data)
  if (!chakras?.length) return null
  const CD = [
    { color: '#DC2626', bgFrom: '#fca5a5', bgTo: '#fee2e2', borderHex: '#f87171' },
    { color: '#C2410C', bgFrom: '#fed7aa', bgTo: '#fff7ed', borderHex: '#fb923c' },
    { color: '#B45309', bgFrom: '#fde68a', bgTo: '#fef9c3', borderHex: '#fcd34d' },
    { color: '#15803D', bgFrom: '#bbf7d0', bgTo: '#dcfce7', borderHex: '#86efac' },
    { color: '#0369A1', bgFrom: '#bae6fd', bgTo: '#e0f2fe', borderHex: '#7dd3fc' },
    { color: '#4338CA', bgFrom: '#c7d2fe', bgTo: '#eef2ff', borderHex: '#a5b4fc' },
    { color: '#6D28D9', bgFrom: '#ddd6fe', bgTo: '#f5f3ff', borderHex: '#c4b5fd' },
  ]
  return (
    <Section title="Shakti Chakra Analysis" icon="local_florist">
      {/* Rainbow overview bar */}
      <div className="mt-4 mb-5 flex gap-1 h-5 rounded-full overflow-hidden">
        {chakras.map((c: any, i: number) => (
          <div
            key={c.name || i}
            className="flex-1 rounded-sm"
            style={{ backgroundColor: CD[i]?.color || '#9ca3af', opacity: Math.min(1, (c.level || 50) / 100 + 0.35) }}
            title={`${c.name}: ${c.level}%`}
          />
        ))}
      </div>

      <div className="space-y-3">
        {chakras.map((c: any, i: number) => {
          const cd = CD[i] || { color: '#9ca3af', bgFrom: '#f3f4f6', bgTo: '#f9fafb', borderHex: '#d1d5db' }
          const isBalanced = c.status === 'balanced'
          const isBlocked = c.status === 'blocked'
          return (
            <div key={c.name || i} className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${cd.bgFrom}, ${cd.bgTo})`, border: `1.5px solid ${cd.borderHex}` }}>
              <div className="flex items-start gap-4">
                {/* Glowing chakra circle */}
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: cd.color, boxShadow: `0 0 18px ${cd.color}60` }}
                >
                  <span className="text-sm font-black leading-none">{c.level ?? '–'}%</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <div>
                      <span className="font-bold text-[var(--indigo-deep)]">{c.name}</span>
                      {c.sanskrit && <span className="ml-1.5 text-xs text-[var(--warm-charcoal)]/50 italic">{c.sanskrit}</span>}
                      {c.element && <span className="ml-1.5 text-[10px] text-[var(--warm-charcoal)]/40">· {c.element}</span>}
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold text-white ${isBalanced ? 'bg-emerald-500' : isBlocked ? 'bg-red-500' : 'bg-amber-500'}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="bg-white/50 rounded-full h-2 overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${c.level ?? 0}%`, backgroundColor: cd.color }} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {c.mantras?.length > 0 && (
                      <div className="bg-white/60 rounded-xl p-2.5">
                        <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Beej Mantra</p>
                        <p className="font-black text-base leading-none" style={{ color: cd.color }}>{c.mantras[0]}</p>
                      </div>
                    )}
                    {c.crystals?.length > 0 && (
                      <div className="bg-white/60 rounded-xl p-2.5">
                        <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Crystals</p>
                        <p className="text-[var(--indigo-deep)] font-medium">{c.crystals.slice(0, 2).join(', ')}</p>
                      </div>
                    )}
                    {c.yoga?.length > 0 && (
                      <div className="bg-white/60 rounded-xl p-2.5">
                        <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Yoga</p>
                        <p className="text-[var(--indigo-deep)] font-medium">{c.yoga[0]}</p>
                      </div>
                    )}
                    {c.foods?.length > 0 && (
                      <div className="bg-white/60 rounded-xl p-2.5">
                        <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Foods</p>
                        <p className="text-[var(--indigo-deep)] font-medium">{c.foods.slice(0, 2).join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {c.affirmations?.length > 0 && (
                    <p className="mt-2.5 text-xs italic text-[var(--warm-charcoal)]/60 border-l-2 pl-2.5" style={{ borderColor: cd.color }}>
                      "{c.affirmations[0]}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function YantraSection({ data }: { data: any }) {
  if (!data) return null
  return (
    <Section title="Yantra & Colour Therapy" icon="palette">
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-[var(--saffron)]">
          <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Personal Yantra</p>
          <p className="font-bold text-[var(--indigo-deep)] text-base">{data.primaryYantra?.name}</p>
          <p className="text-xs mt-1 text-[var(--warm-charcoal)]/60">Deity: {data.primaryYantra?.deity}</p>
          <p className="text-xs mt-1 italic text-[var(--warm-charcoal)]/70">{data.primaryYantra?.mantra}</p>
        </div>
        <div className="bg-gradient-to-br from-[var(--warm-sand)] to-rose-50 rounded-xl p-4 border-l-4 border-rose-400">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Power Gemstone</p>
          <p className="font-bold text-[var(--indigo-deep)] text-base">{data.gemstone?.primary}</p>
          <p className="text-xs mt-1 text-[var(--warm-charcoal)]/60">Wear on {data.gemstone?.finger} finger</p>
          <p className="text-xs mt-0.5 text-[var(--warm-charcoal)]/60">Metal: {data.gemstone?.metal}</p>
        </div>
      </div>

      {data.colourTherapy?.power && (
        <div className="mt-4">
          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Power Colours</p>
          <div className="flex gap-2 flex-wrap">
            {(Array.isArray(data.colourTherapy.power) ? data.colourTherapy.power : [data.colourTherapy.power]).map((c: string) => (
              <ColorBadge key={c} name={c} />
            ))}
          </div>
        </div>
      )}

      {data.primaryYantra?.benefits?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Yantra Benefits</p>
          <div className="flex gap-2 flex-wrap">
            {data.primaryYantra.benefits.map((b: string) => (
              <span key={b} className="text-xs bg-[var(--warm-sand)] px-2.5 py-1 rounded-full text-[var(--warm-charcoal)]/70">{b}</span>
            ))}
          </div>
        </div>
      )}

      {data.primaryYantra?.installation && (
        <div className="mt-3 bg-[var(--warm-sand)] rounded-xl p-3">
          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">How to Install</p>
          <p className="text-sm text-[var(--warm-charcoal)]/70">{data.primaryYantra.installation}</p>
        </div>
      )}

      {data.colourTherapy && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {data.colourTherapy.forHealth && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="font-bold text-emerald-700 mb-1.5">For Health</p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(data.colourTherapy.forHealth) ? data.colourTherapy.forHealth : [data.colourTherapy.forHealth]).map((c: string) => (
                  <ColorBadge key={c} name={c} />
                ))}
              </div>
            </div>
          )}
          {data.colourTherapy.forWealth && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="font-bold text-amber-700 mb-1.5">For Wealth</p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(data.colourTherapy.forWealth) ? data.colourTherapy.forWealth : [data.colourTherapy.forWealth]).map((c: string) => (
                  <ColorBadge key={c} name={c} />
                ))}
              </div>
            </div>
          )}
          {data.colourTherapy.avoid && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="font-bold text-red-700 mb-1.5">Avoid</p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(data.colourTherapy.avoid) ? data.colourTherapy.avoid : [data.colourTherapy.avoid]).map((c: string) => (
                  <ColorBadge key={c} name={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}

const NAKSHATRA_LORDS: Record<string, string> = {
  Ashwini: 'Ketu', Bharani: 'Venus', Krittika: 'Sun', Rohini: 'Moon',
  Mrigashira: 'Mars', Ardra: 'Rahu', Punarvasu: 'Jupiter', Pushya: 'Saturn',
  Ashlesha: 'Mercury', Magha: 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
  Hasta: 'Moon', Chitra: 'Mars', Swati: 'Rahu', Vishakha: 'Jupiter',
  Anuradha: 'Saturn', Jyeshtha: 'Mercury', Moola: 'Ketu', 'Purva Ashadha': 'Venus',
  'Uttara Ashadha': 'Sun', Shravana: 'Moon', Dhanishtha: 'Mars', Shatabhisha: 'Rahu',
  'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', Revati: 'Mercury',
}
const PLANET_PRACTICE: Record<string, { penColor: string; paperColor: string; bestTime: string; bestDay: string; deity: string; benefit: string }> = {
  Sun:     { penColor: 'Red / saffron ink pen', paperColor: 'Yellow or white paper', bestTime: 'Sunrise (6–8 AM)', bestDay: 'Sunday', deity: 'Lord Surya / Lord Rama', benefit: 'Enhances confidence, leadership, vitality, and paternal blessings. Strengthens the Lagna and overall health.' },
  Moon:    { penColor: 'Silver / white ink pen', paperColor: 'White paper', bestTime: 'Brahma Muhurta (4–6 AM)', bestDay: 'Monday', deity: 'Lord Shiva / Goddess Parvati', benefit: 'Brings peace of mind, emotional stability, mental clarity, and maternal blessings.' },
  Mars:    { penColor: 'Red ink pen', paperColor: 'Red or saffron paper', bestTime: 'Sunrise (6–8 AM)', bestDay: 'Tuesday', deity: 'Lord Hanuman / Lord Kartikeya', benefit: 'Builds courage, removes obstacles and enemies, and strengthens willpower and physical vitality.' },
  Mercury: { penColor: 'Green ink pen', paperColor: 'Green or white paper', bestTime: 'Morning (7–9 AM)', bestDay: 'Wednesday', deity: 'Lord Vishnu / Goddess Saraswati', benefit: 'Improves intellect, communication skills, business success, and educational attainment.' },
  Jupiter: { penColor: 'Yellow / golden ink pen', paperColor: 'Yellow paper', bestTime: 'Brahma Muhurta (4–6 AM)', bestDay: 'Thursday', deity: 'Lord Brihaspati / Lord Vishnu', benefit: 'Brings wisdom, prosperity, good health, spiritual growth, and teacher–student relationships.' },
  Venus:   { penColor: 'White / pink ink pen', paperColor: 'Pink or white paper', bestTime: 'Sunrise or evening', bestDay: 'Friday', deity: 'Goddess Lakshmi / Goddess Durga', benefit: 'Brings love, harmony, creativity, luxury, beauty, and marital happiness.' },
  Saturn:  { penColor: 'Blue / black ink pen', paperColor: 'White or blue paper', bestTime: 'Early morning (5–7 AM)', bestDay: 'Saturday', deity: 'Lord Shani / Lord Bhairava', benefit: 'Removes karmic blocks, brings discipline, stability, longevity, and professional success.' },
  Rahu:    { penColor: 'Blue ink pen', paperColor: 'Blue or grey paper', bestTime: 'After sunset (7–9 PM)', bestDay: 'Saturday', deity: 'Goddess Durga / Goddess Kali', benefit: 'Transforms hidden obstacles into opportunities, removes past-life karmas, and amplifies ambitions.' },
  Ketu:    { penColor: 'Red / brown ink pen', paperColor: 'White or grey paper', bestTime: 'Brahma Muhurta (4–6 AM)', bestDay: 'Tuesday', deity: 'Lord Ganesha / Lord Bhairava', benefit: 'Brings spiritual liberation, removes deep past-life karma, enhances intuition and moksha path.' },
}

function MantraSection({ data }: { data: any }) {
  // Resolve chanting: may live at data.chanting (standalone) or data.mantras.chanting (full report)
  const chantingSource = data?.chanting ? data : (data?.mantras?.chanting ? data.mantras : null)
  const hasLekhnan = !!data?.mantraLekhnan
  const hasChanting = !!chantingSource?.chanting

  if (!hasLekhnan && !hasChanting) return null

  return (
    <>
    {hasLekhnan && (() => {
    const ml = data.mantraLekhnan
    // full_tathastu provides lekhnanMember (normalized); standalone mantra_writing provides member directly
    const m = data.lekhnanMember || data.member
    return (
      <Section title="Customized Mantra Lekhan Report" icon="edit_note">
        {/* Opening invocation */}
        <div className="mt-4 bg-gradient-to-br from-[var(--saffron)]/10 to-[var(--indigo-deep)]/10 rounded-xl p-4 text-center border border-[var(--saffron)]/30">
          <p className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-wider mb-2">उद्घाटन मंत्र</p>
          <p className="text-sm font-bold text-[var(--indigo-deep)] leading-relaxed">{ml.openingInvocation}</p>
        </div>

        {/* Customer info */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'नाम', value: m?.name },
            { label: 'जन्म तिथि', value: m?.dob },
            { label: 'जन्म समय', value: m?.tob },
            { label: 'जन्म स्थान', value: m?.pob },
            { label: 'जन्म लग्न', value: m?.lagna },
            { label: 'नक्षत्र', value: `${ml.nakshatra} पद ${ml.pada}` },
            { label: 'गोत्र', value: m?.gotra },
          ].filter(i => i.value).map(item => (
            <div key={item.label} className="bg-[var(--warm-sand)] rounded-lg p-2">
              <p className="text-[var(--warm-charcoal)]/50">{item.label}</p>
              <p className="font-semibold text-[var(--indigo-deep)] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Purpose */}
        <div className="mt-3 bg-[var(--warm-sand)] rounded-xl p-4">
          <p className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-wider mb-1">उद्देश्य</p>
          <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed">{ml.purpose}</p>
        </div>

        {/* Section header */}
        <div className="mt-4 text-center">
          <p className="text-base font-black text-[var(--indigo-deep)]">{ml.nakshatra} Nakshatra Astrology</p>
          <p className="text-sm font-bold text-[var(--plum)] mt-0.5">{ml.nakshatra} Nakshatra Pada - {ml.pada}</p>
        </div>

        {/* Instruction note */}
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800 leading-relaxed">{ml.instruction}</p>
        </div>

        {/* 4 Steps */}
        <div className="mt-4 space-y-3 ml-steps">
          {/* Step 1 */}
          <div className="border border-[var(--indigo-deep)]/20 rounded-xl overflow-hidden">
            <div className="bg-[var(--indigo-deep)] px-4 py-2 flex items-center justify-between">
              <p className="text-white text-sm font-bold">चरण 1 — सार्वभौमिक गणपति मंत्र</p>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{ml.step1.times}× लिखें</span>
            </div>
            <div className="p-4 bg-white text-center space-y-1">
              <p className="text-2xl font-bold text-[var(--indigo-deep)] leading-relaxed">{ml.step1.mantra}</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60 italic">{ml.step1.transliteration}</p>
              <p className="text-xs text-[var(--warm-charcoal)]/50">({ml.step1.meaning})</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-[var(--saffron)]/30 rounded-xl overflow-hidden">
            <div className="bg-[var(--saffron)] px-4 py-2 flex items-center justify-between">
              <p className="text-white text-sm font-bold">चरण 2 — गायत्री मंत्र</p>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{ml.step2.times}× लिखें</span>
            </div>
            <div className="p-4 bg-white text-center">
              <p className="text-base font-bold text-[var(--indigo-deep)] leading-relaxed">{ml.step2.mantra}</p>
            </div>
          </div>

          {/* Step 3 */}
          {ml.step3 ? (
            <div className="border border-[var(--plum)]/30 rounded-xl overflow-hidden">
              <div className="bg-[var(--plum)] px-4 py-2 flex items-center justify-between">
                <p className="text-white text-sm font-bold">चरण 3 — नक्षत्र गणपति मंत्र</p>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{ml.step3.times}× लिखें</span>
              </div>
              <div className="p-4 bg-white text-center space-y-1">
                <p className="text-2xl font-bold text-[var(--plum)] leading-relaxed">{ml.step3.mantra}</p>
                <p className="text-sm text-[var(--warm-charcoal)]/60 italic">{ml.step3.transliteration}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">({ml.step3.meaning})</p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
              <p className="text-xs text-[var(--warm-charcoal)]/50">चरण 3 — पुष्य नक्षत्र के लिए नक्षत्र गणपति मंत्र नहीं है</p>
            </div>
          )}

          {/* Step 4 */}
          <div className="border border-teal-400/40 rounded-xl overflow-hidden">
            <div className="bg-teal-600 px-4 py-2 flex items-center justify-between">
              <p className="text-white text-sm font-bold">चरण 4 — विष्णु सहस्रनाम श्लोक</p>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{ml.step4.times}× लिखें</span>
            </div>
            <div className="p-4 bg-white space-y-3">
              <p className="text-xs text-[var(--warm-charcoal)]/40 text-right">श्लोक {ml.step4.number}</p>
              <p className="text-lg font-bold text-[var(--indigo-deep)] leading-relaxed text-center">{ml.step4.sanskrit}</p>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-wider mb-1">अर्थ</p>
                <p className="text-xs text-[var(--warm-charcoal)]/70 leading-relaxed">{ml.step4.arth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Materials & Schedule */}
        {(() => {
          const lord = (() => {
            if (!ml.nakshatra) return 'Jupiter'
            const direct = NAKSHATRA_LORDS[ml.nakshatra.trim()]
            if (direct) return direct
            const lower = ml.nakshatra.trim().toLowerCase()
            for (const [k, v] of Object.entries(NAKSHATRA_LORDS)) {
              if (k.toLowerCase() === lower) return v
            }
            return 'Jupiter'
          })()
          const practice = PLANET_PRACTICE[lord] || PLANET_PRACTICE.Jupiter
          return (
            <>
              <div className="mt-5">
                <p className="text-sm font-extrabold text-[var(--indigo-deep)] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  अभ्यास विवरण — {ml.nakshatra} नक्षत्र ({lord} राशि)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#92400e' }}>सामग्री सूची (Required Materials)</p>
                    <div className="space-y-1.5">
                      {[
                        ['कलम', practice.penColor],
                        ['कागज', practice.paperColor],
                        ['देवता', practice.deity],
                        ['आसन', 'स्वच्छ ऊनी या सूती आसन'],
                        ['दिशा', 'पूर्व या उत्तर मुख'],
                      ].map(([k, v]) => (
                        <p key={k} className="text-xs" style={{ color: '#78350f' }}>
                          <span className="font-semibold">{k}:</span> {v}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#1e3a8a' }}>समय सारणी (Optimal Schedule)</p>
                    <div className="space-y-1.5">
                      {[
                        ['श्रेष्ठ समय', practice.bestTime],
                        ['श्रेष्ठ दिन', practice.bestDay],
                        ['न्यूनतम', '21 दिन (स्थिरता)'],
                        ['अनुशंसित', '41 दिन (परिवर्तन)'],
                        ['आदर्श', '108 दिन (पूर्णसिद्धि)'],
                      ].map(([k, v]) => (
                        <p key={k} className="text-xs" style={{ color: '#1e40af' }}>
                          <span className="font-semibold">{k}:</span> {v}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spiritual Benefits */}
              <div className="mt-3 rounded-xl p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-bold mb-1.5" style={{ color: '#14532d' }}>
                  फलश्रुति — आध्यात्मिक लाभ (Spiritual Benefits)
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>{practice.benefit}</p>
                <p className="text-xs leading-relaxed mt-1" style={{ color: '#15803d' }}>
                  इस विशेष अभ्यास से लग्न नक्षत्र की ऊर्जा संतुलित होती है। लग्न नक्षत्र शक्तिशाली होने पर जीवन के सभी क्षेत्रों — स्वास्थ्य, करियर, संबंध, और आध्यात्मिकता — में सकारात्मक परिवर्तन आते हैं।
                </p>
              </div>

              {/* Progress milestones */}
              <div className="mt-3 grid grid-cols-4 gap-2 text-center ml-progress">
                {([
                  { days: '21', label: 'स्थिरता', color: '#d97706', bg: '#fffbeb', desc: 'Habit forms' },
                  { days: '41', label: 'परिवर्तन', color: '#dc2626', bg: '#fef2f2', desc: 'Changes begin' },
                  { days: '90', label: 'सिद्धि', color: '#7c3aed', bg: '#f5f3ff', desc: 'Siddhi attained' },
                  { days: '108', label: 'पूर्णता', color: '#1e3a8a', bg: '#eff6ff', desc: 'Full completion' },
                ] as const).map(ms => (
                  <div key={ms.days} className="rounded-lg p-2" style={{ background: ms.bg, border: `1px solid ${ms.color}40` }}>
                    <p className="text-xl font-black" style={{ color: ms.color }}>{ms.days}</p>
                    <p className="text-xs font-bold" style={{ color: ms.color }}>{ms.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>{ms.desc}</p>
                  </div>
                ))}
              </div>

              {/* Important Rules */}
              <div className="mt-3 rounded-xl p-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <p className="text-xs font-bold mb-2" style={{ color: '#7c2d12' }}>
                  महत्वपूर्ण नियम (Practice Rules — Must Follow)
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    'स्नान के बाद ही लिखना शुरू करें',
                    'दाएं हाथ से लिखें, बाएं से नहीं',
                    'शुद्ध आसन पर बैठें, जमीन पर नहीं',
                    'मन एकाग्र रखें, बात न करें',
                    'चरणों का क्रम न तोड़ें',
                    'किसी को लिखी हुई सामग्री न दिखाएं',
                    'प्रतिदिन एक ही समय पर अभ्यास करें',
                    'लिखे हुए पृष्ठों को पवित्र स्थान पर सुरक्षित रखें',
                    '108 दिन पूर्ण होने पर जल में प्रवाहित करें',
                    'भोजन के तुरंत बाद न लिखें (30 मिनट अंतराल रखें)',
                  ].map((rule, i) => (
                    <p key={i} className="text-xs flex gap-1 items-start" style={{ color: '#92400e' }}>
                      <span className="font-bold shrink-0" style={{ color: '#c2410c' }}>•</span>{rule}
                    </p>
                  ))}
                </div>
              </div>

              {/* Closing Prayer */}
              <div className="mt-3 rounded-xl p-4 text-center" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <p className="text-xs font-bold mb-2" style={{ color: '#4c1d95' }}>
                  समापन प्रार्थना (Closing Sankalpa — Write After Each Session)
                </p>
                <p className="text-sm font-bold leading-relaxed" style={{ color: '#5b21b6' }}>
                  ॐ तत् सत् | यत् फलम् अस्तु तत् सर्वं श्री गुरुचरणार्पणम् अस्तु ॥
                </p>
                <p className="text-xs mt-1 italic" style={{ color: '#7c3aed' }}>
                  "May all fruits of this practice be dedicated at the lotus feet of the Guru and the Divine"
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 ml-closing-breakdown">
                  {[
                    { label: 'Before Writing', value: 'Sankalpa — सत्य संकल्प' },
                    { label: 'While Writing', value: 'Single-pointed focus' },
                    { label: 'After Writing', value: 'Closing prayer above' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg p-2" style={{ background: 'white', border: '1px solid #ddd6fe' }}>
                      <p className="text-[10px] font-bold" style={{ color: '#6d28d9' }}>{item.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#7c3aed' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shloka sequence visual */}
              <div className="mt-3 rounded-xl p-3 ml-seq-visual" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-bold mb-2 text-center" style={{ color: '#334155' }}>
                  दैनिक लेखन अनुक्रम (Daily Writing Sequence)
                </p>
                <div className="flex items-center gap-1 flex-wrap justify-center text-xs">
                  {[
                    { label: 'Step 1', desc: 'Ganpati mantra × 5', color: '#1e3a8a' },
                    { label: '→', desc: '', color: '#94a3b8' },
                    { label: 'Step 2', desc: 'Gayatri × 5', color: '#d97706' },
                    { label: '→', desc: '', color: '#94a3b8' },
                    { label: 'Step 3', desc: `${ml.nakshatra} Ganpati × 5`, color: '#6d28d9' },
                    { label: '→', desc: '', color: '#94a3b8' },
                    { label: 'Step 4', desc: `VS Shloka ${ml.step4.number} × 3`, color: '#0f766e' },
                    { label: '→', desc: '', color: '#94a3b8' },
                    { label: 'Closing', desc: 'Sankalpa', color: '#7c2d12' },
                  ].map((item, i) => (
                    item.desc ? (
                      <div key={i} className="rounded-lg px-2 py-1 text-center" style={{ background: item.color + '15', border: `1px solid ${item.color}40` }}>
                        <p className="text-[9px] font-bold" style={{ color: item.color }}>{item.label}</p>
                        <p className="text-[9px]" style={{ color: item.color }}>{item.desc}</p>
                      </div>
                    ) : <span key={i} style={{ color: '#94a3b8', fontWeight: 700 }}>→</span>
                  ))}
                </div>
              </div>
            </>
          )
        })()}
      </Section>
    )
    })()}
    {hasChanting && (() => {
      const { chanting, likhitJapa, namaAkshara } = chantingSource!
      return (
    <Section title="Mantra Chanting Guidance" icon="temple_hindu">
      <div className="mt-4 space-y-4">
        <div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-5 text-white text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Your Beej Mantra</p>
          <p className="text-2xl font-bold leading-relaxed">{chanting.beejMantra}</p>
          <p className="text-sm mt-3 text-white/80">Chant <span className="font-bold">{chanting.dailyCount}</span> times daily</p>
          <p className="text-xs mt-1 text-white/50">Best time: {chanting.bestTime} · Face {chanting.direction} · Mala: {chanting.mala}</p>
        </div>

        {namaAkshara && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-4 text-center">
            <p className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-wider mb-1">Nama Akshara (Birth Syllable)</p>
            <p className="text-3xl font-bold text-[var(--indigo-deep)]">{namaAkshara}</p>
            {chanting.namaJapaGuidance && <p className="text-xs text-[var(--warm-charcoal)]/60 mt-2 leading-relaxed">{chanting.namaJapaGuidance}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Planet Mantra', value: chanting.planetMantra },
            { label: 'Deity', value: chanting.deity },
            { label: 'Nakshatra Mantra', value: chanting.nakshatraMantra },
            { label: 'Best Day', value: chanting.bestDay },
          ].filter(i => i.value).map(item => (
            <div key={item.label} className="bg-[var(--warm-sand)] rounded-lg p-3">
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-0.5">{item.label}</p>
              <p className="font-medium text-[var(--indigo-deep)] text-xs">{item.value}</p>
            </div>
          ))}
        </div>

        {chanting.sequence?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Chanting Ritual Sequence</p>
            {chanting.sequence.map((s: string, i: number) => (
              <div key={i} className="flex gap-3 py-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-[var(--saffron)] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-[var(--warm-charcoal)]/70">{s}</span>
              </div>
            ))}
          </div>
        )}

        {likhitJapa && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-4">
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Likhit Japa (Written Mantra Practice)</p>
            <p className="text-sm text-[var(--warm-charcoal)]/80 font-medium">{likhitJapa.mantra}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-[var(--warm-charcoal)]/50">Count: </span><span>{likhitJapa.count}</span></div>
              <div><span className="text-[var(--warm-charcoal)]/50">Pen: </span><span>{likhitJapa.pen}</span></div>
              <div><span className="text-[var(--warm-charcoal)]/50">Paper: </span><span>{likhitJapa.paper}</span></div>
            </div>
          </div>
        )}
      </div>
    </Section>
      )
    })()}
    </>
  )
}

function VastuSection({ data }: { data: any }) {
  if (!data) return null
  return (
    <Section title="Astro Vastu Analysis" icon="house">
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.powerDirections?.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-[var(--warm-sand)] rounded-xl p-3 border-l-4 border-teal-400">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Power Directions</p>
              <p className="font-bold text-[var(--indigo-deep)]">{data.powerDirections.join(', ')}</p>
            </div>
          )}
          {data.currentDashaLord && (
            <div className="bg-[var(--warm-sand)] rounded-xl p-3">
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Ruling Planet</p>
              <p className="font-bold text-[var(--indigo-deep)]">{data.currentDashaLord}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {[
            { label: 'Entrance', icon: 'door_front', value: data.entrance },
            { label: 'Master Bedroom', icon: 'bed', value: data.bedroom },
            { label: 'Study Room', icon: 'menu_book', value: data.studyRoom },
            { label: 'Kitchen', icon: 'cooking', value: data.kitchen },
            { label: 'Prayer Room', icon: 'temple_hindu', value: data.prayerRoom },
          ].filter(i => i.value).map(item => (
            <div key={item.label} className="flex gap-3 items-start py-2.5 border-b border-[var(--warm-sand)]">
              <span className="material-symbols-outlined text-[16px] text-[var(--saffron)] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              <span className="text-sm font-semibold text-[var(--indigo-deep)] w-28 flex-shrink-0">{item.label}</span>
              <span className="text-sm text-[var(--warm-charcoal)]/70">{item.value}</span>
            </div>
          ))}
        </div>

        {data.colors && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Room Colors</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(data.colors).map(([room, color]) => (
                <div key={room} className="bg-[var(--warm-sand)] rounded-lg p-2.5 text-xs">
                  <p className="font-bold text-[var(--indigo-deep)]/60 capitalize mb-0.5">{room.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-[var(--warm-charcoal)]/70">{color as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.plants?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Recommended Plants</p>
            <div className="flex gap-2 flex-wrap">
              {data.plants.map((p: string) => (
                <span key={p} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">{p}</span>
              ))}
            </div>
          </div>
        )}

        {data.remedies?.length > 0 && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-4">
            <p className="text-xs font-bold text-[var(--terracotta)] uppercase tracking-wider mb-2">Vastu Remedies</p>
            {data.remedies.map((r: string, i: number) => (
              <p key={i} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {r}</p>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

function MuhurtaSection({ data }: { data: any }) {
  if (!data) return null
  const TIMING_ITEMS = [
    { label: 'Education & Learning', icon: 'school', value: data.forEducation },
    { label: 'Marriage & Relationships', icon: 'favorite', value: data.forMarriage },
    { label: 'Career & Business', icon: 'work', value: data.forCareer },
    { label: 'Investments & Finance', icon: 'payments', value: data.forInvestment },
    { label: 'Health & Wellness', icon: 'favorite_border', value: data.forHealth },
    { label: 'Travel & Journeys', icon: 'flight_takeoff', value: data.forTravel },
    { label: 'Property Purchase', icon: 'home', value: data.forPropertyPurchase },
  ]
  return (
    <Section title="Muhurta - Auspicious Timing Guide" icon="schedule">
      <div className="mt-4 space-y-5">
        {data.overview && (
          <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-[var(--saffron)]">
            {data.overview}
          </p>
        )}

        {/* Lucky / Unlucky days */}
        <div className="grid grid-cols-2 gap-3">
          {data.luckyDays?.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Lucky Days</p>
              <div className="flex flex-wrap gap-1.5">
                {data.luckyDays.map((d: string) => (
                  <span key={d} className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-medium">{d}</span>
                ))}
              </div>
            </div>
          )}
          {data.unluckyDays?.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Challenging Days</p>
              <div className="flex flex-wrap gap-1.5">
                {data.unluckyDays.map((d: string) => (
                  <span key={d} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Best / Worst time */}
        <div className="grid grid-cols-2 gap-3">
          {data.luckyTime && (
            <div className="bg-[var(--warm-sand)] rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Best Time of Day</p>
              <p className="text-sm text-[var(--warm-charcoal)]/80">{data.luckyTime}</p>
            </div>
          )}
          {data.unluckyTime && (
            <div className="bg-[var(--warm-sand)] rounded-xl p-3">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Avoid (Rahu Kaal)</p>
              <p className="text-sm text-[var(--warm-charcoal)]/80">{data.unluckyTime}</p>
            </div>
          )}
        </div>

        {/* Rahu Kaal chart */}
        {data.rahuKaalChart && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-4">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Rahu Kaal (Avoid for Starts)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(data.rahuKaalChart).map(([day, time]) => (
                <div key={day} className="bg-white/70 rounded-lg p-2 text-xs">
                  <p className="font-bold text-[var(--indigo-deep)]">{day.slice(0, 3)}</p>
                  <p className="text-[var(--warm-charcoal)]/60">{time as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Life domain timing */}
        <div>
          <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-3">Best Timing by Life Domain</h3>
          <div className="space-y-2">
            {TIMING_ITEMS.filter(i => i.value).map(item => (
              <div key={item.label} className="flex gap-3 items-start py-2.5 border-b border-[var(--warm-sand)]">
                <span className="material-symbols-outlined text-[16px] text-[var(--saffron)] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <span className="text-sm font-semibold text-[var(--indigo-deep)] w-36 flex-shrink-0">{item.label}</span>
                <span className="text-sm text-[var(--warm-charcoal)]/70">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most favorable / avoid periods */}
        {data.specialDates && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.specialDates.mostFavorable?.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Most Favorable Periods</p>
                {data.specialDates.mostFavorable.map((s: string) => (
                  <p key={s} className="text-xs text-emerald-800 py-0.5">✓ {s}</p>
                ))}
              </div>
            )}
            {data.specialDates.avoidDays?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Avoid for New Beginnings</p>
                {data.specialDates.avoidDays.map((s: string) => (
                  <p key={s} className="text-xs text-red-700 py-0.5">✗ {s}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personal year note */}
        {data.currentYearNote && (
          <div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-4 text-white">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Personal Year Timing</p>
            <p className="text-sm">{data.currentYearNote}</p>
          </div>
        )}

        {/* Hora guide */}
        {data.horaGuide && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-4">
            <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Planetary Hora Guide</p>
            <p className="text-xs text-[var(--warm-charcoal)]/60 mb-3">{data.horaGuide.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {data.horaGuide.firstHoraByDay && Object.entries(data.horaGuide.firstHoraByDay).map(([day, hora]) => (
                <div key={day} className="bg-white/70 rounded-lg p-2 text-xs">
                  <p className="font-bold text-[var(--indigo-deep)]">{day.slice(0, 3)}</p>
                  <p className="text-[var(--warm-charcoal)]/60 text-[10px]">{hora as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

function RemediesSection({ data }: { data: any }) {
  if (!data) return null
  return (
    <Section title="Remedies & Upaya" icon="medication">
      <div className="mt-4 space-y-4">
        {data.dailyPractices?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>today</span>
              Daily Practices
            </p>
            <div className="space-y-1.5">
              {data.dailyPractices.map((p: string, i: number) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-sm text-[var(--warm-charcoal)]/70">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.weeklyPractices?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_view_week</span>
              Weekly Practices
            </p>
            <div className="space-y-1.5">
              {data.weeklyPractices.map((p: string, i: number) => (
                <p key={i} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {p}</p>
              ))}
            </div>
          </div>
        )}
        {data.gemstones?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Gemstone Recommendations</p>
            {data.gemstones.map((g: any, i: number) => (
              <div key={g.stone} className={`rounded-xl p-3 text-sm mb-2 ${i === 0 ? 'bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] border border-amber-200' : 'bg-[var(--warm-sand)]'}`}>
                <p className="font-bold text-[var(--indigo-deep)]">{g.stone}</p>
                {g.purpose && <p className="text-xs text-[var(--warm-charcoal)]/70 mt-0.5">{g.purpose}</p>}
                {g.weight && <p className="text-xs text-[var(--warm-charcoal)]/60 mt-0.5">Weight: {g.weight} · Wear on: {g.wearingDay}</p>}
              </div>
            ))}
          </div>
        )}
        {data.dietRecommendations?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              Diet & Food Remedies
            </p>
            {data.dietRecommendations.map((d: string, i: number) => (
              <p key={i} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {d}</p>
            ))}
          </div>
        )}
        {data.charityItems?.length > 0 && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-3">
            <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Dana (Charity Items)</p>
            {data.charityItems.map((c: string, i: number) => (
              <p key={i} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {c}</p>
            ))}
          </div>
        )}
        {data.luckyNumbers?.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            {data.luckyNumbers.map((n: number) => (
              <span key={n} className="px-3 py-1.5 bg-[var(--indigo-deep)] text-white text-sm rounded-full font-bold">{n}</span>
            ))}
            <span className="text-xs text-[var(--warm-charcoal)]/50">Lucky Numbers</span>
          </div>
        )}
        {data.yantras?.length > 0 && (
          <div>
            <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Yantras</p>
            {data.yantras.map((y: string, i: number) => (
              <p key={i} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {y}</p>
            ))}
          </div>
        )}
        {data.annualPooja && (
          <div className="bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] rounded-xl p-3 border-l-4 border-[var(--saffron)]">
            <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Annual Ritual</p>
            <p className="text-sm text-[var(--warm-charcoal)]/70">{data.annualPooja}</p>
          </div>
        )}
      </div>
    </Section>
  )
}

function GenericSection({ title, icon, data }: { title: string; icon: string; data: any }) {
  if (!data) return null
  return (
    <Section title={title} icon={icon}>
      <div className="mt-4 space-y-3">
        {Object.entries(data).map(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            return (
              <div key={key} className="flex gap-3">
                <span className="text-sm font-semibold text-[var(--indigo-deep)] w-36 flex-shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm text-[var(--warm-charcoal)]/70">{value}</span>
              </div>
            )
          }
          if (Array.isArray(value) && value.every((v: any) => typeof v === 'string')) {
            return (
              <div key={key}>
                <p className="text-sm font-semibold text-[var(--indigo-deep)] mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                <div className="flex gap-2 flex-wrap">
                  {(value as string[]).map((v: string) => (
                    <span key={v} className="text-xs bg-[var(--warm-sand)] px-2.5 py-1 rounded-full">{v}</span>
                  ))}
                </div>
              </div>
            )
          }
          return null
        })}
      </div>
    </Section>
  )
}

// ============================================================
// BOOK VIEWER - page-turning book UI
// ============================================================

const BOOK_ANIM_STYLES = `
  @keyframes pgFlipOutFwd {
    0%   { transform: perspective(2200px) rotateY(0deg); opacity: 1; transform-origin: right center; }
    60%  { opacity: 0.3; }
    100% { transform: perspective(2200px) rotateY(-110deg); opacity: 0; transform-origin: right center; }
  }
  @keyframes pgFlipInFwd {
    0%   { transform: perspective(2200px) rotateY(110deg); opacity: 0; transform-origin: left center; }
    40%  { opacity: 0.3; }
    100% { transform: perspective(2200px) rotateY(0deg); opacity: 1; transform-origin: left center; }
  }
  @keyframes pgFlipOutBwd {
    0%   { transform: perspective(2200px) rotateY(0deg); opacity: 1; transform-origin: left center; }
    60%  { opacity: 0.3; }
    100% { transform: perspective(2200px) rotateY(110deg); opacity: 0; transform-origin: left center; }
  }
  @keyframes pgFlipInBwd {
    0%   { transform: perspective(2200px) rotateY(-110deg); opacity: 0; transform-origin: right center; }
    40%  { opacity: 0.3; }
    100% { transform: perspective(2200px) rotateY(0deg); opacity: 1; transform-origin: right center; }
  }
  .book-exit-left  { animation: pgFlipOutFwd 0.55s cubic-bezier(0.4,0,0.2,1) forwards; position: absolute; inset: 0; z-index: 5; }
  .book-exit-right { animation: pgFlipOutBwd 0.55s cubic-bezier(0.4,0,0.2,1) forwards; position: absolute; inset: 0; z-index: 5; }
  .book-enter-right { animation: pgFlipInFwd 0.55s cubic-bezier(0.4,0,0.2,1) forwards; position: absolute; inset: 0; z-index: 10; }
  .book-enter-left  { animation: pgFlipInBwd 0.55s cubic-bezier(0.4,0,0.2,1) forwards; position: absolute; inset: 0; z-index: 10; }
  .book-scroll::-webkit-scrollbar { width: 4px; }
  .book-scroll::-webkit-scrollbar-track { background: transparent; }
  .book-scroll::-webkit-scrollbar-thumb { background: rgba(47,42,68,0.2); border-radius: 4px; }
`

interface BookChapter {
  id: string
  number: string
  title: string
  sanskrit: string
  leftPanel: React.ReactNode
  content: React.ReactNode
  show: boolean
}

// ─── Decorative left-panel SVG components ──────────────────

function OmMandala({ size = 180 }: { size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.44
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D4A017" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r * 0.85} fill="none" stroke="#D4A017" strokeWidth="0.7" strokeOpacity="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.65} fill="none" stroke="#D4A017" strokeWidth="0.5" strokeOpacity="0.35" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 - 22.5) * Math.PI / 180
        const ox = cx + r * 0.72 * Math.cos(a), oy = cy + r * 0.72 * Math.sin(a)
        return <ellipse key={i} cx={ox} cy={oy} rx={r * 0.16} ry={r * 0.3}
          transform={`rotate(${i * 45 + 67.5}, ${ox}, ${oy})`}
          fill="#D4A017" fillOpacity="0.14" stroke="#D4A017" strokeWidth="0.5" />
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30 * Math.PI / 180
        return <line key={i}
          x1={cx + r * 0.35 * Math.cos(a)} y1={cy + r * 0.35 * Math.sin(a)}
          x2={cx + r * 0.9 * Math.cos(a)} y2={cy + r * 0.9 * Math.sin(a)}
          stroke="#D4A017" strokeWidth="0.4" strokeOpacity="0.22" />
      })}
      <text x={cx} y={cy + size * 0.09} textAnchor="middle" fontSize={size * 0.35}
        fill="#D4A017" style={{ fontFamily: 'serif', fontWeight: 'bold' }}>ॐ</text>
    </svg>
  )
}

function SriYantraPanel({ size = 180 }: { size?: number }) {
  const cx = size / 2, cy = size / 2, s = size * 0.4
  const tri = (scale: number, inv: boolean) => {
    const h = s * scale
    return inv
      ? `${cx},${cy + h} ${cx + h * 0.866},${cy - h * 0.5} ${cx - h * 0.866},${cy - h * 0.5}`
      : `${cx},${cy - h} ${cx + h * 0.866},${cy + h * 0.5} ${cx - h * 0.866},${cy + h * 0.5}`
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 0.9, 0.8].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={s * r * 1.15} fill="none" stroke="#D4A017"
          strokeWidth={i === 0 ? 1.5 : 0.5} strokeOpacity={1 - i * 0.3} />
      ))}
      {Array.from({ length: 16 }, (_, i) => {
        const a = i * 22.5 * Math.PI / 180
        const ox = cx + s * 1.05 * Math.cos(a), oy = cy + s * 1.05 * Math.sin(a)
        return <ellipse key={i} cx={ox} cy={oy} rx={s * 0.09} ry={s * 0.17}
          transform={`rotate(${i * 22.5 + 90}, ${ox}, ${oy})`}
          fill="#D4A017" fillOpacity="0.1" stroke="#D4A017" strokeWidth="0.4" strokeOpacity="0.3" />
      })}
      {[
        { s: 1.0, inv: false, c: '#E36414' }, { s: 1.0, inv: true, c: '#2F2A44' },
        { s: 0.75, inv: false, c: '#E36414' }, { s: 0.75, inv: true, c: '#2F2A44' },
        { s: 0.5, inv: false, c: '#E36414' }, { s: 0.5, inv: true, c: '#2F2A44' },
        { s: 0.3, inv: false, c: '#E36414' }, { s: 0.3, inv: true, c: '#2F2A44' },
      ].map((t, i) => (
        <polygon key={i} points={tri(t.s, t.inv)} fill="none" stroke={t.c}
          strokeWidth={i < 2 ? 1.5 : 1} strokeOpacity={1 - i * 0.07} />
      ))}
      <circle cx={cx} cy={cy} r={5} fill="#D4A017" />
    </svg>
  )
}

function VastuCompassPanel({ size = 170 }: { size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.41
  const DIRS = [
    { l: 'N', c: '#3b82f6' }, { l: 'NE', c: '#10b981' }, { l: 'E', c: '#f59e0b' }, { l: 'SE', c: '#ef4444' },
    { l: 'S', c: '#ef4444' }, { l: 'SW', c: '#f97316' }, { l: 'W', c: '#6366f1' }, { l: 'NW', c: '#8b5cf6' },
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r + 7} fill="#fef9f0" stroke="#D4A017" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D4A017" strokeWidth="0.5" strokeOpacity="0.3" />
      {DIRS.map((d, i) => {
        const a = i * 45 * Math.PI / 180
        const x1 = cx + r * 0.22 * Math.sin(a), y1 = cy - r * 0.22 * Math.cos(a)
        const x2 = cx + r * 0.78 * Math.sin(a), y2 = cy - r * 0.78 * Math.cos(a)
        const lx = cx + (r + 1) * Math.sin(a), ly = cy - r * Math.cos(a)
        return (
          <g key={d.l}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={d.c} strokeWidth={i % 2 === 0 ? 2.5 : 1.5} />
            <text x={lx} y={ly + 4} textAnchor="middle"
              fontSize={i % 2 === 0 ? 12 : 9} fill={d.c} fontWeight={i % 2 === 0 ? 'bold' : 'normal'}>{d.l}</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={r * 0.26} fill="#2F2A44" fillOpacity="0.08" stroke="#2F2A44" strokeWidth="1" />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={9} fill="#2F2A44" fontWeight="bold">VASTU</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8} fill="#2F2A44">पुरुष</text>
    </svg>
  )
}

function DoshaPanel({ vata = 33, pitta = 34, kapha = 33 }: { vata?: number; pitta?: number; kapha?: number }) {
  return (
    <svg viewBox="0 0 180 185" width="160" height="165">
      <circle cx="90" cy="58" r="47" fill="#bae6fd" fillOpacity="0.6" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="55" cy="128" r="47" fill="#fed7aa" fillOpacity="0.6" stroke="#ea580c" strokeWidth="1.5" />
      <circle cx="125" cy="128" r="47" fill="#bbf7d0" fillOpacity="0.6" stroke="#16a34a" strokeWidth="1.5" />
      <text x="90" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0284c7">Vāta</text>
      <text x="90" y="53" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0284c7">{vata ?? '–'}%</text>
      <text x="35" y="147" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ea580c">Pitta</text>
      <text x="35" y="160" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ea580c">{pitta ?? '–'}%</text>
      <text x="145" y="147" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16a34a">Kapha</text>
      <text x="145" y="160" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#16a34a">{kapha ?? '–'}%</text>
    </svg>
  )
}

function MoonArchetypePanel({ archetype }: { archetype?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 130 130" width="120" height="120">
        {/* Night sky background */}
        <circle cx="65" cy="65" r="56" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Stars as reliable SVG circles (no font dependency) */}
        {([[18,18],[108,12],[12,95],[108,95],[55,10],[90,44],[28,50],[75,28]] as [number,number][]).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 2.2 : 1.5} fill="#f59e0b" opacity={0.85} />
        ))}
        {/* Crescent moon — gold disc with dark cutout overlay */}
        <circle cx="57" cy="65" r="31" fill="#D4A017" />
        <circle cx="71" cy="57" r="27" fill="#1e293b" />
        <circle cx="57" cy="65" r="31" fill="none" stroke="#D4A017" strokeWidth="0.8" opacity="0.4" />
      </svg>
      {archetype && (
        <p className="text-center text-xs font-bold text-[var(--indigo-deep)] bg-[var(--warm-sand)] px-3 py-1.5 rounded-full"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {archetype}
        </p>
      )}
    </div>
  )
}

function DMITPanel({ intelligences }: { intelligences?: Array<{ type: string; score: number }> }) {
  if (!intelligences?.length) return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 h-32 rounded-full border-2 border-dashed border-[var(--warm-sand)] flex items-center justify-center text-4xl">🧠</div>
      <p className="text-xs text-[var(--warm-charcoal)]/40 uppercase tracking-wider">Intelligence Profile</p>
    </div>
  )
  const cx = 80, cy = 80, maxR = 62, minR = 15
  const count = intelligences.length
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
  return (
    <svg viewBox="0 0 160 160" width="160" height="160">
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon key={scale}
          points={Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2 - Math.PI / 2
            const r = minR + (maxR - minR) * scale
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
          }).join(' ')}
          fill="none" stroke="#D4A017" strokeWidth="0.5" strokeOpacity="0.3" />
      ))}
      {intelligences.map((_, i) => {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2
        return <line key={i} x1={cx + minR * Math.cos(a)} y1={cy + minR * Math.sin(a)}
          x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)}
          stroke="#D4A017" strokeWidth="0.4" strokeOpacity="0.3" />
      })}
      <polygon
        points={intelligences.map((intel, i) => {
          const a = (i / count) * Math.PI * 2 - Math.PI / 2
          const r = minR + (maxR - minR) * ((intel.score || 50) / 100)
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
        }).join(' ')}
        fill="#3b82f6" fillOpacity="0.18" stroke="#3b82f6" strokeWidth="1.5" />
      {intelligences.map((intel, i) => {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2
        const r = minR + (maxR - minR) * ((intel.score || 50) / 100)
        const color = COLORS[i % COLORS.length]
        return (
          <g key={i}>
            <circle cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="3.5" fill={color} />
            <text x={cx + (maxR + 10) * Math.cos(a)} y={cy + (maxR + 10) * Math.sin(a) + 3}
              textAnchor="middle" fontSize="6" fill={color} fontWeight="bold">
              {intel.type.split(' ').map((w: string) => w[0]).join('')}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={minR} fill="#2F2A44" fillOpacity="0.1" stroke="#2F2A44" strokeWidth="0.5" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="7" fill="#2F2A44" fontWeight="bold">DMIT</text>
    </svg>
  )
}

function ColourWheelPanel({ size = 150 }: { size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.43
  const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {COLORS.map((color, i) => {
        const s = (i / COLORS.length) * Math.PI * 2 - Math.PI / 2
        const e = ((i + 1.01) / COLORS.length) * Math.PI * 2 - Math.PI / 2
        const ir = r - 24
        return (
          <path key={i}
            d={`M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)} L ${cx + ir * Math.cos(e)} ${cy + ir * Math.sin(e)} A ${ir} ${ir} 0 0 0 ${cx + ir * Math.cos(s)} ${cy + ir * Math.sin(s)} Z`}
            fill={color} />
        )
      })}
      <circle cx={cx} cy={cy} r={r - 26} fill="#fef9f0" />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={size * 0.1} fill="#2F2A44" fontWeight="bold">COLOUR</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size * 0.08} fill="#9ca3af">THERAPY</text>
    </svg>
  )
}

function AnnualArcPanel({ year = new Date().getFullYear() }: { year?: number }) {
  const cx = 90, cy = 135, r = 110
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const MC = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#f97316','#f59e0b','#eab308','#22c55e','#10b981','#14b8a6','#0284c7','#3b82f6']
  return (
    <svg viewBox="0 0 180 155" width="180" height="155">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#D4A017" strokeWidth="2" strokeOpacity="0.25" />
      {MONTHS.map((m, i) => {
        const a = (i / 11) * Math.PI * 0.95 + 0.025
        const x = cx - r * Math.cos(a), y = cy - r * Math.sin(a)
        return (
          <g key={m}>
            <circle cx={x} cy={y} r="5.5" fill={MC[i]} fillOpacity="0.8" />
            <text x={x} y={y + 16} textAnchor="middle" fontSize="7.5" fill={MC[i]} fontWeight="bold">{m}</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy - 22} r="20" fill="#f59e0b" fillOpacity="0.18" stroke="#f59e0b" strokeWidth="1.5" />
      <text x={cx} y={cy - 16} textAnchor="middle" fontSize="18" fill="#f59e0b">☉</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="15" fontWeight="bold" fill="#2F2A44"
        style={{ fontFamily: "'Playfair Display', serif" }}>{year}</text>
    </svg>
  )
}

function RemediesPanel() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-3 gap-2">
        {['🪔', '📿', '💎', '🌿', '🕉️', '🌺'].map((emoji, i) => (
          <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--warm-sand)] to-amber-50 border border-[var(--saffron)]/20 flex items-center justify-center text-xl shadow-sm">
            {emoji}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--warm-charcoal)]/40 text-center font-medium tracking-widest uppercase">Upāya · Remedies</p>
    </div>
  )
}

// ─── Chapter Spread Layout ─────────────────────────────────

function ChapterSpread({ chapter, height }: { chapter: BookChapter; height: number }) {
  return (
    <div style={{ display: 'flex', height }}>
      {/* LEFT PAGE - warm parchment panel (hidden on mobile) */}
      <div className="hidden md:flex" style={{
        width: 340, flexShrink: 0,
        background: 'linear-gradient(160deg, #fdf6e3 0%, #fef9ed 55%, #faf3de 100%)',
        flexDirection: 'column', padding: '24px 20px', position: 'relative', overflow: 'hidden',
        borderRight: '1px solid rgba(212,160,23,0.25)',
      }}>
        {/* Background mandala watermark */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} viewBox="0 0 340 580" preserveAspectRatio="xMidYMid meet">
          <circle cx="170" cy="290" r="150" fill="none" stroke="#C49A0A" strokeWidth="1.5" />
          <circle cx="170" cy="290" r="120" fill="none" stroke="#C49A0A" strokeWidth="1" />
          <circle cx="170" cy="290" r="90" fill="none" stroke="#C49A0A" strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2; const r = 150
            return <line key={i} x1="170" y1="290" x2={170 + r * Math.cos(a)} y2={290 + r * Math.sin(a)} stroke="#C49A0A" strokeWidth="0.8" />
          })}
        </svg>

        {/* Saffron top accent */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #D4A017 40%, #D4A017 60%, transparent)', borderRadius: 2, marginBottom: 20 }} />

        {/* Chapter identity */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, color: '#B8860B', letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
            CHAPTER {chapter.number}
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 900, color: '#2F2A44', margin: '0 0 4px', lineHeight: 1.25 }}>
            {chapter.title}
          </h2>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#B8860B', margin: 0 }}>
            {chapter.sanskrit}
          </p>
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,160,23,0.5), transparent)', marginTop: 14 }} />
        </div>

        {/* Visual chart - fills remaining space */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          {chapter.leftPanel}
        </div>

        {/* Bottom Om */}
        <div style={{ textAlign: 'center', fontSize: 22, color: 'rgba(212,160,23,0.4)', marginTop: 12, fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>ॐ</div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #D4A017 40%, #D4A017 60%, transparent)', borderRadius: 2, marginTop: 12 }} />
      </div>

      {/* Book spine shadow */}
      <div className="hidden md:block" style={{ width: 8, flexShrink: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.18), rgba(0,0,0,0.04), transparent)', zIndex: 2 }} />

      {/* RIGHT PAGE - content */}
      <div style={{ flex: 1, background: '#FFFFFF', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="book-scroll">
        {/* Mobile chapter header */}
        <div className="md:hidden" style={{ background: 'linear-gradient(90deg, #fdf6e3, #fef9ed)', borderBottom: '2px solid #D4A017', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#B8860B', letterSpacing: '0.15em' }}>CH. {chapter.number}</span>
          <div style={{ width: 1, height: 14, background: 'rgba(212,160,23,0.5)' }} />
          <span style={{ fontSize: 12, color: '#2F2A44', fontWeight: 600 }}>{chapter.title}</span>
        </div>
        <div style={{ padding: '20px 24px 32px', flex: 1 }}>
          <SectionErrorBoundary name={chapter.title}>
            {chapter.content}
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  )
}

// ─── Book Viewer ───────────────────────────────────────────

function BookViewer({ chapters }: { chapters: BookChapter[] }) {
  const active = chapters.filter(c => c.show)
  const [displayIdx, setDisplayIdx] = useState(0)
  const [incoming, setIncoming] = useState<{ idx: number; dir: 1 | -1 } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const bookRef = useRef<HTMLDivElement>(null)
  const [isFS, setIsFS] = useState(false)
  const [bookHeight, setBookHeight] = useState(600)

  useEffect(() => {
    const handler = () => setIsFS(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    function updateHeight() {
      setBookHeight(Math.min(600, Math.round(window.innerHeight * 0.75)))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  function goTo(to: number) {
    if (isAnimating || to === displayIdx || to < 0 || to >= active.length) return
    const dir: 1 | -1 = to > displayIdx ? 1 : -1
    setIncoming({ idx: to, dir })
    setIsAnimating(true)
    setTimeout(() => {
      setDisplayIdx(to)
      setIncoming(null)
      setIsAnimating(false)
    }, 580)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      bookRef.current?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const cur = active[displayIdx]
  const inc = incoming ? active[incoming.idx] : null
  const dir = incoming?.dir ?? 1
  const bookH = isFS ? (typeof window !== 'undefined' ? window.innerHeight - 110 : 640) : bookHeight

  return (
    <div ref={bookRef} className={isFS ? 'fixed inset-0 z-50 flex flex-col' : ''}
      style={isFS ? { background: '#f7f3ea' } : undefined}>

      {/* ── Top chrome bar - light theme ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '2px solid #D4A017',
        background: 'linear-gradient(90deg, #fdf6e3, #fef9ed, #fdf6e3)',
        borderRadius: isFS ? 0 : '16px 16px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, color: '#D4A017', fontFamily: 'Georgia, serif' }}>ॐ</span>
          <div>
            <p style={{ fontSize: 9, color: '#B8860B', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>MahaTathastu · Tathastu</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2F2A44', margin: 0, fontFamily: "'Playfair Display', serif" }}>{cur.title}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(47,42,68,0.5)', fontWeight: 600 }}>
            {displayIdx + 1} of {active.length}
          </span>
          <button onClick={toggleFullscreen}
            style={{ background: 'white', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8, padding: '5px 10px', color: '#2F2A44', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isFS ? 'fullscreen_exit' : 'fullscreen'}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{isFS ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* ── Book body with side arrows ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: isFS ? '12px 0' : '0', flex: isFS ? 1 : undefined }}>

        {/* LEFT arrow */}
        <button onClick={() => goTo(displayIdx - 1)} disabled={displayIdx === 0 || isAnimating}
          style={{
            width: 44, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: displayIdx === 0 ? '#f9f6ef' : 'white',
            border: '1px solid rgba(212,160,23,0.35)', borderRight: 'none',
            borderRadius: '10px 0 0 10px', cursor: displayIdx === 0 ? 'default' : 'pointer',
            opacity: displayIdx === 0 ? 0.35 : 1, transition: 'all 0.2s', flexShrink: 0,
            boxShadow: displayIdx > 0 ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#2F2A44' }}>chevron_left</span>
        </button>

        {/* The book itself */}
        <div style={{ flex: 1, position: 'relative', height: bookH, overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(212,160,23,0.2)',
          borderRadius: isFS ? 0 : '0 0 4px 4px',
        }}>
          {/* Current chapter */}
          <div className={isAnimating ? (dir > 0 ? 'book-exit-left' : 'book-exit-right') : ''}>
            <ChapterSpread chapter={cur} height={bookH} />
          </div>
          {/* Incoming chapter */}
          {inc && (
            <div className={dir > 0 ? 'book-enter-right' : 'book-enter-left'}>
              <ChapterSpread chapter={inc} height={bookH} />
            </div>
          )}
        </div>

        {/* RIGHT arrow */}
        <button onClick={() => goTo(displayIdx + 1)} disabled={displayIdx === active.length - 1 || isAnimating}
          style={{
            width: 44, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: displayIdx === active.length - 1 ? '#f9f6ef' : 'white',
            border: '1px solid rgba(212,160,23,0.35)', borderLeft: 'none',
            borderRadius: '0 10px 10px 0', cursor: displayIdx === active.length - 1 ? 'default' : 'pointer',
            opacity: displayIdx === active.length - 1 ? 0.35 : 1, transition: 'all 0.2s', flexShrink: 0,
            boxShadow: displayIdx < active.length - 1 ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#2F2A44' }}>chevron_right</span>
        </button>
      </div>

      {/* ── Chapter dots & reading progress - light ── */}
      <div style={{ padding: '10px 60px', display: 'flex', alignItems: 'center', gap: 10, background: isFS ? '#fdf8f0' : undefined }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(212,160,23,0.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((displayIdx + 1) / active.length) * 100}%`, background: 'linear-gradient(90deg, #2F2A44, #D4A017)', transition: 'width 0.4s ease', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {active.map((c, i) => (
            <button key={c.id} onClick={() => goTo(i)} title={c.title}
              style={{
                border: 'none', cursor: 'pointer', padding: 0, borderRadius: 99,
                background: i === displayIdx ? '#2F2A44' : 'rgba(212,160,23,0.35)',
                width: i === displayIdx ? 20 : 7, height: 7,
                transition: 'all 0.3s',
              }} />
          ))}
        </div>
        <span style={{ fontSize: 10, color: 'rgba(47,42,68,0.45)', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {displayIdx + 1} / {active.length}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function ReportDetailPage() {

  const { reportId } = useParams<{ reportId: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
const [lang, setLang] = useState<'en' | 'hi'>('en')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
      if (!family) { setLoading(false); return }
      const { data } = await supabase
        .from('reports')
        .select('id,report_type,status,report_content,created_at,family_members(full_name,date_of_birth,place_of_birth)')
        .eq('id', reportId)
        .eq('family_id', family.id)
        .single()
      if (data) setReport(data as Report)
      setLoading(false)
    }
    load()
  }, [reportId, supabase])

  // Poll every 3s while report is processing
  useEffect(() => {
    if (report?.status !== 'processing') return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('reports')
        .select('id,report_type,status,report_content,created_at,family_members(full_name,date_of_birth,place_of_birth)')
        .eq('id', reportId)
        .single()
      if (data && data.status !== 'processing') {
        setReport(data as Report)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [report?.status, reportId, supabase])

  function handleDownload() {
    window.print()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="md" /></div>
  if (!report) return (
    <div className="p-6 text-center">
      <p>Report not found.</p>
      <Link href="/reports" className="text-[var(--terracotta)] inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports
      </Link>
    </div>
  )
  if (report.status === 'processing') return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(47,42,68,0.2)', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(160deg, #0f0b22 0%, #2F2A44 55%, #3a1e04 100%)', padding: '36px 32px 30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 280, height: 280, border: '1px solid rgba(212,160,23,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ marginBottom: 14 }}><SudarshanLoader size="lg" /></div>
        </div>
        <div style={{ background: '#FDFAF5', padding: '24px 28px 28px' }}>
          <p style={{ fontWeight: 700, color: '#2F2A44', fontSize: 17, fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>Crafting Your Sacred Report</p>
          <p style={{ fontSize: 13, color: 'rgba(42,32,28,0.55)', marginBottom: 20 }}>This page will refresh automatically when ready</p>
          <Link href="/reports/generate" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Generate
          </Link>
        </div>
      </div>
    </div>
  )

  const d = report.report_content || {}
  const member = report.family_members as any
  const isHindi = lang === 'hi'
  const titles = isHindi ? REPORT_TITLES_HI : REPORT_TITLES
  const title = titles[report.report_type] || `${report.report_type.replace(/_/g, ' ')} Report`
  const isFull = report.report_type === 'full_tathastu'
  const isGenerated = ['generated', 'reviewed', 'delivered'].includes(report.status)

  const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV']

  const chapters: BookChapter[] = [
    {
      id: 'astrology', number: 'I', title: 'Kundli & Birth Chart', sanskrit: 'ग्रह ज्योतिष',
      leftPanel: d.kundli ? <KundliWheel kundli={d.kundli} /> : <OmMandala size={175} />,
      content: <KundliSection data={d} birthDate={member?.date_of_birth} />,
      show: (report.report_type === 'astrology' || isFull) && !!(d.kundli?.ascendant),
    },
    {
      id: 'numerology', number: 'II', title: 'Numerology Analysis', sanskrit: 'अंकशास्त्र',
      leftPanel: d.numerology
        ? <NumerologyGrid numerology={d.numerology} member={{ name: member?.full_name, dob: member?.date_of_birth }} />
        : <OmMandala size={175} />,
      content: <NumerologySection data={d} />,
      show: (report.report_type === 'numerology' || isFull) && !!(d.numerology?.lifePathNumber),
    },
    {
      id: 'shakti_chakra', number: 'III', title: 'Shakti Chakra', sanskrit: 'शक्ति चक्र',
      leftPanel: (d.chakras || d.chakra)
        ? <ChakraChart data={{ chakras: d.chakras || d.chakra, overallBalance: d.overallBalance }} />
        : <OmMandala size={175} />,
      content: <ChakraSection data={d.chakras || d.chakra} />,
      show: (report.report_type === 'shakti_chakra' || isFull) && !!(Array.isArray(d.chakras || d.chakra) && (d.chakras || d.chakra).length > 0),
    },
    {
      id: 'prakriti', number: 'IV', title: 'Prakriti · Ayurveda', sanskrit: 'प्रकृति',
      leftPanel: <DoshaPanel vata={d.prakriti?.vata} pitta={d.prakriti?.pitta} kapha={d.prakriti?.kapha} />,
      content: (
        <Section title="Prakriti (Ayurvedic Constitution)" icon="eco">
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Vata', value: d.prakriti?.vata, color: 'bg-sky-50 border-sky-300 text-sky-700' },
                { label: 'Pitta', value: d.prakriti?.pitta, color: 'bg-orange-50 border-orange-300 text-orange-700' },
                { label: 'Kapha', value: d.prakriti?.kapha, color: 'bg-green-50 border-green-300 text-green-700' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-3 text-center border-2 ${item.color}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}%</p>
                </div>
              ))}
            </div>
            <div className="bg-[var(--warm-sand)] rounded-xl p-3">
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Dominant Dosha</p>
              <p className="font-bold text-[var(--indigo-deep)] text-lg">{d.prakriti?.dominant}</p>
              {d.prakriti?.secondary && <p className="text-sm text-[var(--warm-charcoal)]/60">Secondary: {d.prakriti.secondary}</p>}
            </div>
            {d.prakriti?.diet?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Diet Recommendations</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.prakriti.diet.map((f: string) => <span key={f} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">{f}</span>)}
                </div>
              </div>
            )}
            {d.prakriti?.lifestyle?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Lifestyle Guidelines</p>
                {d.prakriti.lifestyle.map((l: string) => <p key={l} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {l}</p>)}
              </div>
            )}
            {d.prakriti?.avoid?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Foods to Avoid</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.prakriti.avoid.map((f: string) => <span key={f} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{f}</span>)}
                </div>
              </div>
            )}
          </div>
        </Section>
      ),
      show: (report.report_type === 'prakriti' || isFull) && !!(d.prakriti?.dominant),
    },
    {
      id: 'yantra_colour', number: 'V', title: 'Yantra & Colour', sanskrit: 'यंत्र रंग चिकित्सा',
      leftPanel: <SriYantraPanel size={175} />,
      content: <YantraSection data={d.yantra || d.yantraColour} />,
      show: (report.report_type === 'yantra_colour' || isFull) && !!(d.yantra?.primaryYantra || d.yantraColour?.primaryYantra),
    },
    {
      id: 'mantra_chanting', number: 'VI', title: 'Mantra Guidance', sanskrit: 'मंत्र जप',
      leftPanel: (
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] flex items-center justify-center shadow-xl">
            <span className="text-5xl text-white" style={{ fontFamily: 'serif' }}>ॐ</span>
          </div>
          {(d.mantras?.chanting?.beejMantra || d.mantra?.chanting?.beejMantra) && (
            <div className="bg-[var(--indigo-deep)]/8 border border-[var(--indigo-deep)]/15 rounded-xl px-3 py-2 text-center max-w-[190px]">
              <p className="text-sm font-bold text-[var(--indigo-deep)] leading-relaxed" style={{ fontFamily: 'serif' }}>
                {d.mantras?.chanting?.beejMantra || d.mantra?.chanting?.beejMantra}
              </p>
            </div>
          )}
        </div>
      ),
      content: <MantraSection data={d.mantraLekhnan ? d : (d.mantras || d.mantra)} />,
      show: (['mantra_chanting', 'mantra_writing'].includes(report.report_type) || isFull) && !!(d.mantras?.chanting || d.mantra?.chanting || d.mantraLekhnan),
    },
    {
      id: 'psychology', number: 'VII', title: 'Vedic Psychology', sanskrit: 'वैदिक मनोविज्ञान',
      leftPanel: <MoonArchetypePanel archetype={d.psychology?.moonPersonalityType} />,
      content: (
        <Section title="Vedic Psychology Profile" icon="self_improvement">
          <div className="mt-4 space-y-4">
            <div className="bg-gradient-to-br from-violet-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-violet-400">
              <p className="text-lg font-bold text-[var(--indigo-deep)]">{d.psychology?.moonPersonalityType} Archetype</p>
              <p className="text-sm text-[var(--warm-charcoal)]/70 mt-1">{d.psychology?.emotionalPatterns}</p>
            </div>
            {(d.psychology?.coreTrait || d.psychology?.strengths)?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Core Traits & Strengths</p>
                <div className="flex gap-2 flex-wrap">
                  {(d.psychology.coreTrait || d.psychology.strengths).map((s: string) => (
                    <span key={s} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Cognitive Style', value: d.psychology?.cognitiveStyle },
                { label: 'Career Personality', value: d.psychology?.careerPersonality },
                { label: 'Relationship Style', value: d.psychology?.relationshipStyle },
                { label: 'Stress Triggers', value: d.psychology?.stressTriggers },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3">
                  <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm text-[var(--warm-charcoal)]/80">{item.value}</p>
                </div>
              ))}
            </div>
            {d.psychology?.growthEdge && (
              <div className="bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-[var(--saffron)]">
                <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Growth Edge</p>
                <p className="text-sm text-[var(--warm-charcoal)]/80">{d.psychology.growthEdge}</p>
              </div>
            )}
            {d.psychology?.shadowWork?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Shadow Work Themes</p>
                {d.psychology.shadowWork.map((s: string) => <p key={s} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {s}</p>)}
              </div>
            )}
          </div>
        </Section>
      ),
      show: (report.report_type === 'psychology' || isFull) && !!(d.psychology?.moonPersonalityType),
    },
    {
      id: 'astro_vastu', number: 'VIII', title: 'Astro Vastu', sanskrit: 'ज्योतिष वास्तु',
      leftPanel: <VastuCompassPanel size={165} />,
      content: <VastuSection data={d.vastu || d.vastuAnalysis} />,
      show: (report.report_type === 'astro_vastu' || isFull) && !!(d.vastu?.homeDirection || d.vastuAnalysis?.homeDirection),
    },
    {
      id: 'dmit', number: 'IX', title: 'DMIT Intelligence', sanskrit: 'बुद्धिमत्ता प्रोफाइल',
      leftPanel: <DMITPanel intelligences={d.dmit?.allIntelligences} />,
      content: (
        <Section title="DMIT Intelligence Profile" icon="psychology">
          <div className="mt-4 space-y-4">
            {d.dmit?.learningStyle && (
              <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Learning Style</p>
                <p className="text-sm text-[var(--warm-charcoal)]/80">{d.dmit.learningStyle}</p>
              </div>
            )}
            {d.dmit?.dominantIntelligences?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-3">Intelligence Profile</p>
                {d.dmit.allIntelligences?.map((intel: any) => (
                  <div key={intel.type} className="mb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-[var(--indigo-deep)]">{intel.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${intel.strength === 'Strong' ? 'bg-emerald-100 text-emerald-700' : intel.strength === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{intel.strength} · {intel.score}</span>
                    </div>
                    <div className="bg-[var(--warm-sand)] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-[var(--indigo-deep)] rounded-full" style={{ width: `${intel.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {d.dmit?.recommendedStreams?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Recommended Academic Streams</p>
                <div className="flex gap-2 flex-wrap">
                  {d.dmit.recommendedStreams.map((s: string) => (
                    <span key={s} className="text-xs bg-[var(--indigo-deep)] text-white px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {d.dmit?.careerAlignment?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Career Alignment</p>
                <div className="flex gap-2 flex-wrap">
                  {d.dmit.careerAlignment.map((c: string) => (
                    <span key={c} className="text-xs bg-[var(--warm-sand)] px-2.5 py-1 rounded-full text-[var(--warm-charcoal)]/70">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      ),
      show: (report.report_type === 'dmit' || isFull) && !!(d.dmit?.learningStyle),
    },
    {
      id: 'colour_therapy', number: 'X', title: 'Colour Therapy', sanskrit: 'रंग चिकित्सा',
      leftPanel: <ColourWheelPanel size={155} />,
      content: (
        <Section title="Colour Therapy" icon="palette">
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Physical Healing', colors: d.colourTherapy?.healingColors?.physical, accent: '#10b981', bg: 'bg-emerald-50 border-emerald-100' },
                { label: 'Emotional Healing', colors: d.colourTherapy?.healingColors?.emotional, accent: '#ec4899', bg: 'bg-pink-50 border-pink-100' },
                { label: 'Mental Clarity', colors: d.colourTherapy?.healingColors?.mental, accent: '#3b82f6', bg: 'bg-blue-50 border-blue-100' },
                { label: 'Spiritual Growth', colors: d.colourTherapy?.healingColors?.spiritual, accent: '#8b5cf6', bg: 'bg-violet-50 border-violet-100' },
              ].filter(i => i.colors?.length).map(item => {
                const cols: string[] = (Array.isArray(item.colors) ? item.colors : typeof item.colors === 'string' ? [item.colors] : []).slice(0, 4)
                return (
                  <div key={item.label} className={`rounded-xl p-3 border ${item.bg} overflow-hidden`}>
                    <div className="flex gap-0.5 mb-2.5 rounded-lg overflow-hidden h-4">
                      {cols.map((c: string) => <div key={c} className="flex-1 h-full" style={{ backgroundColor: nameToColor(c) }} />)}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: item.accent }}>{item.label}</p>
                    <div className="flex flex-col gap-1">
                      {cols.map((c: string) => (
                        <span key={c} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--indigo-deep)]">
                          <ColorSwatch name={c} size="sm" />{c}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {d.colourTherapy?.chromotherapy && (
              <div className="rounded-xl border border-[var(--warm-sand)] overflow-hidden">
                <div className="h-10 w-full" style={{ backgroundColor: nameToColor(d.colourTherapy.chromotherapy.primaryColor || '') }} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <ColorSwatch name={d.colourTherapy.chromotherapy.primaryColor || ''} size="lg" />
                    <div>
                      <p className="font-bold text-[var(--indigo-deep)]">{d.colourTherapy.chromotherapy.primaryColor}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/50">Primary Healing Color</p>
                    </div>
                  </div>
                  {d.colourTherapy.chromotherapy.sessions && <p className="text-sm text-[var(--warm-charcoal)]/70">• {d.colourTherapy.chromotherapy.sessions}</p>}
                  {d.colourTherapy.chromotherapy.duration && <p className="text-sm text-[var(--warm-charcoal)]/70">• Duration: {d.colourTherapy.chromotherapy.duration}</p>}
                  {d.colourTherapy.chromotherapy.waterSolarization && (
                    <p className="mt-2 text-xs text-[var(--warm-charcoal)]/55 italic">{d.colourTherapy.chromotherapy.waterSolarization}</p>
                  )}
                </div>
              </div>
            )}
            {d.colourTherapy?.colorMeditation && (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1.5">Colour Meditation</p>
                <p className="text-sm text-[var(--warm-charcoal)]/75 leading-relaxed">{d.colourTherapy.colorMeditation}</p>
              </div>
            )}
          </div>
        </Section>
      ),
      show: (report.report_type === 'colour_therapy' || isFull) && !!(d.colourTherapy?.healingColors?.length || d.colourTherapy?.chromotherapy),
    },
    {
      id: 'annual_prediction', number: 'XI', title: 'Annual Prediction', sanskrit: 'वार्षिक भविष्यवाणी',
      leftPanel: <AnnualArcPanel />,
      content: (
        <Section title="Annual Prediction" icon="calendar_today">
          <div className="mt-4 space-y-3">
            {d.annualPrediction?.overallTheme && (
              <div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-4 text-white">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Annual Theme</p>
                <p className="text-sm leading-relaxed">{d.annualPrediction.overallTheme}</p>
              </div>
            )}
            {d.annualPrediction?.quarters?.map((q: any) => (
              <div key={q.period} className="flex gap-4 items-start py-2.5 border-b border-[var(--warm-sand)]">
                <span className="text-sm font-bold text-[var(--terracotta)] w-32 flex-shrink-0">{q.period}</span>
                <div>
                  {q.theme && <p className="text-xs font-semibold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-0.5">{q.theme}</p>}
                  <p className="text-sm text-[var(--warm-charcoal)]/70">{q.guidance}</p>
                  {q.focus && <p className="text-xs text-[var(--saffron)] mt-0.5">Focus: {q.focus}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ),
      show: isFull && !!d.annualPrediction,
    },
    {
      id: 'muhurta', number: 'XII', title: 'Muhurta - Timing', sanskrit: 'मुहूर्त',
      leftPanel: <AnnualArcPanel />,
      content: <MuhurtaSection data={d.muhurta} />,
      show: isFull && !!d.muhurta,
    },
    {
      id: 'remedies', number: 'XIII', title: 'Remedies & Upāya', sanskrit: 'उपाय',
      leftPanel: <RemediesPanel />,
      content: <RemediesSection data={d.remediesSummary || d.remedies} />,
      show: isFull && !!(d.remediesSummary || d.remedies),
    },
    {
      id: 'child_development', number: 'I', title: 'Child Development', sanskrit: 'बाल विकास',
      leftPanel: <OmMandala size={175} />,
      content: (
        <Section title="Child Development Report" icon="child_care">
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Developmental Stage" value={d.childDevelopment?.stage} />
              <InfoCard label="Age" value={d.childDevelopment?.age ? `${d.childDevelopment.age} years` : undefined} />
            </div>
            {d.childDevelopment?.learningStyle && (
              <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Learning Style</p>
                <p className="text-sm text-[var(--warm-charcoal)]/80">{d.childDevelopment.learningStyle}</p>
              </div>
            )}
            {d.childDevelopment?.milestones?.length > 0 && (
              <div>
                <p className="text-base font-extrabold text-[var(--indigo-deep)] mb-2">Key Milestones</p>
                {d.childDevelopment.milestones.map((m: string) => <p key={m} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {m}</p>)}
              </div>
            )}
            {d.childDevelopment?.parentingAdvice?.length > 0 && (
              <div className="bg-[var(--warm-sand)] rounded-xl p-4">
                <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-2">Parenting Guidance</p>
                {d.childDevelopment.parentingAdvice.map((a: string) => <p key={a} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {a}</p>)}
              </div>
            )}
          </div>
        </Section>
      ),
      show: report.report_type === 'child_development' && !!d.childDevelopment,
    },
    {
      id: 'mobile_number', number: 'I', title: 'Mobile Number Analysis', sanskrit: 'अंकशास्त्र',
      leftPanel: <NumerologyGrid numerology={{ lifePathNumber: d.lifePath || 1, destinyNumber: d.mobile?.totalNumber || 1, soulUrgeNumber: 1, personalityNumber: 1, dateOfBirth: '', fullName: '' }} />,
      content: (
        <Section title="Mobile Number Analysis" icon="phone">
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Total Number" value={d.mobile?.totalNumber} large />
              <InfoCard label="Life Path" value={d.lifePath} />
            </div>
            {d.mobile?.compatibility !== undefined && (
              <div className={`rounded-xl p-4 text-center ${d.mobile.compatibility >= 70 ? 'bg-emerald-50' : d.mobile.compatibility >= 40 ? 'bg-amber-50' : 'bg-red-50'}`}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1">Compatibility Score</p>
                <p className={`text-4xl font-bold ${d.mobile.compatibility >= 70 ? 'text-emerald-600' : d.mobile.compatibility >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{d.mobile.compatibility}%</p>
              </div>
            )}
            {d.mobile?.analysis && <p className="text-sm text-[var(--warm-charcoal)]/70">{d.mobile.analysis}</p>}
            {d.mobile?.suggestion && (
              <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Suggestion</p>
                <p className="text-sm text-[var(--warm-charcoal)]/70">{d.mobile.suggestion}</p>
              </div>
            )}
          </div>
        </Section>
      ),
      show: report.report_type === 'mobile_number' && !!d.mobile,
    },
  ]

  const visibleChapters = chapters
    .filter(c => c.show)
    .map((c, i) => ({ ...c, number: ROMAN[i] ?? String(i + 1) }))

  const PRINT_CSS = `
    /* Hide print container on screen via CSS (not inline style, so @media print can override cleanly) */
    #rpa { display: none; }

    @media print {
      @page { size: A4 portrait; margin: 10mm; }

      /* ── 0. DashboardShell has h-screen overflow-hidden + main overflow-y-auto
              These clip everything after page 1. Reset ALL ancestors. ── */
      html, body { height: auto !important; overflow: visible !important; }
      body > *, body > * > *, body > * > * > * {
        height: auto !important;
        overflow: visible !important;
      }
      main { height: auto !important; overflow: visible !important; }

      /* ── 1. Hide ALL screen-only UI (removes from layout, no space taken) ── */
      .no-print { display: none !important; }
      /* Hide sidebar, topbar, and any other DashboardShell chrome */
      nav, aside, header, footer { display: none !important; }
      body > * > * > *:not(#report-page-wrap) { display: none !important; }

      /* ── 2. Reset the outer page wrapper constraints ── */
      #report-page-wrap {
        padding: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
        overflow: visible !important;
        height: auto !important;
      }

      /* ── 3. Show and size print container ── */
      #rpa {
        display: block !important;
        width: 100% !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #rpa * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* ── 4. Cards: strip shadows, let content flow across pages ── */
      .card-divine {
        box-shadow: none !important;
        overflow: visible !important;
        margin-bottom: 8px;
        border: none !important;
        border-radius: 0 !important;
      }
      /* Section heading: never orphaned from its first line of content */
      .card-divine h2, .card-divine h3 { break-after: avoid; page-break-after: avoid; }
      /* Every element inside #rpa must let content flow through page boundaries */
      #rpa, #rpa * { overflow: visible !important; }
      /* Small individual items: keep intact. py-2.5 = monthly prediction rows */
      #rpa .py-2\.5, #rpa .border-b { break-inside: avoid; page-break-inside: avoid; }
      /* Gemstone/remedy cards with background */
      #rpa .rounded-xl { break-inside: avoid; page-break-inside: avoid; }

      /* ── 5. Tables ── */
      table { font-size: 9px !important; width: 100%; border-collapse: collapse; }
      table th, table td { padding: 3px 6px !important; border: 1px solid #c8a96e; }
      thead { display: table-header-group; }
      #rpa tr { break-inside: avoid; page-break-inside: avoid; }
      #rpa thead { display: table-header-group; }

      /* ── 6. Typography ── */
      h2 { font-size: 15px !important; page-break-after: avoid; break-after: avoid; }
      h3 { font-size: 12px !important; page-break-after: avoid; break-after: avoid; }
      #rpa p { font-size: 11px !important; line-height: 1.6 !important; orphans: 3; widows: 3; }
      #rpa li { font-size: 11px !important; break-inside: avoid; }
      #rpa h2, #rpa h3, #rpa h4 { break-after: avoid; page-break-after: avoid; }
      #rpa [class*="rounded"], #rpa [style*="border-radius"] { break-inside: avoid; }

      /* ── 7. Likhit mantra compaction ── */
      .ml-seq-visual { display: none !important; }
      .ml-closing-breakdown { display: none !important; }
      .ml-steps .space-y-3 > * { margin-top: 6px !important; }
      .ml-steps .p-4 { padding: 6px 10px !important; }
      .ml-steps .text-2xl { font-size: 16px !important; }
      .ml-progress { gap: 4px !important; }
      .ml-progress > * { padding: 4px !important; }
      .ml-progress .text-xl { font-size: 14px !important; }
    }
  `

  return (
    <>
      <style>{PRINT_CSS + BOOK_ANIM_STYLES}</style>


      <div id="report-page-wrap" className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Screen header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <Link href="/reports" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports
            </Link>
            <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h1>
            {member && (
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">
                {member.full_name} · {member.place_of_birth || ''} · {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center bg-[var(--warm-sand)] rounded-lg p-0.5 gap-0.5">
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-[var(--indigo-deep)] text-white' : 'text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>EN</button>
              <button onClick={() => setLang('hi')} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'hi' ? 'bg-[var(--indigo-deep)] text-white' : 'text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>हिं</button>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${isGenerated ? 'bg-emerald-100 text-emerald-700' : report.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {report.status}
            </span>
            {isGenerated && (
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--indigo-deep)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
                Save as PDF
              </button>
            )}
          </div>
        </div>

        {/* Screen: book viewer */}
        {!isGenerated ? (
          <div className="card-divine p-10 text-center no-print" style={{ background: 'linear-gradient(160deg, rgba(47,42,68,0.04), rgba(212,160,23,0.04))' }}>
            <SudarshanLoader size="lg" />
            <p className="font-bold text-[var(--indigo-deep)] mt-4" style={{ fontFamily: "'Playfair Display', serif" }}>Report is being prepared…</p>
            <p className="text-sm text-[var(--warm-charcoal)]/50 mt-1">This will update automatically once complete</p>
          </div>
        ) : visibleChapters.length > 0 ? (
          <div className="no-print"><BookViewer chapters={visibleChapters} /></div>
        ) : (
          <div className="card-divine p-8 text-center no-print">
            <p className="text-[var(--warm-charcoal)]/60">Report content not yet available.</p>
          </div>
        )}

        {/* Print-only: beautiful 30-page PDF layout */}
        <div id="rpa" ref={printRef}>

          {/* COVER PAGE */}
          <div style={{ background: '#f5ede0', pageBreakAfter: 'always', fontFamily: 'Georgia, serif', outline: '1px solid rgba(200,146,42,0.4)', outlineOffset: '-8px', paddingBottom: 24 }}>

            {/* Top Sanskrit invocation */}
            <div style={{ textAlign: 'center', padding: '20px 0 12px', color: '#cc2200', fontSize: 12, fontWeight: 700, borderBottom: '1px solid rgba(200,146,42,0.3)' }}>
              ॐ महागणपतये नमः | श्रीमात्रे नमः | ॐ तत् सत्
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'flex', margin: '0 16px', minHeight: '22cm' }}>

              {/* LEFT - Gyanampeetham */}
              <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', borderRight: '1px solid rgba(200,146,42,0.4)', padding: '20px 24px' }}>
                {/* Top: OM auspicious mark */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: 28, color: '#cc2200', lineHeight: 1 }}>ॐ</div>
                  <div style={{ width: '60%', height: 1, background: 'rgba(200,146,42,0.4)', margin: '8px auto 0' }} />
                </div>

                {/* Middle: Logo block */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#6b3a2a,#3d1f0f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 42, fontWeight: 900, fontFamily: 'Georgia, serif' }}>
                    G
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#2c1a0e', letterSpacing: '0.06em', fontFamily: 'Georgia, serif' }}>GYANAMPEETHAM</div>
                    <div style={{ fontSize: 8.5, color: '#6b3a2a', letterSpacing: '0.2em', marginTop: 3 }}>"DISCOVER THE DIVINE WITHIN"</div>
                  </div>
                  {/* Lotus SVG */}
                  <svg width="76" height="76" viewBox="0 0 90 90" fill="none">
                    {[0,40,80,120,160,200,240,280,320].map((a, i) => (
                      <ellipse key={i} cx="45" cy="45" rx="10" ry="28" fill="#7c6db5" opacity="0.55" transform={`rotate(${a} 45 45)`} />
                    ))}
                    <circle cx="45" cy="45" r="10" fill="#7c6db5" opacity="0.8" />
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#7c6db5', letterSpacing: '0.18em', fontFamily: 'Georgia, serif' }}>ANUSHTHAAN INDIA</div>
                    <div style={{ fontSize: 7.5, color: '#7c6db5', letterSpacing: '0.1em', marginTop: 3 }}>"EDUCATING SOCIETY WITH WISDOM FOR A BETTER LIFE"</div>
                  </div>
                </div>

                {/* Bottom: Mission & note */}
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <div style={{ width: '60%', height: 1, background: 'rgba(200,146,42,0.4)', margin: '0 auto 10px' }} />
                  <div style={{ background: 'rgba(200,146,42,0.1)', border: '1px solid rgba(200,146,42,0.35)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
                    <p style={{ fontSize: 9, color: '#6b3a2a', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                      "ज्ञानम् परमं बलम्" —<br />Knowledge is the highest power.
                    </p>
                  </div>
                  <p style={{ fontSize: 7.5, color: '#bbb', lineHeight: 1.5, margin: 0 }}>
                    AI tools were utilized during development; all inventive steps, claims, and final outcomes are attributable to human ingenuity and supervision.
                  </p>
                </div>
              </div>

              {/* RIGHT - MahaTathastu report */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 28px', gap: 16 }}>

                {/* Sri Yantra pair */}
                <div style={{ display: 'flex', gap: 20 }}>
                  {[0, 1].map(k => (
                    <svg key={k} width="50" height="50" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="24" fill="none" stroke="#c8922a" strokeWidth="1" />
                      <circle cx="26" cy="26" r="17" fill="none" stroke="#c8922a" strokeWidth="0.7" />
                      {[0,45,90,135,180,225,270,315].map((a, i) => (
                        <rect key={i} x="23" y="8" width="6" height="10" rx="3" fill="#c8922a" opacity="0.6" transform={`rotate(${a} 26 26)`} />
                      ))}
                      <polygon points="26,12 38,34 14,34" fill="none" stroke="#cc2200" strokeWidth="1.2" />
                      <polygon points="26,40 38,18 14,18" fill="none" stroke="#cc2200" strokeWidth="1.2" />
                    </svg>
                  ))}
                </div>

                {/* MAHATATHASTU brand block */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#c8922a', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 4 }}>An Initiative of Anushthaan India</div>
                  <div style={{ fontSize: 10, color: '#888', letterSpacing: '0.1em', marginBottom: 8 }}>©</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#1a3a8c', letterSpacing: '0.08em', fontFamily: 'Georgia, serif', lineHeight: 1 }}>MAHA</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#2c1a0e', letterSpacing: '0.08em', fontFamily: 'Georgia, serif', lineHeight: 1 }}>TATHASTU</div>
                  <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #c8922a 30%, #cc2200 50%, #c8922a 70%, transparent)', margin: '8px 0 6px' }} />
                  <div style={{ fontSize: 10.5, color: '#2c1a0e', letterSpacing: '0.12em' }}>Decode Your Life. Design Your Future.</div>
                </div>

                {/* 18 Acharyas */}
                <div style={{ textAlign: 'center', color: '#cc2200', fontSize: 9.5, lineHeight: 1.75 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2, color: '#1a3a8c' }}>ज्योतिष शास्त्र (वेदांग ज्योतिष) के 18 आचार्य:</div>
                  <div>सूर्य, पितामह (ब्रह्मा), व्यास, वशिष्ठ, अत्रि, पराशर, कश्यप, नारद, गर्ग,</div>
                  <div>मरीचि, मनु, अंगिरा, लोमश, पौलिश, च्यवन, यवन, भृगु और शौनक</div>
                </div>

                {/* Yantra grid */}
                <svg width="64" height="56" viewBox="0 0 70 60">
                  {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => (
                    <polygon key={`${r}-${c}`} points={`${8+c*12},${30-r*10} ${14+c*12},${30-r*10+8} ${2+c*12},${30-r*10+8}`} fill="none" stroke="#cc2200" strokeWidth="1" />
                  )))}
                </svg>

                {/* Report + Member info box */}
                <div style={{ background: 'rgba(200,146,42,0.1)', border: '1.5px solid #c8922a', borderRadius: 10, padding: '14px 20px', textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: 9, color: '#c8922a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
                  <div style={{ width: '60%', height: 1, background: 'rgba(200,146,42,0.4)', margin: '0 auto 8px' }} />
                  {member && (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a3a8c', fontFamily: 'Georgia, serif' }}>{member.full_name}</div>
                      {member.date_of_birth && <div style={{ fontSize: 9.5, color: '#555', marginTop: 4 }}>Born: {new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                      {member.place_of_birth && <div style={{ fontSize: 9.5, color: '#777' }}>{member.place_of_birth}</div>}
                    </>
                  )}
                  <div style={{ fontSize: 8, color: '#aaa', marginTop: 6 }}>Generated: {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#2c1a0e', letterSpacing: '0.05em' }}>~ AN INITIATIVE OF ANUSHTHAAN INDIA ~</div>
                  <div style={{ fontSize: 8, color: '#999', marginTop: 3 }}>Contents are copyright protected and owned by MahaTathastu</div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(200,146,42,0.3)', marginTop: 16, padding: '10px 0 0', color: '#999', fontSize: 8.5 }}>
              9858784784 · www.mahatathastu.com · info@mahatathastu.com
            </div>
          </div>

          {/* ABOUT & BENEFITS PAGE - parchment style */}
          <div style={{ pageBreakAfter: 'always', background: '#f5ede0', fontFamily: 'Georgia, serif', outline: '1px solid rgba(200,146,42,0.5)', outlineOffset: '-8px' }}>
            <div style={{ padding: '36px 44px' }}>
              {/* Divine Guidance header */}
              <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #c8922a' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a3a8c' }}>Divine Guidance & Remedy Instructions</div>
                <div style={{ fontSize: 10, color: '#cc2200', marginTop: 4 }}>Shree Matra Namah</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 10.5, color: '#1a1a1a', lineHeight: 1.75, marginBottom: 12 }}>
                    This report has been prepared by the Tathastu Team based on the details provided by the devotee.
                  </p>
                  <p style={{ fontSize: 10.5, color: '#1a1a1a', lineHeight: 1.75, marginBottom: 12 }}>
                    We sincerely request the devotee to follow all the remedies mentioned in this report with full dedication, discipline, and unwavering faith. Faith and devotion are the strongest mediums through which divine blessings flow into one's life.
                  </p>
                  <p style={{ fontSize: 10.5, color: '#1a1a1a', lineHeight: 1.75, marginBottom: 12 }}>
                    For purification and correction of your karmic energies, it is essential to practice these remedies continuously for a minimum of 90 days.
                  </p>
                  <p style={{ fontSize: 10.5, color: '#1a1a1a', lineHeight: 1.75, marginBottom: 16 }}>
                    May divine grace guide you, protect you, and fulfill your righteous wishes.
                  </p>
                  <p style={{ fontSize: 10, color: '#555' }}>Regards,<br />Tathastu Team</p>

                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #c8922a' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a8c', marginBottom: 8 }}>Divine Wisdom Behind the Tathastu Report</div>
                    <p style={{ fontSize: 10.5, color: '#1a1a1a', lineHeight: 1.75, marginBottom: 12 }}>
                      Preparing a Tathastu Report is not just a process — it is a sacred responsibility. Each report is carefully created based on multiple dimensions of life, integrating the wisdom of Vedic Astrology, Bhrigu Nandi Nadi, and Jaimini Jyotish.
                    </p>
                  </div>

                  {/* Three pillars */}
                  <div style={{ marginTop: 'auto', paddingTop: 14 }}>
                    {[
                      { icon: '🔭', label: 'Vedic Astrology', desc: 'Planetary positions & life path' },
                      { icon: '🔢', label: 'Numerology', desc: 'Numbers that shape your destiny' },
                      { icon: '🌿', label: 'Ayurveda', desc: 'Body constitution & health balance' },
                    ].map(p => (
                      <div key={p.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a3a8c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{p.icon}</div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a8c' }}>{p.label}</div>
                          <div style={{ fontSize: 9, color: '#666' }}>{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right column - 13 reports grid */}
                <div style={{ background: 'white', border: '2px solid #c8922a', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#1a1a1a', fontWeight: 700, lineHeight: 1.5 }}>
                      India's First Comprehensive Report<br />
                      <span style={{ color: '#cc2200' }}>Covering 360° Aspects of Human Life</span><br />
                      for Future Holistic Growth and Development
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1a3a8c', margin: '8px 0 1px', letterSpacing: '0.08em' }}>MAHA</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#2c1a0e', letterSpacing: '0.08em' }}>TATHASTU</div>
                    <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em' }}>- ONE FAMILY REPORT -</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1a3a8c', marginTop: 6, padding: '3px 8px', border: '1px solid #1a3a8c', borderRadius: 4, display: 'inline-block' }}>
                      13 PERSONALIZED REPORTS
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 9, color: '#2c1a0e' }}>
                    {['Astrology Report', 'Astro-Vastu Report', 'Shakti Chakra Report', 'Numerology Report', 'Mobile Number Report', 'Psychology Report', 'Prakriti Report', 'Yantra Colour Report', 'DMIT Report', 'Colour Therapy Report', 'Child Development Report', 'Mantra Chanting Guidance', 'Affirmation Report (Tithi Wise)'].map(r => (
                      <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#c8922a', fontSize: 10 }}>✦</span> {r}
                      </div>
                    ))}
                  </div>

                  {/* Why MahaTathastu section - fills blank space */}
                  <div style={{ marginTop: 14, padding: '10px 12px', background: '#f5ede0', borderRadius: 8, border: '1px solid rgba(200,146,42,0.35)', flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a8c', marginBottom: 8, textAlign: 'center', borderBottom: '1px solid rgba(200,146,42,0.3)', paddingBottom: 6 }}>
                      Why Choose MahaTathastu?
                    </div>
                    {[
                      'NASA-grade planetary calculations (Lahiri Ayanamsa)',
                      'Holistic integration: Jyotish + Numerology + Ayurveda',
                      'Personalised 90-day remedy roadmap',
                      'Lifetime report support from the Tathastu Team',
                      'Verified by 18 classical Jyotish Acharya traditions',
                    ].map(pt => (
                      <div key={pt} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ color: '#c8922a', fontSize: 9, marginTop: 1, flexShrink: 0 }}>✦</span>
                        <span style={{ fontSize: 9, color: '#2c1a0e', lineHeight: 1.5 }}>{pt}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, textAlign: 'center', background: '#1a3a8c', borderRadius: 6, padding: '8px 12px' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>✓ Lifetime Report Support &nbsp; ✓ Complete Guidance & Remedies</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c8922a' }}>With Remedies Contact:</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'white', marginTop: 2 }}>9858784784</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>www.mahatathastu.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GANPATI MANTRAS PAGE - Mangalacharana */}
          <div style={{ pageBreakAfter: 'always', background: '#fffdf7', fontFamily: 'Georgia, serif', padding: '36px 44px', outline: '1px solid rgba(200,146,42,0.4)', outlineOffset: '-8px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #c8922a' }}>
              <div style={{ fontSize: 28, color: '#cc2200', marginBottom: 4 }}>ॐ गं गणपतये नमः</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a3a8c' }}>श्री गणपति मंत्र — Mangalacharana</div>
              <div style={{ fontSize: 10, color: '#c8922a', marginTop: 4, letterSpacing: '0.15em' }}>AUSPICIOUS INVOCATION · CHANT BEFORE BEGINNING ANY SADHANA</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { name: 'Vakratunda Shloka', sanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥', count: '11×', note: 'Before any auspicious work' },
                { name: 'Beej Mantra', sanskrit: 'ॐ गं गणपतये नमः', count: '108×', note: 'Most powerful seed mantra' },
                { name: 'Maha Ganpati', sanskrit: 'ॐ श्री महागणपतये नमः', count: '108×', note: 'Supreme invocation' },
                { name: 'Ganesh Gayatri', sanskrit: 'ॐ एकदन्ताय विद्महे\nवक्रतुण्डाय धीमहि ।\nतन्नो दन्तिः प्रचोदयात् ॥', count: '108×', note: 'For wisdom & intellect' },
                { name: 'Sankatanashana Mantra', sanskrit: 'नागानन गणाध्यक्ष सर्वसिद्धिप्रद प्रभो ।\nसर्वविघ्नहर देवेश सर्वसंकट भंजन ।।', count: '21×', note: 'Destroyer of all sorrows' },
                { name: 'Likhit Japa Mantra', sanskrit: 'ॐ गं गणपतये नमः', count: '108× daily', note: 'Write in red ink on yellow paper, facing East, Wednesdays' },
              ].map(m => (
                <div key={m.name} style={{ background: 'rgba(200,146,42,0.06)', border: '1px solid rgba(200,146,42,0.3)', borderRadius: 8, padding: '10px 12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1a3a8c', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: '#cc2200', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 5 }}>{m.sanskrit}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic' }}>{m.note}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#c8922a', background: 'rgba(200,146,42,0.15)', padding: '2px 8px', borderRadius: 4 }}>{m.count}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Dvadasha Nama - full width */}
            <div style={{ marginTop: 14, background: '#1a3a8c', borderRadius: 10, padding: '14px 18px', color: 'white' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#c8922a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Dvadasha Nama — 12 Sacred Names of Ganesha</div>
              <div style={{ fontSize: 12, color: '#f5ede0', lineHeight: 1.9 }}>
                सुमुख • एकदन्त • कपिल • गजकर्णक • लम्बोदर • विकट • विघ्ननाश • गणाधिप • धूमकेतु • गणाध्यक्ष • फालचन्द्र • गजानन
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                Recite these 12 names each morning for complete obstacle removal and divine blessings.
              </div>
            </div>
          </div>

          {/* TABLE OF CONTENTS */}
          <div style={{ padding: '44px', pageBreakAfter: 'always' }}>
            <div style={{ borderBottom: '2px solid #D4A017', paddingBottom: 14, marginBottom: 28 }}>
              <p style={{ fontSize: 10, color: '#D4A017', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Navigation</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2F2A44', fontWeight: 700, margin: 0 }}>Table of Contents</h2>
            </div>
            {[
              { label: 'Cover', desc: 'Report Identity & Date' },
              { label: 'Preface', desc: 'Understanding Your Report & About MahaTathastu' },
              ...visibleChapters.map(c => ({ label: `Chapter ${c.number}`, desc: `${c.title} · ${c.sanskrit}` })),
              { label: 'Appendix', desc: 'Disclaimer, Guidance Notes & Closing' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', width: 100, flexShrink: 0 }}>{item.label}</span>
                <div style={{ flex: 1, borderBottom: '1px dashed #d1d5db', height: 1 }} />
                <span style={{ fontSize: 11, color: '#374151', maxWidth: 300, textAlign: 'right' }}>{item.desc}</span>
              </div>
            ))}
          </div>

          {/* CHAPTER PAGES */}
          {visibleChapters.map((c) => (
            <div key={c.id} style={{ pageBreakBefore: 'always', background: '#f5ede0', fontFamily: 'Georgia, serif', outline: '1px solid rgba(200,146,42,0.35)', outlineOffset: '-8px' }}>
              {/* Chapter header */}
              <div style={{ padding: '20px 44px 14px', borderBottom: '2px solid #c8922a', background: '#f5ede0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a3a8c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700, flexShrink: 0, fontFamily: 'Georgia, serif' }}>
                    {c.number}
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#c8922a', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 3, fontFamily: 'Georgia, serif' }}>Chapter {c.number}</p>
                    <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a3a8c', marginBottom: 2, lineHeight: 1.2 }}>{c.title}</h2>
                    {c.sanskrit && <p style={{ fontSize: 13, color: '#cc2200', fontFamily: 'Georgia, serif', margin: 0 }}>{c.sanskrit}</p>}
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 28, color: '#c8922a', opacity: 0.5 }}>ॐ</div>
                </div>
              </div>
              {/* Visual chart (KundliWheel / ChakraChart / etc.) - included in PDF */}
              {c.leftPanel && (
                <div data-left-panel={c.id} style={{ background: '#f5ede0', padding: '14px 44px 6px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ maxWidth: 360, width: '100%' }}>
                    {c.leftPanel}
                  </div>
                </div>
              )}
              <div style={{ padding: '12px 44px 32px', background: '#f5ede0' }}>
                {c.content}
              </div>
            </div>
          ))}

          {/* DISCLAIMER PAGE - parchment */}
          <div style={{ pageBreakBefore: 'always', background: '#f5ede0', fontFamily: 'Georgia, serif', outline: '1px solid rgba(200,146,42,0.4)', outlineOffset: '-8px' }}>
            <div style={{ padding: '36px 44px' }}>
              <div style={{ borderBottom: '2px solid #c8922a', paddingBottom: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24, color: '#c8922a' }}>ॐ</div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1a3a8c', fontWeight: 700, margin: 0 }}>Appendix: Disclaimer & Guidance Notes</h2>
              </div>
              {[
                { title: 'Nature of This Report', body: 'This Tathastu report is prepared for informational, educational, and self-discovery purposes only. It is based on traditional Indian astrological, numerological, and Ayurvedic systems and should be treated as guidance for self-awareness rather than as definitive prediction or professional advice.' },
                { title: 'Medical Disclaimer', body: 'The Ayurvedic and health-related content (Prakriti analysis, health recommendations, dietary suggestions) is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.' },
                { title: 'Financial Disclaimer', body: 'Muhurta timing guidance and financial period analysis are traditional Vedic tools for awareness and should not be used as the sole basis for financial or investment decisions. Consult qualified financial advisors for investment choices.' },
                { title: 'Astronomical Accuracy', body: 'Planetary positions are calculated using the NASA-grade astronomy-engine library with Lahiri ayanamsa (the official standard of the Government of India). Results depend on the accuracy of birth date, time, and place provided.' },
                { title: 'Free Will & Destiny', body: 'Vedic astrology recognizes that the birth chart shows tendencies and potential - not fixed destiny. Human free will, conscious effort, and spiritual practice can always influence outcomes. This report is a map, not a sentence.' },
              ].map(item => (
                <div key={item.title} style={{ marginBottom: 14, background: 'white', borderRadius: 8, padding: '12px 16px', border: '1px solid #d4b896' }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: '#1a3a8c', marginBottom: 5 }}>{item.title}</p>
                  <p style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.body}</p>
                </div>
              ))}
              {/* Closing - parchment style, no dark box */}
              <div style={{ marginTop: 24, border: '2px solid #c8922a', borderRadius: 10, padding: '20px 28px', textAlign: 'center', background: 'rgba(200,146,42,0.06)' }}>
                <p style={{ fontSize: 32, margin: '0 0 6px', color: '#cc2200', fontFamily: 'Georgia, serif' }}>ॐ तत् सत्</p>
                <p style={{ fontSize: 11, color: '#2c1a0e', marginBottom: 6, lineHeight: 1.7 }}>
                  May this report guide you on your path to self-knowledge and dharmic living.<br />
                  Follow the remedies with faith, patience and devotion for 90 days minimum.
                </p>
                <p style={{ fontSize: 11, color: '#1a3a8c', fontWeight: 700, marginBottom: 3 }}>- MahaTathastu · Tathastu Report System</p>
                <p style={{ fontSize: 9, color: '#888' }}>www.mahatathastu.com · 9858784784</p>
                <p style={{ fontSize: 8, color: '#aaa', marginTop: 8 }}>Contents of this product/report are copyright protected and owned by MahaTathastu</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
