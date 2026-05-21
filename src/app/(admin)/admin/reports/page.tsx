'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEMO_REPORTS: any[] = [
  { id: 'r1', report_type: 'Full Tathastu', status: 'completed', created_at: '2025-10-01T08:30:00', family_member_name: 'Rahul Sharma', profiles: { email: 'rahul@example.com' } },
  { id: 'r2', report_type: 'Kundli', status: 'processing', created_at: '2025-10-01T10:15:00', family_member_name: 'Priya Singh', profiles: { email: 'priya@example.com' } },
  { id: 'r3', report_type: 'Numerology', status: 'completed', created_at: '2025-09-30T14:00:00', family_member_name: 'Amit Kumar', profiles: { email: 'amit@example.com' } },
  { id: 'r4', report_type: 'Vastu', status: 'pending', created_at: '2025-09-30T16:45:00', family_member_name: 'Sunita Gupta', profiles: { email: 'sunita@example.com' } },
  { id: 'r5', report_type: 'Chakra', status: 'completed', created_at: '2025-09-29T09:00:00', family_member_name: 'Vikram Patel', profiles: { email: 'vikram@example.com' } },
  { id: 'r6', report_type: 'Full Tathastu', status: 'failed', created_at: '2025-09-29T11:30:00', family_member_name: 'Meena Joshi', profiles: { email: 'meena@example.com' } },
]

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-violet-100 text-violet-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-600',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState(DEMO_REPORTS)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('reports').select('*, profiles(email)').order('created_at', { ascending: false }).limit(50)
        if (data?.length) setReports(data as any)
      } catch {}
    }
    load()
  }, [])

  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search && !r.family_member_name?.toLowerCase().includes(search.toLowerCase()) && !r.profiles?.email?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = { all: reports.length, completed: reports.filter(r => r.status === 'completed').length, processing: reports.filter(r => r.status === 'processing').length, pending: reports.filter(r => r.status === 'pending').length, failed: reports.filter(r => r.status === 'failed').length }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          Reports <span className="text-[var(--warm-charcoal)]/40 font-normal">({reports.length})</span>
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'completed', 'processing', 'pending', 'failed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]" />
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">User Email</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Report Type</th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--indigo-deep)]">{r.family_member_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]/50 text-xs">{r.profiles?.email || '—'}</td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]">{r.report_type}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[r.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--warm-charcoal)]/40 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-[var(--saffron)] hover:underline font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              <p className="text-[var(--warm-charcoal)]/40 text-sm">No reports found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
