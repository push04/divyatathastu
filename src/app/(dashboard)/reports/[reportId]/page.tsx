'use client'

import SudarshanLoader from '@/components/SudarshanLoader'
import KundliWheel from '@/components/charts/KundliWheel'
import NumerologyGrid from '@/components/charts/NumerologyGrid'
import ChakraChart from '@/components/charts/ChakraChart'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
  full_tathastu: 'à¤ªà¥‚à¤°à¥à¤£ à¤¤à¤¥à¤¾à¤¸à¥à¤¤à¥ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ', astrology: 'à¤•à¥à¤‚à¤¡à¤²à¥€ à¤”à¤° à¤œà¤¨à¥à¤® à¤•à¥à¤‚à¤¡à¤²à¥€',
  numerology: 'à¤…à¤‚à¤•à¤¶à¤¾à¤¸à¥à¤¤à¥à¤° à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£', shakti_chakra: 'à¤¶à¤•à¥à¤¤à¤¿ à¤šà¤•à¥à¤° à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ',
  prakriti: 'à¤ªà¥à¤°à¤•à¥ƒà¤¤à¤¿ (à¤†à¤¯à¥à¤°à¥à¤µà¥‡à¤¦)', yantra_colour: 'à¤¯à¤‚à¤¤à¥à¤° à¤”à¤° à¤°à¤‚à¤— à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤¾',
  mantra_chanting: 'à¤®à¤‚à¤¤à¥à¤° à¤œà¤ª à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨', mantra_writing: 'à¤²à¤¿à¤–à¤¿à¤¤ à¤œà¤ª à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨',
  astro_vastu: 'à¤œà¥à¤¯à¥‹à¤¤à¤¿à¤· à¤µà¤¾à¤¸à¥à¤¤à¥ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ', psychology: 'à¤µà¥ˆà¤¦à¤¿à¤• à¤®à¤¨à¥‹à¤µà¤¿à¤œà¥à¤žà¤¾à¤¨',
  dmit: 'DMIT à¤¬à¥à¤¦à¥à¤§à¤¿à¤®à¤¤à¥à¤¤à¤¾ à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤²', colour_therapy: 'à¤°à¤‚à¤— à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤¾',
  child_development: 'à¤¬à¤¾à¤² à¤µà¤¿à¤•à¤¾à¤¸', mobile_number: 'à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤° à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£',
}

function Section({ title, icon, children, printAlwaysOpen }: { title: string; icon?: string; children: React.ReactNode; printAlwaysOpen?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card-divine overflow-hidden print:shadow-none print:border print:border-gray-200 print:break-inside-avoid-page">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left print:pointer-events-none"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)] print:hidden" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>}
          <h2 className="font-bold text-[var(--indigo-deep)] text-base">{title}</h2>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/40 print:hidden">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      <div className={`${open ? 'block' : 'hidden'} print:block px-5 pb-5 border-t border-[var(--warm-sand)]`}>
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

