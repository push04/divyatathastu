'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Report {
  id: string
  report_type: string
  status: string
  created_at: string
  family_members: { full_name: string } | null
}

const REPORT_META: Record<string, { label: string; icon: string; color: string }> = {
  full_tathastu: { label: 'Full Tathastu', icon: 'auto_awesome', color: 'bg-gradient-to-br from-[var(--terracotta)] to-[var(--plum)]' },
  astrology: { label: 'Kundli', icon: 'brightness_7', color: 'bg-[var(--indigo-deep)]' },
  numerology: { label: 'Numerology', icon: 'tag', color: 'bg-violet-600' },
  shakti_chakra: { label: 'Shakti Chakra', icon: 'spa', color: 'bg-pink-600' },
  prakriti: { label: 'Prakriti', icon: 'eco', color: 'bg-emerald-600' },
  yantra_colour: { label: 'Yantra & Colour', icon: 'palette', color: 'bg-amber-600' },
  mantra_chanting: { label: 'Mantra Chanting', icon: 'self_improvement', color: 'bg-orange-700' },
  mantra_writing: { label: 'Mantra Writing', icon: 'edit', color: 'bg-orange-600' },
  astro_vastu: { label: 'Astro Vastu', icon: 'house', color: 'bg-teal-600' },
  child_development: { label: 'Child Development', icon: 'child_care', color: 'bg-lime-600' },
  dmit: { label: 'DMIT', icon: 'psychology', color: 'bg-purple-700' },
  colour_therapy: { label: 'Colour Therapy', icon: 'colorize', color: 'bg-rose-600' },
  psychology: { label: 'Psychology', icon: 'neurology', color: 'bg-slate-600' },
  mobile_number: { label: 'Mobile Number', icon: 'phone', color: 'bg-cyan-700' },
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Nested select fetches family + its reports in one round trip (eliminates serial waterfall)
      const { data: family } = await supabase
        .from('families')
        .select('id,reports(id,report_type,status,created_at,family_members(full_name))')
        .eq('owner_id', user.id)
        .single()
      if (!family) { setLoading(false); return }
      const sorted = [...((family as any).reports || [])].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setReports(sorted as Report[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Nakshatra Reports</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">{reports.length} reports · 14 types available</p>
        </div>
        <Link href="/reports/generate" className="btn-divine text-sm px-4 py-2 self-start sm:self-auto inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>Generate Report</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'generated', 'processing', 'pending'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}
          >
            {f} {f === 'all' ? `(${reports.length})` : `(${reports.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[var(--warm-sand)] p-16 text-center">
          <span className="material-symbols-outlined text-[56px] text-[var(--outline-variant)] mb-4 block">description</span>
          <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>No Reports Yet</h2>
          <p className="text-[var(--warm-charcoal)]/60 mb-6">Generate your first Nakshatra report to unlock divine insights</p>
          <Link href="/reports/generate" className="btn-divine px-8 py-3">Generate First Report</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const meta = REPORT_META[r.report_type] || { label: r.report_type, icon: 'description', color: 'bg-[var(--indigo-deep)]' }
            return (
              <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-[var(--warm-sand)] hover:border-[var(--saffron)] hover:shadow-sm transition-all">
                <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--indigo-deep)]">{meta.label}</p>
                  <p className="text-sm text-[var(--warm-charcoal)]/60">
                    {(r.family_members as any)?.full_name || 'Self'} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${['generated','reviewed','delivered'].includes(r.status) ? 'bg-emerald-100 text-emerald-700' : r.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                  {r.status}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
