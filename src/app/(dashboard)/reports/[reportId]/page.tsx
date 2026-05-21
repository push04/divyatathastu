'use client'

import { useEffect, useState } from 'react'
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

const SECTION_ICONS: Record<string, string> = {
  kundli: 'brightness_7', numerology: 'tag', chakra: 'local_florist', prakriti: 'eco',
  yantra: 'palette', mantra: 'temple_hindu', vastu: 'house', psychology: 'self_improvement',
  annual: 'calendar_today', dmit: 'psychology', remedies: 'medication', child: 'child_care', colour: 'palette',
}

function Section({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card-divine overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>}
          <h2 className="font-bold text-[var(--indigo-deep)]">{title}</h2>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/40">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-[var(--warm-sand)]">{children}</div>}
    </div>
  )
}

function KundliSection({ data }: { data: any }) {
  if (!data) return null
  const k = data.kundli || data
  return (
    <Section title="Kundli & Birth Chart" icon="brightness_7">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Ascendant (Lagna)', value: k.ascendant },
          { label: 'Moon Sign (Rashi)', value: k.moonSign },
          { label: 'Sun Sign', value: k.sunSign },
          { label: 'Nakshatra', value: k.nakshatra },
          { label: 'Current Dasha', value: k.currentDasha },
          { label: 'Current Antardasha', value: k.currentAntardasha },
          { label: 'Dasha Lord', value: k.dashaLord },
        ].filter(i => i.value).map(item => (
          <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">{item.label}</p>
            <p className="font-bold text-[var(--indigo-deep)]">{item.value}</p>
          </div>
        ))}
      </div>

      {k.planets?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-[var(--indigo-deep)] mb-3">Planetary Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[var(--warm-charcoal)]/50 text-xs border-b border-[var(--warm-sand)]">
                <th className="text-left py-2">Planet</th><th className="text-left py-2">Sign</th><th className="text-left py-2">House</th><th className="text-left py-2">Nakshatra</th>
              </tr></thead>
              <tbody>{k.planets.map((p: any) => (
                <tr key={p.name} className="border-b border-[var(--warm-sand)]/50">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 text-[var(--warm-charcoal)]/70">{p.sign}</td>
                  <td className="py-2 text-[var(--warm-charcoal)]/70">{p.house}</td>
                  <td className="py-2 text-[var(--warm-charcoal)]/70">{p.nakshatra}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
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
        {[
          { label: 'Life Path', value: n.lifePathNumber },
          { label: 'Destiny', value: n.destinyNumber },
          { label: 'Soul Urge', value: n.soulUrgeNumber },
          { label: 'Personality', value: n.personalityNumber },
          { label: 'Chaldean Name', value: n.chaldeanNameNumber },
          { label: 'Personal Year', value: n.personalYearNumber },
          { label: 'Birthday', value: n.birthdayNumber },
          { label: 'Maturity', value: n.maturityNumber },
        ].map(item => (
          <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-[var(--terracotta)]">{item.value}</p>
          </div>
        ))}
      </div>
      {n.interpretation?.lifePath && (
        <div className="mt-4 p-4 bg-[var(--warm-sand)] rounded-xl">
          <p className="text-sm font-medium text-[var(--indigo-deep)] mb-1">Life Path Interpretation</p>
          <p className="text-sm text-[var(--warm-charcoal)]/70">{n.interpretation.lifePath}</p>
        </div>
      )}
      {n.luckyNumbers?.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {n.luckyNumbers.map((num: number) => (
            <span key={num} className="px-3 py-1 bg-[var(--indigo-deep)] text-white text-sm rounded-full font-bold">{num}</span>
          ))}
          <span className="text-xs text-[var(--warm-charcoal)]/50 self-center">Lucky Numbers</span>
        </div>
      )}
    </Section>
  )
}

function ChakraSection({ data }: { data: any }) {
  const chakras = data.chakra || data
  if (!chakras?.length) return null
  const CHAKRA_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00BFFF', '#0000FF', '#8B00FF']
  return (
    <Section title="Chakra Analysis" icon="local_florist">
      <div className="space-y-3 mt-4">
        {chakras.map((c: any, i: number) => (
          <div key={c.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[var(--indigo-deep)]">{c.name} Chakra</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'balanced' ? 'bg-emerald-100 text-emerald-700' : c.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
            </div>
            <div className="bg-[var(--warm-sand)] rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${c.level}%`, backgroundColor: CHAKRA_COLORS[i] }} />
            </div>
            {c.mantras?.length > 0 && (
              <p className="text-xs text-[var(--warm-charcoal)]/50">Mantra: {c.mantras[0]}</p>
            )}
          </div>
        ))}
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
                <span className="text-sm font-medium text-[var(--indigo-deep)] w-36 flex-shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm text-[var(--warm-charcoal)]/70">{value}</span>
              </div>
            )
          }
          if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
            return (
              <div key={key}>
                <p className="text-sm font-medium text-[var(--indigo-deep)] capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                <div className="flex gap-2 flex-wrap">{value.map(v => <span key={v} className="text-xs bg-[var(--warm-sand)] px-2.5 py-1 rounded-full text-[var(--warm-charcoal)]/70">{v}</span>)}</div>
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin-slow">ॐ</div></div>
  if (!report) return <div className="p-6 text-center"><p>Report not found.</p><Link href="/reports" className="text-[var(--terracotta)] inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports</Link></div>

  const d = report.report_content || {}
  const member = report.family_members as any

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/reports" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Reports</Link>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-2 capitalize">{report.report_type.replace(/_/g, ' ')} Report</h1>
          {member && <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">{member.full_name} · {member.place_of_birth || ''} · {new Date(report.created_at).toLocaleDateString('en-IN')}</p>}
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${report.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {report.status}
        </span>
      </div>

      {report.status !== 'completed' ? (
        <div className="card-divine p-8 text-center">
          <div className="text-5xl animate-spin-slow mb-4">ॐ</div>
          <p className="font-bold text-[var(--indigo-deep)]">Report is being generated...</p>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Please refresh in a few moments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Render sections based on report type */}
          {(report.report_type === 'kundli' || report.report_type === 'full_tathastu') && d.kundli && <KundliSection data={d} />}
          {(report.report_type === 'numerology' || report.report_type === 'full_tathastu') && d.numerology && <NumerologySection data={d} />}
          {(report.report_type === 'chakra' || report.report_type === 'full_tathastu') && d.chakra && <ChakraSection data={d} />}
          {(report.report_type === 'prakriti' || report.report_type === 'full_tathastu') && d.prakriti && (
            <GenericSection title="Prakriti (Ayurveda)" icon="eco" data={{ dominant: d.prakriti.dominant, secondary: d.prakriti.secondary, vata: `${d.prakriti.vata}%`, pitta: `${d.prakriti.pitta}%`, kapha: `${d.prakriti.kapha}%` }} />
          )}
          {(report.report_type === 'yantra_colour' || report.report_type === 'full_tathastu') && d.yantraColour && (
            <Section title="Yantra & Colour Therapy" icon="palette">
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                  <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Personal Yantra</p>
                  <p className="font-bold text-[var(--indigo-deep)]">{d.yantraColour.primaryYantra?.name}</p>
                  <p className="text-xs mt-1 text-[var(--warm-charcoal)]/60">{d.yantraColour.primaryYantra?.mantra}</p>
                </div>
                <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                  <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Power Gemstone</p>
                  <p className="font-bold text-[var(--indigo-deep)]">{d.yantraColour.gemstone?.primary}</p>
                  <p className="text-xs mt-1 text-[var(--warm-charcoal)]/60">Wear on {d.yantraColour.gemstone?.finger}</p>
                </div>
              </div>
              {d.yantraColour.colourTherapy && (
                <div className="mt-3 flex gap-3 flex-wrap">
                  {[d.yantraColour.colourTherapy.power, d.yantraColour.colourTherapy.forHealth, d.yantraColour.colourTherapy.forWealth].filter(Boolean).map((c: string) => (
                    <span key={c} className="text-sm px-3 py-1 rounded-full font-medium border-2 border-[var(--saffron)]">{c}</span>
                  ))}
                </div>
              )}
            </Section>
          )}
          {(report.report_type === 'mantra' || report.report_type === 'full_tathastu') && d.mantra && (
            <Section title="Mantra Guidance" icon="temple_hindu">
              <div className="mt-4 space-y-3">
                {d.mantra.chanting && (
                  <div className="bg-[var(--indigo-deep)] rounded-xl p-4 text-white text-center">
                    <p className="text-xs text-white/50 mb-1">Your Beej Mantra</p>
                    <p className="text-2xl font-bold">{d.mantra.chanting.beejMantra}</p>
                    <p className="text-sm mt-1 text-white/70">Chant {d.mantra.chanting.dailyCount?.join(' or ')} times daily</p>
                    <p className="text-xs mt-1 text-white/50">Best time: {d.mantra.chanting.bestTime}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
          {(report.report_type === 'vastu') && d.vastu && (
            <Section title="Vastu Analysis" icon="house">
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Vastu Score</p>
                    <p className="text-2xl font-bold text-[var(--indigo-deep)]">{d.vastu.score}/100</p>
                  </div>
                  <div className="bg-[var(--warm-sand)] rounded-xl p-3">
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Overall</p>
                    <p className="font-bold text-[var(--indigo-deep)]">{d.vastu.overall}</p>
                  </div>
                </div>
                {d.vastu.positiveAspects?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-emerald-700 mb-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Positive Aspects</p>
                    {d.vastu.positiveAspects.map((a: string) => <p key={a} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {a}</p>)}
                  </div>
                )}
                {d.vastu.defects?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-red-600 mb-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span> Vastu Defects</p>
                    {d.vastu.defects.map((a: string) => <p key={a} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {a}</p>)}
                  </div>
                )}
                {d.vastu.remedies?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-[var(--terracotta)] mb-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>build</span> Remedies</p>
                    {d.vastu.remedies.map((a: string) => <p key={a} className="text-sm text-[var(--warm-charcoal)]/70 py-0.5">• {a}</p>)}
                  </div>
                )}
              </div>
            </Section>
          )}
          {(report.report_type === 'annual_prediction' || report.report_type === 'full_tathastu') && d.annualPrediction && (
            <Section title="Annual Prediction" icon="calendar_today">
              <div className="mt-4 space-y-2">
                {d.annualPrediction.months?.slice(0, 6).map((m: any) => (
                  <div key={m.month} className="flex gap-3 items-start py-2 border-b border-[var(--warm-sand)]">
                    <span className="text-sm font-bold text-[var(--terracotta)] w-20 flex-shrink-0">{m.month}</span>
                    <p className="text-sm text-[var(--warm-charcoal)]/70">{m.prediction}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {(report.report_type === 'psychology' || report.report_type === 'full_tathastu') && d.psychology && (
            <Section title="Vedic Psychology" icon="self_improvement">
              <div className="mt-4 space-y-3">
                {d.psychology.moonSignPersonality && (
                  <div className="bg-[var(--warm-sand)] rounded-xl p-4">
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Core Personality</p>
                    <p className="text-sm text-[var(--indigo-deep)]">{d.psychology.moonSignPersonality}</p>
                  </div>
                )}
                {d.psychology.strengths?.length > 0 && (
                  <div><p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Strengths</p>
                    <div className="flex gap-2 flex-wrap">{d.psychology.strengths.map((s: string) => <span key={s} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{s}</span>)}</div>
                  </div>
                )}
                {d.psychology.challenges?.length > 0 && (
                  <div><p className="text-sm font-bold text-[var(--indigo-deep)] mb-2">Growth Areas</p>
                    <div className="flex gap-2 flex-wrap">{d.psychology.challenges.map((s: string) => <span key={s} className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{s}</span>)}</div>
                  </div>
                )}
              </div>
            </Section>
          )}
          {(report.report_type === 'remedies' || report.report_type === 'full_tathastu') && d.remedies && (
            <Section title="Remedies & Upaya" icon="medication">
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Lucky Gemstone', value: d.remedies.gemstone, icon: 'diamond' },
                  { label: 'Fasting Day', value: d.remedies.fastingDay, icon: 'waving_hand' },
                  { label: 'Deity to Worship', value: d.remedies.deity, icon: 'temple_hindu' },
                  { label: 'Charity (Daan)', value: d.remedies.charity, icon: 'redeem' },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3 flex gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    <div>
                      <p className="text-xs text-[var(--warm-charcoal)]/50">{item.label}</p>
                      <p className="font-medium text-[var(--indigo-deep)] text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}