function KundliSection({ data }: { data: any }) {
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

      {k.planets?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-[var(--indigo-deep)] mb-3">Planetary Positions</h3>
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
                    <td className="px-3 py-2 text-[var(--warm-charcoal)]/60">{p.degree?.toFixed(2)}Â°</td>
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
              <h3 className="text-sm font-bold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
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
              <h3 className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Key House Influences</h3>
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
              {analysis.remedies.map((r: string) => (
                <p key={r} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {r}</p>
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
          <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Personal Year {n.personalYearNumber} â€” {new Date().getFullYear()}</p>
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
    { color: '#DC2626', from: 'from-red-100',    to: 'to-red-50',    border: 'border-red-200' },
    { color: '#EA580C', from: 'from-orange-100',  to: 'to-orange-50', border: 'border-orange-200' },
    { color: '#CA8A04', from: 'from-yellow-100',  to: 'to-yellow-50', border: 'border-yellow-200' },
    { color: '#16A34A', from: 'from-green-100',   to: 'to-green-50',  border: 'border-green-200' },
    { color: '#0284C7', from: 'from-sky-100',     to: 'to-sky-50',    border: 'border-sky-200' },
    { color: '#4F46E5', from: 'from-indigo-100',  to: 'to-indigo-50', border: 'border-indigo-200' },
    { color: '#7C3AED', from: 'from-violet-100',  to: 'to-violet-50', border: 'border-violet-200' },
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
          const cd = CD[i] || { color: '#9ca3af', from: 'from-gray-100', to: 'to-gray-50', border: 'border-gray-200' }
          const isBalanced = c.status === 'balanced'
          const isBlocked = c.status === 'blocked'
          return (
            <div key={c.name || i} className={`rounded-2xl bg-gradient-to-r ${cd.from} ${cd.to} border ${cd.border} p-4`}>
              <div className="flex items-start gap-4">
                {/* Glowing chakra circle */}
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: cd.color, boxShadow: `0 0 18px ${cd.color}60` }}
                >
                  <span className="text-sm font-black leading-none">{c.level ?? 'â€“'}%</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <div>
                      <span className="font-bold text-[var(--indigo-deep)]">{c.name}</span>
                      {c.sanskrit && <span className="ml-1.5 text-xs text-[var(--warm-charcoal)]/50 italic">{c.sanskrit}</span>}
                      {c.element && <span className="ml-1.5 text-[10px] text-[var(--warm-charcoal)]/40">Â· {c.element}</span>}
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

function MantraSection({ data }: { data: any }) {
  if (!data?.chanting) return null
  const { chanting, likhitJapa, namaAkshara } = data
  return (
    <Section title="Mantra Guidance" icon="temple_hindu">
      <div className="mt-4 space-y-4">
        <div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-5 text-white text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Your Beej Mantra</p>
          <p className="text-2xl font-bold leading-relaxed">{chanting.beejMantra}</p>
          <p className="text-sm mt-3 text-white/80">Chant <span className="font-bold">{chanting.dailyCount}</span> times daily</p>
          <p className="text-xs mt-1 text-white/50">Best time: {chanting.bestTime} Â· Face {chanting.direction} Â· Mala: {chanting.mala}</p>
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Chanting Ritual Sequence</p>
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Likhit Japa (Written Mantra Practice)</p>
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Room Colors</p>
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Recommended Plants</p>
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
            {data.remedies.map((r: string) => (
              <p key={r} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {r}</p>
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
    <Section title="Muhurta â€” Auspicious Timing Guide" icon="schedule">
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
          <h3 className="text-sm font-bold text-[var(--indigo-deep)] mb-3">Best Timing by Life Domain</h3>
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
                  <p key={s} className="text-xs text-emerald-800 py-0.5">âœ“ {s}</p>
                ))}
              </div>
            )}
            {data.specialDates.avoidDays?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Avoid for New Beginnings</p>
                {data.specialDates.avoidDays.map((s: string) => (
                  <p key={s} className="text-xs text-red-700 py-0.5">âœ— {s}</p>
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_view_week</span>
              Weekly Practices
            </p>
            <div className="space-y-1.5">
              {data.weeklyPractices.map((p: string) => (
                <p key={p} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {p}</p>
              ))}
            </div>
          </div>
        )}
        {data.gemstones?.length > 0 && (
          <div>
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Gemstone Recommendations</p>
            {data.gemstones.map((g: any, i: number) => (
              <div key={g.stone} className={`rounded-xl p-3 text-sm mb-2 ${i === 0 ? 'bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] border border-amber-200' : 'bg-[var(--warm-sand)]'}`}>
                <p className="font-bold text-[var(--indigo-deep)]">{g.stone}</p>
                {g.purpose && <p className="text-xs text-[var(--warm-charcoal)]/70 mt-0.5">{g.purpose}</p>}
                {g.weight && <p className="text-xs text-[var(--warm-charcoal)]/60 mt-0.5">Weight: {g.weight} Â· Wear on: {g.wearingDay}</p>}
              </div>
            ))}
          </div>
        )}
        {data.dietRecommendations?.length > 0 && (
          <div>
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              Diet & Food Remedies
            </p>
            {data.dietRecommendations.map((d: string) => (
              <p key={d} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {d}</p>
            ))}
          </div>
        )}
        {data.charityItems?.length > 0 && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-3">
            <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Dana (Charity Items)</p>
            {data.charityItems.map((c: string) => (
              <p key={c} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {c}</p>
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
            <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Yantras</p>
            {data.yantras.map((y: string) => (
              <p key={y} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {y}</p>
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
// BOOK VIEWER â€” page-turning book UI
// ============================================================

const BOOK_ANIM_STYLES = `
  @keyframes bookExitLeft {
    from { transform: translateX(0); opacity: 1; }
    to   { transform: translateX(-110%) perspective(2500px) rotateY(14deg); opacity: 0; }
  }
  @keyframes bookExitRight {
    from { transform: translateX(0); opacity: 1; }
    to   { transform: translateX(110%) perspective(2500px) rotateY(-14deg); opacity: 0; }
  }
  @keyframes bookEnterRight {
    from { transform: translateX(110%) perspective(2500px) rotateY(-14deg); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes bookEnterLeft {
    from { transform: translateX(-110%) perspective(2500px) rotateY(14deg); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  .book-exit-left  { animation: bookExitLeft  0.65s cubic-bezier(0.77,0,0.175,1) forwards; position: absolute; inset: 0; }
  .book-exit-right { animation: bookExitRight 0.65s cubic-bezier(0.77,0,0.175,1) forwards; position: absolute; inset: 0; }
  .book-enter-right { animation: bookEnterRight 0.65s cubic-bezier(0.77,0,0.175,1) forwards; position: absolute; inset: 0; z-index: 10; }
  .book-enter-left  { animation: bookEnterLeft  0.65s cubic-bezier(0.77,0,0.175,1) forwards; position: absolute; inset: 0; z-index: 10; }
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

// â”€â”€â”€ Decorative left-panel SVG components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        fill="#D4A017" style={{ fontFamily: 'serif', fontWeight: 'bold' }}>à¥</text>
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
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8} fill="#2F2A44">à¤ªà¥à¤°à¥à¤·</text>
    </svg>
  )
}

function DoshaPanel({ vata = 33, pitta = 34, kapha = 33 }: { vata?: number; pitta?: number; kapha?: number }) {
  return (
    <svg viewBox="0 0 180 185" width="160" height="165">
      <circle cx="90" cy="58" r="47" fill="#bae6fd" fillOpacity="0.6" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="55" cy="128" r="47" fill="#fed7aa" fillOpacity="0.6" stroke="#ea580c" strokeWidth="1.5" />
      <circle cx="125" cy="128" r="47" fill="#bbf7d0" fillOpacity="0.6" stroke="#16a34a" strokeWidth="1.5" />
      <text x="90" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0284c7">VÄta</text>
      <text x="90" y="53" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0284c7">{vata}%</text>
      <text x="35" y="147" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ea580c">Pitta</text>
      <text x="35" y="160" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ea580c">{pitta}%</text>
      <text x="145" y="147" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16a34a">Kapha</text>
      <text x="145" y="160" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#16a34a">{kapha}%</text>
    </svg>
  )
}

function MoonArchetypePanel({ archetype }: { archetype?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 130 130" width="120" height="120">
        <circle cx="65" cy="65" r="55" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <ellipse cx="82" cy="65" rx="43" ry="55" fill="#1e293b" fillOpacity="0.88" />
        {[[18, 18], [108, 12], [12, 98], [108, 95], [55, 10]].map(([x, y], i) => (
          <text key={i} x={x} y={y} textAnchor="middle" fontSize="9" fill="#f59e0b">â˜…</text>
        ))}
        <text x="43" y="73" textAnchor="middle" fontSize="34" fill="#D4A017" style={{ fontFamily: 'serif' }}>â˜½</text>
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
      <div className="w-32 h-32 rounded-full border-2 border-dashed border-[var(--warm-sand)] flex items-center justify-center text-4xl">ðŸ§ </div>
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
        const e = ((i + 1) / COLORS.length) * Math.PI * 2 - Math.PI / 2
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
        const a = (i / 11) * Math.PI
        const x = cx - r * Math.cos(a), y = cy - r * Math.sin(a)
        return (
          <g key={m}>
            <circle cx={x} cy={y} r="5.5" fill={MC[i]} fillOpacity="0.8" />
            <text x={x} y={y + 16} textAnchor="middle" fontSize="7.5" fill={MC[i]} fontWeight="bold">{m}</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy - 22} r="20" fill="#f59e0b" fillOpacity="0.18" stroke="#f59e0b" strokeWidth="1.5" />
      <text x={cx} y={cy - 16} textAnchor="middle" fontSize="18" fill="#f59e0b">â˜‰</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="15" fontWeight="bold" fill="#2F2A44"
        style={{ fontFamily: "'Playfair Display', serif" }}>{year}</text>
    </svg>
  )
}

function RemediesPanel() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-3 gap-2">
        {['ðŸª”', 'ðŸ“¿', 'ðŸ’Ž', 'ðŸŒ¿', 'ðŸ•‰ï¸', 'ðŸŒº'].map((emoji, i) => (
          <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--warm-sand)] to-amber-50 border border-[var(--saffron)]/20 flex items-center justify-center text-xl shadow-sm">
            {emoji}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--warm-charcoal)]/40 text-center font-medium tracking-widest uppercase">UpÄya Â· Remedies</p>
    </div>
  )
}

// â”€â”€â”€ Chapter Spread Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChapterSpread({ chapter }: { chapter: BookChapter }) {
  return (
    <div className="grid md:grid-cols-[280px_1fr] min-h-[520px]">
      {/* LEFT PAGE â€” decorative visual */}
      <div className="hidden md:flex flex-col bg-gradient-to-br from-[#fdf6e8] via-[var(--warm-sand)] to-amber-50 border-r-2 border-[var(--saffron)]/20 p-6 relative overflow-hidden">
        {/* Decorative corner ornament */}
        <div className="absolute top-3 left-3 text-[var(--saffron)]/20 text-3xl select-none" style={{ fontFamily: 'serif' }}>â‹</div>
        <div className="absolute bottom-3 right-3 text-[var(--saffron)]/20 text-3xl select-none rotate-180" style={{ fontFamily: 'serif' }}>â‹</div>

        {/* Chapter label */}
        <div className="mb-5">
          <p className="text-[10px] text-[var(--warm-charcoal)]/35 uppercase tracking-[0.2em] font-medium">Chapter {chapter.number}</p>
          <h2 className="text-xl font-bold text-[var(--indigo-deep)] leading-tight mt-0.5"
            style={{ fontFamily: "'Playfair Display', serif" }}>{chapter.title}</h2>
          <p className="text-base text-[var(--saffron)] mt-1" style={{ fontFamily: 'serif' }}>{chapter.sanskrit}</p>
          <div className="mt-2 h-px bg-gradient-to-r from-[var(--saffron)]/50 to-transparent" />
        </div>

        {/* Visual */}
        <div className="flex-1 flex items-center justify-center py-2">
          {chapter.leftPanel}
        </div>

        {/* Page texture line at bottom */}
        <div className="mt-4 flex gap-0.5">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-[var(--saffron)]/15" />
          ))}
        </div>
      </div>

      {/* RIGHT PAGE â€” content */}
      <div className="bg-white overflow-y-auto max-h-[80vh] md:max-h-none">
        {/* Mobile chapter header */}
        <div className="md:hidden flex items-center gap-3 px-5 pt-5 pb-3 border-b border-[var(--warm-sand)] bg-gradient-to-r from-[var(--warm-sand)] to-amber-50">
          <div className="w-8 h-8 rounded-full bg-[var(--saffron)]/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[var(--saffron)]">{chapter.number}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--indigo-deep)]">{chapter.title}</p>
            <p className="text-xs text-[var(--saffron)]" style={{ fontFamily: 'serif' }}>{chapter.sanskrit}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {chapter.content}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Book Viewer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookViewer({ chapters }: { chapters: BookChapter[] }) {
  const active = chapters.filter(c => c.show)
  const [displayIdx, setDisplayIdx] = useState(0)
  const [incoming, setIncoming] = useState<{ idx: number; dir: 1 | -1 } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [bookHeight, setBookHeight] = useState(600)
  const bookRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFS, setIsFS] = useState(false)

  useEffect(() => {
    const handler = () => setIsFS(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function goTo(to: number) {
    if (isAnimating || to === displayIdx || to < 0 || to >= active.length) return
    const dir: 1 | -1 = to > displayIdx ? 1 : -1
    if (containerRef.current) setBookHeight(containerRef.current.offsetHeight)
    setIncoming({ idx: to, dir })
    setIsAnimating(true)
    setTimeout(() => {
      setDisplayIdx(to)
      setIncoming(null)
      setIsAnimating(false)
    }, 700)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      bookRef.current?.requestFullscreen().then(() => setIsFS(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFS(false)).catch(() => {})
    }
  }

  const cur = active[displayIdx]
  const inc = incoming ? active[incoming.idx] : null
  const dir = incoming?.dir ?? 1

  return (
    <div ref={bookRef} className={isFS ? 'fixed inset-0 z-50 bg-[var(--warm-cream)] flex flex-col' : ''}>
      {isFS && (
        <div className="px-6 py-3 flex items-center justify-between border-b border-[var(--warm-sand)] bg-[var(--warm-cream)]">
          <span className="text-sm font-medium text-[var(--warm-charcoal)]/60">
            Chapter {cur.number} Â· {cur.title}
          </span>
          <button onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--indigo-deep)] bg-[var(--warm-sand)] rounded-lg hover:bg-amber-100 transition-colors">
            <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>Exit
          </button>
        </div>
      )}

      {/* Book body */}
      <div className={`${isFS ? 'flex-1 overflow-hidden' : ''}`}>
        {/* Book container with animation */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden shadow-2xl border border-[var(--saffron)]/20"
          style={{ minHeight: isAnimating ? bookHeight : undefined }}
        >
          {/* Book spine gutter */}
          <div className="hidden md:block absolute left-[280px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--saffron)]/30 to-transparent z-20 pointer-events-none" />
          <div className="hidden md:block absolute left-[281px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-[var(--saffron)]/10 to-transparent z-20 pointer-events-none" />

          {/* Current chapter (exits during anim) */}
          <div className={isAnimating ? (dir > 0 ? 'book-exit-left' : 'book-exit-right') : ''}>
            <ChapterSpread chapter={cur} />
          </div>

          {/* Incoming chapter */}
          {inc && (
            <div className={dir > 0 ? 'book-enter-right' : 'book-enter-left'}>
              <ChapterSpread chapter={inc} />
            </div>
          )}
        </div>

        {/* Navigation bar */}
        <div className="flex items-center justify-between mt-4 print:hidden gap-3">
          <button
            onClick={() => goTo(displayIdx - 1)}
            disabled={displayIdx === 0 || isAnimating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--warm-sand)] bg-white text-sm font-medium text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)] hover:text-[var(--indigo-deep)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            <span className="hidden sm:inline max-w-[100px] truncate">{displayIdx > 0 ? active[displayIdx - 1].title : 'Start'}</span>
          </button>

          {/* Chapter dots */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {active.map((c, i) => (
              <button key={c.id} onClick={() => goTo(i)} title={c.title}
                className={`rounded-full transition-all duration-300 ${
                  i === displayIdx
                    ? 'w-7 h-2.5 bg-[var(--indigo-deep)]'
                    : 'w-2.5 h-2.5 bg-[var(--warm-sand)] hover:bg-[var(--warm-charcoal)]/30'
                }`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen toggle */}
            <button onClick={toggleFullscreen}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[var(--warm-sand)] bg-white text-xs text-[var(--warm-charcoal)]/50 hover:text-[var(--indigo-deep)] hover:border-[var(--indigo-deep)] transition-all"
              title="Toggle fullscreen">
              <span className="material-symbols-outlined text-[16px]">{isFS ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>

            <button
              onClick={() => goTo(displayIdx + 1)}
              disabled={displayIdx === active.length - 1 || isAnimating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--warm-sand)] bg-white text-sm font-medium text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)] hover:text-[var(--indigo-deep)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline max-w-[100px] truncate">{displayIdx < active.length - 1 ? active[displayIdx + 1].title : 'End'}</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function ReportDetailPage() {

  const { reportId } = useParams<{ reportId: string }>()
  const supabase = createClient()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reports')
        .select('id,report_type,status,report_content,created_at,family_members(full_name,date_of_birth,place_of_birth)')
        .eq('id', reportId)
        .single()
      if (data) setReport(data as Report)
      setLoading(false)
    }
    load()
  }, [reportId])

  function handlePrint() {
    setDownloading(true)
    setTimeout(() => { window.print(); setDownloading(false) }, 300)
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
    <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
      <SudarshanLoader size="lg" />
      <div className="text-center">
        <p className="font-bold text-[var(--indigo-deep)] text-lg">Your report is being generated</p>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Please wait â€” this page will update automatically</p>
      </div>
      <Link href="/reports/generate" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Generate
      </Link>
    </div>
  )

  const d = report.report_content || {}
  const member = report.family_members as any
  const isHindi = lang === 'hi'
  const titles = isHindi ? REPORT_TITLES_HI : REPORT_TITLES
  const title = titles[report.report_type] || `${report.report_type.replace(/_/g, ' ')} Report`
  const isFull = report.report_type === 'full_tathastu'
  const isGenerated = ['generated', 'reviewed', 'delivered'].includes(report.status)

  const chapters: BookChapter[] = [
    {
      id: 'astrology', number: 'I', title: 'Kundli & Birth Chart', sanskrit: 'à¤—à¥à¤°à¤¹ à¤œà¥à¤¯à¥‹à¤¤à¤¿à¤·',
      leftPanel: d.kundli ? <KundliWheel kundli={d.kundli} /> : <OmMandala size={175} />,
      content: <KundliSection data={d} />,
      show: (report.report_type === 'astrology' || isFull) && !!d.kundli,
    },
    {
      id: 'numerology', number: 'II', title: 'Numerology Analysis', sanskrit: 'à¤…à¤‚à¤•à¤¶à¤¾à¤¸à¥à¤¤à¥à¤°',
      leftPanel: d.numerology
        ? <NumerologyGrid numerology={d.numerology} member={{ name: member?.full_name, dob: member?.date_of_birth }} />
        : <OmMandala size={175} />,
      content: <NumerologySection data={d} />,
      show: (report.report_type === 'numerology' || isFull) && !!d.numerology,
    },
    {
      id: 'shakti_chakra', number: 'III', title: 'Shakti Chakra', sanskrit: 'à¤¶à¤•à¥à¤¤à¤¿ à¤šà¤•à¥à¤°',
      leftPanel: (d.chakras || d.chakra)
        ? <ChakraChart data={{ chakras: d.chakras || d.chakra, overallBalance: d.overallBalance }} />
        : <OmMandala size={175} />,
      content: <ChakraSection data={d.chakras || d.chakra} />,
      show: (report.report_type === 'shakti_chakra' || isFull) && !!(d.chakras || d.chakra),
    },
    {
      id: 'prakriti', number: 'IV', title: 'Prakriti Â· Ayurveda', sanskrit: 'à¤ªà¥à¤°à¤•à¥ƒà¤¤à¤¿',
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
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Diet Recommendations</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.prakriti.diet.map((f: string) => <span key={f} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">{f}</span>)}
                </div>
              </div>
            )}
            {d.prakriti?.lifestyle?.length > 0 && (
              <div>
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Lifestyle Guidelines</p>
                {d.prakriti.lifestyle.map((l: string) => <p key={l} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {l}</p>)}
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
      show: (report.report_type === 'prakriti' || isFull) && !!d.prakriti,
    },
    {
      id: 'yantra_colour', number: 'V', title: 'Yantra & Colour', sanskrit: 'à¤¯à¤‚à¤¤à¥à¤° à¤°à¤‚à¤— à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤¾',
      leftPanel: <SriYantraPanel size={175} />,
      content: <YantraSection data={d.yantra || d.yantraColour} />,
      show: (report.report_type === 'yantra_colour' || isFull) && !!(d.yantra || d.yantraColour),
    },
    {
      id: 'mantra_chanting', number: 'VI', title: 'Mantra Guidance', sanskrit: 'à¤®à¤‚à¤¤à¥à¤° à¤œà¤ª',
      leftPanel: (
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] flex items-center justify-center shadow-xl">
            <span className="text-5xl text-white" style={{ fontFamily: 'serif' }}>à¥</span>
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
      content: <MantraSection data={d.mantras || d.mantra} />,
      show: (['mantra_chanting', 'mantra_writing'].includes(report.report_type) || isFull) && !!(d.mantras || d.mantra),
    },
    {
      id: 'psychology', number: 'VII', title: 'Vedic Psychology', sanskrit: 'à¤µà¥ˆà¤¦à¤¿à¤• à¤®à¤¨à¥‹à¤µà¤¿à¤œà¥à¤žà¤¾à¤¨',
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
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Core Traits & Strengths</p>
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
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Shadow Work Themes</p>
                {d.psychology.shadowWork.map((s: string) => <p key={s} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {s}</p>)}
              </div>
            )}
          </div>
        </Section>
      ),
      show: (report.report_type === 'psychology' || isFull) && !!d.psychology,
    },
    {
      id: 'astro_vastu', number: 'VIII', title: 'Astro Vastu', sanskrit: 'à¤œà¥à¤¯à¥‹à¤¤à¤¿à¤· à¤µà¤¾à¤¸à¥à¤¤à¥',
      leftPanel: <VastuCompassPanel size={165} />,
      content: <VastuSection data={d.vastu || d.vastuAnalysis} />,
      show: (report.report_type === 'astro_vastu' || isFull) && !!(d.vastu || d.vastuAnalysis),
    },
    {
      id: 'dmit', number: 'IX', title: 'DMIT Intelligence', sanskrit: 'à¤¬à¥à¤¦à¥à¤§à¤¿à¤®à¤¤à¥à¤¤à¤¾ à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤²',
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
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-3">Intelligence Profile</p>
                {d.dmit.allIntelligences?.map((intel: any) => (
                  <div key={intel.type} className="mb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-[var(--indigo-deep)]">{intel.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${intel.strength === 'Strong' ? 'bg-emerald-100 text-emerald-700' : intel.strength === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{intel.strength} Â· {intel.score}</span>
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
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Recommended Academic Streams</p>
                <div className="flex gap-2 flex-wrap">
                  {d.dmit.recommendedStreams.map((s: string) => (
                    <span key={s} className="text-xs bg-[var(--indigo-deep)] text-white px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {d.dmit?.careerAlignment?.length > 0 && (
              <div>
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Career Alignment</p>
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
      show: (report.report_type === 'dmit' || isFull) && !!d.dmit,
    },
    {
      id: 'colour_therapy', number: 'X', title: 'Colour Therapy', sanskrit: 'à¤°à¤‚à¤— à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤¾',
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
                  {d.colourTherapy.chromotherapy.sessions && <p className="text-sm text-[var(--warm-charcoal)]/70">â€¢ {d.colourTherapy.chromotherapy.sessions}</p>}
                  {d.colourTherapy.chromotherapy.duration && <p className="text-sm text-[var(--warm-charcoal)]/70">â€¢ Duration: {d.colourTherapy.chromotherapy.duration}</p>}
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
      show: (report.report_type === 'colour_therapy' || isFull) && !!d.colourTherapy,
    },
    {
      id: 'annual_prediction', number: 'XI', title: 'Annual Prediction', sanskrit: 'à¤µà¤¾à¤°à¥à¤·à¤¿à¤• à¤­à¤µà¤¿à¤·à¥à¤¯à¤µà¤¾à¤£à¥€',
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
      id: 'muhurta', number: 'XII', title: 'Muhurta â€” Timing', sanskrit: 'à¤®à¥à¤¹à¥‚à¤°à¥à¤¤',
      leftPanel: <AnnualArcPanel />,
      content: <MuhurtaSection data={d.muhurta} />,
      show: isFull && !!d.muhurta,
    },
    {
      id: 'remedies', number: 'XIII', title: 'Remedies & UpÄya', sanskrit: 'à¤‰à¤ªà¤¾à¤¯',
      leftPanel: <RemediesPanel />,
      content: <RemediesSection data={d.remediesSummary || d.remedies} />,
      show: isFull && !!(d.remediesSummary || d.remedies),
    },
    {
      id: 'child_development', number: 'I', title: 'Child Development', sanskrit: 'à¤¬à¤¾à¤² à¤µà¤¿à¤•à¤¾à¤¸',
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
                <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Key Milestones</p>
                {d.childDevelopment.milestones.map((m: string) => <p key={m} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {m}</p>)}
              </div>
            )}
            {d.childDevelopment?.parentingAdvice?.length > 0 && (
              <div className="bg-[var(--warm-sand)] rounded-xl p-4">
                <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-2">Parenting Guidance</p>
                {d.childDevelopment.parentingAdvice.map((a: string) => <p key={a} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">â€¢ {a}</p>)}
              </div>
            )}
          </div>
        </Section>
      ),
      show: report.report_type === 'child_development' && !!d.childDevelopment,
    },
    {
      id: 'mobile_number', number: 'I', title: 'Mobile Number Analysis', sanskrit: 'à¤…à¤‚à¤•à¤¶à¤¾à¤¸à¥à¤¤à¥à¤°',
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

  const visibleChapters = chapters.filter(c => c.show)

  const PRINT_CSS = `
    @media print {
      @page { size: A4 portrait; margin: 1.5cm; }
      body { visibility: hidden; }
      #rpa, #rpa * { visibility: visible; }
      #rpa { position: absolute; left: 0; top: 0; width: 100%; }
      .no-print { display: none !important; }
      .card-divine { box-shadow: none !important; border: 1px solid #e5e7eb !important; break-inside: avoid; margin-bottom: 10px; }
      table { font-size: 9px !important; width: 100%; border-collapse: collapse; }
      table th, table td { padding: 3px 6px !important; border: 1px solid #e5e7eb; }
      h2 { font-size: 15px !important; } h3 { font-size: 12px !important; }
      p, span, li { font-size: 11px !important; line-height: 1.55 !important; }
    }
  `

  return (
    <>
      <style>{PRINT_CSS + BOOK_ANIM_STYLES}</style>

      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Screen header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <Link href="/reports" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports
            </Link>
            <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h1>
            {member && (
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">
                {member.full_name} Â· {member.place_of_birth || ''} Â· {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center bg-[var(--warm-sand)] rounded-lg p-0.5 gap-0.5">
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-[var(--indigo-deep)] text-white' : 'text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>EN</button>
              <button onClick={() => setLang('hi')} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'hi' ? 'bg-[var(--indigo-deep)] text-white' : 'text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>à¤¹à¤¿à¤‚</button>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${isGenerated ? 'bg-emerald-100 text-emerald-700' : report.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {report.status}
            </span>
            {isGenerated && (
              <button onClick={handlePrint} disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--indigo-deep)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                {downloading ? 'Preparingâ€¦' : 'Download PDF'}
              </button>
            )}
          </div>
        </div>

        {/* Screen: book viewer */}
        {!isGenerated ? (
          <div className="card-divine p-8 text-center no-print">
            <SudarshanLoader size="lg" className="mb-4" />
            <p className="font-bold text-[var(--indigo-deep)]">Report is being generated...</p>
          </div>
        ) : visibleChapters.length > 0 ? (
          <div className="no-print"><BookViewer chapters={chapters} /></div>
        ) : (
          <div className="card-divine p-8 text-center no-print">
            <p className="text-[var(--warm-charcoal)]/60">Report content not yet available.</p>
          </div>
        )}

        {/* Print-only: beautiful 30-page PDF layout */}
        <div id="rpa" ref={printRef} style={{ display: 'none' }}>

          {/* COVER PAGE */}
          <div style={{ minHeight: '27cm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #1a1535 0%, #2F2A44 50%, #1a1535 100%)', color: 'white', padding: '60px 48px', pageBreakAfter: 'always' }}>
            <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
              <div style={{ fontSize: 80, marginBottom: 8, color: '#D4A017', lineHeight: 1 }}>à¥</div>
              <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #D4A017, transparent)', margin: '16px auto' }} />
              <p style={{ fontSize: 11, color: 'rgba(212,160,23,0.7)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 20 }}>DivyaTathastu Â· Noxatra System</p>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, color: '#D4A017', marginBottom: 12, lineHeight: 1.2 }}>{title}</h1>
              <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #D4A017, transparent)', margin: '16px auto 28px' }} />
              {member && (
                <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 12, padding: '20px 28px', marginBottom: 32 }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8, fontFamily: 'Georgia, serif' }}>{member.full_name}</p>
                  {member.date_of_birth && (
                    <p style={{ fontSize: 13, color: '#D4A017', marginBottom: 4 }}>
                      Born: {new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {member.place_of_birth && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{member.place_of_birth}</p>}
                </div>
              )}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                Generated: {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div style={{ marginTop: 40, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                  Prepared using Vedic Jyotish Â· Numerology Â· Chakra Analysis Â· Ayurveda<br />
                  Vastu Shastra Â· Psychology Â· DMIT Â· Colour Therapy Â· Annual Prediction
                </p>
              </div>
            </div>
          </div>

          {/* ABOUT & BENEFITS PAGE */}
          <div style={{ padding: '44px 44px', pageBreakAfter: 'always', minHeight: '27cm', background: '#fdf8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #D4A017' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2F2A44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#D4A017', flexShrink: 0 }}>à¥</div>
              <div>
                <p style={{ fontSize: 10, color: '#D4A017', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Preface</p>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2F2A44', fontWeight: 700, margin: 0 }}>Understanding Your Report</h2>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'white', borderRadius: 10, padding: 18, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#E36414', fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>ðŸ”­ What Is This Report?</h3>
                <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.65 }}>The Noxatra Report integrates 11 Vedic life-science systems into a single comprehensive document. Jyotish astrology, numerology, Ayurvedic Prakriti, chakra analysis, Vastu Shastra, Vedic psychology, DMIT, colour therapy, auspicious timing, and personalized remedies â€” all computed precisely from your birth data.</p>
              </div>
              <div style={{ background: 'white', borderRadius: 10, padding: 18, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#2F2A44', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>âœ¨ How To Use This Report</h3>
                <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.65 }}>Read each chapter as a mirror to your soul â€” not as fate, but as guidance. Use the planetary positions to understand your natural timing. Apply the remedies consistently. Align your home per Vastu recommendations. Chant your personal mantra daily. Let this report become your personal dharmic compass.</p>
              </div>
            </div>
            <div style={{ background: '#2F2A44', borderRadius: 10, padding: 22, color: 'white', marginBottom: 18 }}>
              <h3 style={{ color: '#D4A017', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>What This Report Covers â€” {visibleChapters.length} Chapters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { e: 'â­', t: 'Birth Chart (Kundli)', d: 'Planets, houses, yogas, dasha periods' },
                  { e: 'ðŸ”¢', t: 'Numerology', d: 'Life path, soul urge, karmic numbers' },
                  { e: 'ðŸŒˆ', t: 'Chakra Analysis', d: '7 energy centers with balance scores' },
                  { e: 'ðŸŒ¿', t: 'Prakriti (Ayurveda)', d: 'Body constitution & health blueprint' },
                  { e: 'ðŸ”¶', t: 'Yantra & Colour', d: 'Personal yantra, gemstone, power colors' },
                  { e: 'ðŸ“¿', t: 'Mantra Practice', d: 'Personalized beej mantra & ritual guide' },
                  { e: 'ðŸ§˜', t: 'Psychology Profile', d: 'Moon archetype & personality insights' },
                  { e: 'ðŸ ', t: 'Astro Vastu', d: 'Home directions aligned to your planets' },
                  { e: 'ðŸ“…', t: 'Muhurta & Timing', d: 'Auspicious dates for key life decisions' },
                ].map(b => (
                  <div key={b.t} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 7, padding: 10 }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{b.e}</div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#D4A017', marginBottom: 3 }}>{b.t}</p>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{b.d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 10, padding: 18, border: '1px solid #e5e7eb' }}>
              <h3 style={{ color: '#2F2A44', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>About DivyaTathastu</h3>
              <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.65 }}>DivyaTathastu is India's premier Vedic life sciences platform, combining 5,000 years of ancient Indian wisdom with NASA-grade computational precision. Our Noxatra engine processes birth data through 11 distinct analytical frameworks. Planetary positions are computed with Lahiri ayanamsa (official ayanamsa of the Government of India) for authentic sidereal astrology. Every report is freshly generated â€” no templates, only precise personalized calculations.</p>
            </div>
          </div>

          {/* TABLE OF CONTENTS */}
          <div style={{ padding: '44px', pageBreakAfter: 'always', minHeight: '27cm' }}>
            <div style={{ borderBottom: '2px solid #D4A017', paddingBottom: 14, marginBottom: 28 }}>
              <p style={{ fontSize: 10, color: '#D4A017', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Navigation</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2F2A44', fontWeight: 700, margin: 0 }}>Table of Contents</h2>
            </div>
            {[
              { label: 'Cover', desc: 'Report Identity & Date' },
              { label: 'Preface', desc: 'Understanding Your Report & About DivyaTathastu' },
              ...visibleChapters.map(c => ({ label: `Chapter ${c.number}`, desc: `${c.title} Â· ${c.sanskrit}` })),
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
            <div key={c.id} style={{ pageBreakBefore: 'always' }}>
              <div style={{ background: 'linear-gradient(135deg, #2F2A44 0%, #3d3560 100%)', padding: '28px 44px', color: 'white' }}>
                <p style={{ fontSize: 10, color: 'rgba(212,160,23,0.75)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Chapter {c.number}</p>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#D4A017', marginBottom: 4, lineHeight: 1.2 }}>{c.title}</h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontFamily: 'Georgia, serif', margin: 0 }}>{c.sanskrit}</p>
              </div>
              <div style={{ padding: '24px 44px 36px', background: '#ffffff' }}>
                {c.content}
              </div>
            </div>
          ))}

          {/* DISCLAIMER PAGE */}
          <div style={{ padding: '44px', pageBreakBefore: 'always', background: '#fdf8f0', minHeight: '22cm' }}>
            <div style={{ borderBottom: '2px solid #D4A017', paddingBottom: 14, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2F2A44', fontWeight: 700, margin: 0 }}>Appendix: Disclaimer & Guidance Notes</h2>
            </div>
            {[
              { title: 'Nature of This Report', body: 'This Noxatra report is prepared for informational, educational, and self-discovery purposes only. It is based on traditional Indian astrological, numerological, and Ayurvedic systems and should be treated as guidance for self-awareness rather than as definitive prediction or professional advice.' },
              { title: 'Medical Disclaimer', body: 'The Ayurvedic and health-related content (Prakriti analysis, health recommendations, dietary suggestions) is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.' },
              { title: 'Financial Disclaimer', body: 'Muhurta timing guidance and financial period analysis are traditional Vedic tools for awareness and should not be used as the sole basis for financial or investment decisions. Consult qualified financial advisors for investment choices.' },
              { title: 'Astronomical Accuracy', body: 'Planetary positions are calculated using the NASA-grade astronomy-engine library with Lahiri ayanamsa (the official standard of the Government of India). Results depend on the accuracy of birth date, time, and place provided.' },
              { title: 'Free Will & Destiny', body: 'Vedic astrology recognizes that the birth chart shows tendencies and potential â€” not fixed destiny. Human free will, conscious effort, and spiritual practice can always influence outcomes. This report is a map, not a sentence.' },
            ].map(item => (
              <div key={item.title} style={{ marginBottom: 16, background: 'white', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#2F2A44', marginBottom: 6 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
              </div>
            ))}
            <div style={{ marginTop: 28, background: '#2F2A44', borderRadius: 10, padding: '24px 28px', color: 'white', textAlign: 'center' }}>
              <p style={{ fontSize: 28, margin: '0 0 8px', color: '#D4A017' }}>à¥ à¤¤à¤¤à¥ à¤¸à¤¤à¥</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                May this report guide you on your path to self-knowledge and dharmic living.
              </p>
              <p style={{ fontSize: 12, color: '#D4A017', marginBottom: 4 }}>â€” DivyaTathastu Â· Noxatra Report System</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>www.divyatathastu.com</p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
