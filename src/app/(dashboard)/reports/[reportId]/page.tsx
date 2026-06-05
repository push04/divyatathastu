'use client'

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
                <p key={r} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {r}</p>
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
          <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Personal Year {n.personalYearNumber} — {new Date().getFullYear()}</p>
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
  const CHAKRA_COLORS = ['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#0284C7', '#4F46E5', '#7C3AED']
  const CHAKRA_BG = ['bg-red-50', 'bg-orange-50', 'bg-yellow-50', 'bg-green-50', 'bg-sky-50', 'bg-indigo-50', 'bg-violet-50']
  return (
    <Section title="Shakti Chakra Analysis" icon="local_florist">
      <div className="space-y-4 mt-4">
        {chakras.map((c: any, i: number) => (
          <div key={c.name} className={`rounded-xl p-4 ${CHAKRA_BG[i] || 'bg-[var(--warm-sand)]'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-[var(--indigo-deep)] text-sm">{c.name}</span>
                {c.sanskrit && <span className="ml-2 text-xs text-[var(--warm-charcoal)]/50">({c.sanskrit}) · {c.element}</span>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'balanced' ? 'bg-emerald-100 text-emerald-700' : c.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {c.status} · {c.level}%
              </span>
            </div>
            <div className="bg-white/60 rounded-full h-2 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all" style={{ width: `${c.level}%`, backgroundColor: CHAKRA_COLORS[i] }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {c.mantras?.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Mantra</p>
                  <p className="text-[var(--indigo-deep)] font-bold">{c.mantras[0]}</p>
                </div>
              )}
              {c.crystals?.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Crystals</p>
                  <p className="text-[var(--indigo-deep)]">{c.crystals.slice(0, 2).join(', ')}</p>
                </div>
              )}
              {c.yoga?.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Yoga Pose</p>
                  <p className="text-[var(--indigo-deep)]">{c.yoga[0]}</p>
                </div>
              )}
              {c.foods?.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--warm-charcoal)]/50 mb-0.5">Healing Foods</p>
                  <p className="text-[var(--indigo-deep)]">{c.foods.slice(0, 2).join(', ')}</p>
                </div>
              )}
            </div>
            {c.affirmations?.length > 0 && (
              <p className="mt-2 text-xs italic text-[var(--warm-charcoal)]/60 border-l-2 border-current pl-2">"{c.affirmations[0]}"</p>
            )}
          </div>
        ))}
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
              <span key={c} className="text-sm px-3 py-1 rounded-full font-medium border-2 border-[var(--saffron)] bg-amber-50">{c}</span>
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
            <div className="bg-[var(--warm-sand)] rounded-lg p-2.5">
              <p className="font-bold text-[var(--indigo-deep)]/60 mb-0.5">For Health</p>
              <p className="text-[var(--warm-charcoal)]/70">{Array.isArray(data.colourTherapy.forHealth) ? data.colourTherapy.forHealth.join(', ') : data.colourTherapy.forHealth}</p>
            </div>
          )}
          {data.colourTherapy.forWealth && (
            <div className="bg-[var(--warm-sand)] rounded-lg p-2.5">
              <p className="font-bold text-[var(--indigo-deep)]/60 mb-0.5">For Wealth</p>
              <p className="text-[var(--warm-charcoal)]/70">{Array.isArray(data.colourTherapy.forWealth) ? data.colourTherapy.forWealth.join(', ') : data.colourTherapy.forWealth}</p>
            </div>
          )}
          {data.colourTherapy.avoid && (
            <div className="bg-red-50 rounded-lg p-2.5">
              <p className="font-bold text-red-600/70 mb-0.5">Avoid</p>
              <p className="text-red-600/80">{Array.isArray(data.colourTherapy.avoid) ? data.colourTherapy.avoid.join(', ') : data.colourTherapy.avoid}</p>
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
              <p key={r} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {r}</p>
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
    <Section title="Muhurta — Auspicious Timing Guide" icon="schedule">
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
                <p key={p} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {p}</p>
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
                {g.weight && <p className="text-xs text-[var(--warm-charcoal)]/60 mt-0.5">Weight: {g.weight} · Wear on: {g.wearingDay}</p>}
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
              <p key={d} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {d}</p>
            ))}
          </div>
        )}
        {data.charityItems?.length > 0 && (
          <div className="bg-[var(--warm-sand)] rounded-xl p-3">
            <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Dana (Charity Items)</p>
            {data.charityItems.map((c: string) => (
              <p key={c} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {c}</p>
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
              <p key={y} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {y}</p>
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

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const supabase = createClient()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
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
    setTimeout(() => {
      window.print()
      setDownloading(false)
    }, 300)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-4xl animate-spin-slow">ॐ</div>
    </div>
  )
  if (!report) return (
    <div className="p-6 text-center">
      <p>Report not found.</p>
      <Link href="/reports" className="text-[var(--terracotta)] inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports
      </Link>
    </div>
  )

  const d = report.report_content || {}
  const member = report.family_members as any
  const title = REPORT_TITLES[report.report_type] || `${report.report_type.replace(/_/g, ' ')} Report`

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1.5cm; }
          body * { visibility: hidden; }
          #report-print-area, #report-print-area * { visibility: visible; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border-width: 1px !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:pointer-events-none { pointer-events: none !important; }
          .print\\:break-inside-avoid-page { break-inside: avoid-page; }
          .card-divine { break-inside: avoid; margin-bottom: 12px !important; }
          .space-y-4 > * + * { margin-top: 12px !important; }
          table { font-size: 10px !important; }
          h1 { font-size: 20px !important; }
          h2 { font-size: 14px !important; }
          p, span, td { font-size: 11px !important; }
        }
      `}</style>

      <div ref={printRef} className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div id="report-print-area">
          <div className="flex items-start justify-between print:mb-6">
            <div>
              <Link href="/reports" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1 print:hidden">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports
              </Link>
              {/* Print header */}
              <div className="hidden print:flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--saffron)] flex items-center justify-center text-white font-bold text-lg">ॐ</div>
                <div>
                  <p className="font-bold text-[var(--indigo-deep)]" style={{ fontFamily: 'serif' }}>MahaTathastu</p>
                  <p className="text-xs text-[var(--warm-charcoal)]/50">Noxatra Report System</p>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-1">{title}</h1>
              {member && (
                <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">
                  {member.full_name} · {member.place_of_birth || ''} · Generated: {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${['generated', 'reviewed', 'delivered'].includes(report.status) ? 'bg-emerald-100 text-emerald-700' : report.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {report.status}
              </span>
              {['generated', 'reviewed', 'delivered'].includes(report.status) && (
                <button
                  onClick={handlePrint}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--indigo-deep)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                  {downloading ? 'Preparing…' : 'Download PDF'}
                </button>
              )}
            </div>
          </div>

          {!['generated', 'reviewed', 'delivered'].includes(report.status) ? (
            <div className="card-divine p-8 text-center">
              <div className="text-5xl animate-spin-slow mb-4">ॐ</div>
              <p className="font-bold text-[var(--indigo-deep)]">Report is being generated...</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Please refresh in a few moments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(report.report_type === 'astrology' || report.report_type === 'full_tathastu') && d.kundli && (
                <KundliSection data={d} />
              )}
              {(report.report_type === 'numerology' || report.report_type === 'full_tathastu') && d.numerology && (
                <NumerologySection data={d} />
              )}
              {(report.report_type === 'shakti_chakra' || report.report_type === 'full_tathastu') && (d.chakras || d.chakra) && (
                <ChakraSection data={d.chakras || d.chakra} />
              )}
              {(report.report_type === 'prakriti' || report.report_type === 'full_tathastu') && d.prakriti && (
                <Section title="Prakriti (Ayurvedic Constitution)" icon="eco">
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Vata', value: d.prakriti.vata, color: 'bg-sky-50 border-sky-300 text-sky-700' },
                        { label: 'Pitta', value: d.prakriti.pitta, color: 'bg-orange-50 border-orange-300 text-orange-700' },
                        { label: 'Kapha', value: d.prakriti.kapha, color: 'bg-green-50 border-green-300 text-green-700' },
                      ].map(item => (
                        <div key={item.label} className={`rounded-xl p-3 text-center border-2 ${item.color}`}>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-2xl font-bold">{item.value}%</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                      <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Dominant Dosha</p>
                      <p className="font-bold text-[var(--indigo-deep)] text-lg">{d.prakriti.dominant}</p>
                      {d.prakriti.secondary && <p className="text-sm text-[var(--warm-charcoal)]/60">Secondary: {d.prakriti.secondary}</p>}
                    </div>
                    {d.prakriti.diet?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Diet Recommendations</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.prakriti.diet.map((f: string) => <span key={f} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">{f}</span>)}
                        </div>
                      </div>
                    )}
                    {d.prakriti.lifestyle?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Lifestyle Guidelines</p>
                        {d.prakriti.lifestyle.map((l: string) => <p key={l} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {l}</p>)}
                      </div>
                    )}
                    {d.prakriti.avoid?.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Foods to Avoid</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.prakriti.avoid.map((f: string) => <span key={f} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{f}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}
              {(report.report_type === 'yantra_colour' || report.report_type === 'full_tathastu') && (d.yantra || d.yantraColour) && (
                <YantraSection data={d.yantra || d.yantraColour} />
              )}
              {(['mantra_chanting', 'mantra_writing'].includes(report.report_type) || report.report_type === 'full_tathastu') && (d.mantras || d.mantra) && (
                <MantraSection data={d.mantras || d.mantra} />
              )}
              {(report.report_type === 'astro_vastu' || report.report_type === 'full_tathastu') && (d.vastu || d.vastuAnalysis) && (
                <VastuSection data={d.vastu || d.vastuAnalysis} />
              )}
              {report.report_type === 'full_tathastu' && d.annualPrediction && (
                <Section title="Annual Prediction" icon="calendar_today">
                  <div className="mt-4 space-y-3">
                    {d.annualPrediction.overallTheme && (
                      <div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-4 text-white">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Annual Theme</p>
                        <p className="text-sm leading-relaxed">{d.annualPrediction.overallTheme}</p>
                      </div>
                    )}
                    {d.annualPrediction.quarters?.map((q: any) => (
                      <div key={q.period} className="flex gap-4 items-start py-2.5 border-b border-[var(--warm-sand)]">
                        <span className="text-sm font-bold text-[var(--terracotta)] w-32 flex-shrink-0">{q.period}</span>
                        <div>
                          {q.theme && <p className="text-xs font-semibold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-0.5">{q.theme}</p>}
                          <p className="text-sm text-[var(--warm-charcoal)]/70">{q.guidance}</p>
                          {q.focus && <p className="text-xs text-[var(--saffron)] mt-0.5">Focus: {q.focus}</p>}
                        </div>
                      </div>
                    ))}
                    {d.annualPrediction.favorable?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-600">Favorable periods:</span>
                        {d.annualPrediction.favorable.map((f: string) => (
                          <span key={f} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>
              )}
              {(report.report_type === 'psychology' || report.report_type === 'full_tathastu') && d.psychology && (
                <Section title="Vedic Psychology Profile" icon="self_improvement">
                  <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-br from-violet-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-violet-400">
                      <p className="text-lg font-bold text-[var(--indigo-deep)]">{d.psychology.moonPersonalityType} Archetype</p>
                      <p className="text-sm text-[var(--warm-charcoal)]/70 mt-1">{d.psychology.emotionalPatterns}</p>
                    </div>
                    {(d.psychology.coreTrait || d.psychology.strengths)?.length > 0 && (
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
                        { label: 'Cognitive Style', value: d.psychology.cognitiveStyle },
                        { label: 'Career Personality', value: d.psychology.careerPersonality },
                        { label: 'Relationship Style', value: d.psychology.relationshipStyle },
                        { label: 'Stress Triggers', value: d.psychology.stressTriggers },
                      ].filter(i => i.value).map(item => (
                        <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3">
                          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-sm text-[var(--warm-charcoal)]/80">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {d.psychology.growthEdge && (
                      <div className="bg-gradient-to-r from-amber-50 to-[var(--warm-sand)] rounded-xl p-4 border-l-4 border-[var(--saffron)]">
                        <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-1">Growth Edge</p>
                        <p className="text-sm text-[var(--warm-charcoal)]/80">{d.psychology.growthEdge}</p>
                      </div>
                    )}
                    {d.psychology.shadowWork?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Shadow Work Themes</p>
                        {d.psychology.shadowWork.map((s: string) => (
                          <p key={s} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>
              )}
              {report.report_type === 'full_tathastu' && d.muhurta && (
                <MuhurtaSection data={d.muhurta} />
              )}
              {report.report_type === 'full_tathastu' && (d.remediesSummary || d.remedies) && (
                <RemediesSection data={d.remediesSummary || d.remedies} />
              )}
              {(report.report_type === 'dmit' || report.report_type === 'full_tathastu') && d.dmit && (
                <Section title="DMIT Intelligence Profile" icon="psychology">
                  <div className="mt-4 space-y-4">
                    {d.dmit.learningStyle && (
                      <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                        <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Learning Style</p>
                        <p className="text-sm text-[var(--warm-charcoal)]/80">{d.dmit.learningStyle}</p>
                      </div>
                    )}
                    {d.dmit.dominantIntelligences?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-3">Intelligence Profile</p>
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
                    {d.dmit.recommendedStreams?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Recommended Academic Streams</p>
                        <div className="flex gap-2 flex-wrap">
                          {d.dmit.recommendedStreams.map((s: string) => (
                            <span key={s} className="text-xs bg-[var(--indigo-deep)] text-white px-3 py-1 rounded-full font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {d.dmit.careerAlignment?.length > 0 && (
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
              )}
              {(report.report_type === 'colour_therapy' || report.report_type === 'full_tathastu') && d.colourTherapy && (
                <Section title="Colour Therapy" icon="palette">
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Physical Healing', colors: d.colourTherapy.healingColors?.physical },
                        { label: 'Emotional Healing', colors: d.colourTherapy.healingColors?.emotional },
                        { label: 'Mental Clarity', colors: d.colourTherapy.healingColors?.mental },
                        { label: 'Spiritual Growth', colors: d.colourTherapy.healingColors?.spiritual },
                      ].filter(i => i.colors?.length).map(item => (
                        <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3">
                          <p className="text-xs font-bold text-[var(--indigo-deep)]/60 mb-1.5">{item.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {item.colors.slice(0, 3).map((c: string) => (
                              <span key={c} className="text-xs bg-white/80 px-1.5 py-0.5 rounded">{c}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {d.colourTherapy.chromotherapy && (
                      <div className="bg-[var(--warm-sand)] rounded-xl p-4">
                        <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-2">Chromotherapy Protocol</p>
                        <div className="space-y-1 text-sm text-[var(--warm-charcoal)]/70">
                          <p>• Primary color: <span className="font-medium">{d.colourTherapy.chromotherapy.primaryColor}</span></p>
                          <p>• {d.colourTherapy.chromotherapy.sessions}</p>
                          <p>• Duration: {d.colourTherapy.chromotherapy.duration}</p>
                        </div>
                        {d.colourTherapy.chromotherapy.waterSolarization && (
                          <p className="mt-2 text-xs text-[var(--warm-charcoal)]/60 italic">{d.colourTherapy.chromotherapy.waterSolarization}</p>
                        )}
                      </div>
                    )}
                    {d.colourTherapy.clothing && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Clothing Colors</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {Object.entries(d.colourTherapy.clothing).filter(([k]) => k !== 'weeklySchedule').map(([key, val]) => (
                            <div key={key} className="bg-[var(--warm-sand)] rounded-lg p-2">
                              <p className="font-bold text-[var(--indigo-deep)]/60 capitalize mb-0.5">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="text-[var(--warm-charcoal)]/70">{val as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {d.colourTherapy.colorMeditation && (
                      <div className="bg-[var(--warm-sand)] rounded-xl p-4">
                        <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Colour Meditation</p>
                        <p className="text-sm text-[var(--warm-charcoal)]/70 leading-relaxed">{d.colourTherapy.colorMeditation}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}
              {report.report_type === 'child_development' && d.childDevelopment && (
                <Section title="Child Development Report" icon="child_care">
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoCard label="Developmental Stage" value={d.childDevelopment.stage} />
                      <InfoCard label="Age" value={`${d.childDevelopment.age} years`} />
                    </div>
                    {d.childDevelopment.learningStyle && (
                      <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                        <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Learning Style</p>
                        <p className="text-sm text-[var(--warm-charcoal)]/80">{d.childDevelopment.learningStyle}</p>
                      </div>
                    )}
                    {d.childDevelopment.milestones?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Key Milestones</p>
                        {d.childDevelopment.milestones.map((m: string) => (
                          <p key={m} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {m}</p>
                        ))}
                      </div>
                    )}
                    {d.childDevelopment.parentingAdvice?.length > 0 && (
                      <div className="bg-[var(--warm-sand)] rounded-xl p-4">
                        <p className="text-xs font-bold text-[var(--saffron)] uppercase tracking-wider mb-2">Parenting Guidance</p>
                        {d.childDevelopment.parentingAdvice.map((a: string) => (
                          <p key={a} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {a}</p>
                        ))}
                      </div>
                    )}
                    {d.childDevelopment.cautionAreas?.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Areas to Watch</p>
                        {d.childDevelopment.cautionAreas.map((c: string) => (
                          <p key={c} className="text-sm text-amber-700 py-0.5">• {c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>
              )}
              {report.report_type === 'mobile_number' && d.mobile && (
                <Section title="Mobile Number Analysis" icon="phone">
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoCard label="Total Number" value={d.mobile.totalNumber} large />
                      <InfoCard label="Life Path" value={d.lifePath} />
                    </div>
                    {d.mobile.compatibility !== undefined && (
                      <div className={`rounded-xl p-4 text-center ${d.mobile.compatibility >= 70 ? 'bg-emerald-50' : d.mobile.compatibility >= 40 ? 'bg-amber-50' : 'bg-red-50'}`}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1">Compatibility Score</p>
                        <p className={`text-4xl font-bold ${d.mobile.compatibility >= 70 ? 'text-emerald-600' : d.mobile.compatibility >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{d.mobile.compatibility}%</p>
                      </div>
                    )}
                    {d.mobile.analysis && <p className="text-sm text-[var(--warm-charcoal)]/70">{d.mobile.analysis}</p>}
                    {d.mobile.suggestion && (
                      <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                        <p className="text-xs font-bold text-[var(--indigo-deep)]/60 uppercase tracking-wider mb-1">Suggestion</p>
                        <p className="text-sm text-[var(--warm-charcoal)]/70">{d.mobile.suggestion}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
