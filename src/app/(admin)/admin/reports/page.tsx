'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Report {
  id: string; report_type: string; status: string; created_at: string
  family_members: { full_name: string } | null
}

const STATUSES = ['pending', 'processing', 'generated', 'reviewed', 'delivered']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-violet-100 text-violet-700',
  generated: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-teal-100 text-teal-700',
  delivered: 'bg-emerald-100 text-emerald-700',
}

export default function AdminReportsPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('reports')
      .select('id,report_type,status,created_at,family_members(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) toast.error('Load failed: ' + error.message)
    else setReports((data || []) as unknown as Report[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('reports').update({ status: status as any }).eq('id', id)
    if (error) toast.error('Update failed')
    else { setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r)); toast.success('Status updated') }
  }

  async function deleteReport(id: string) {
    if (!confirm('Delete this report?')) return
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setReports(prev => prev.filter(r => r.id !== id)); toast.success('Deleted') }
  }

  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search && !r.family_members?.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !r.report_type.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        Reports <span className="text-[var(--warm-charcoal)]/40 font-normal">({reports.length})</span>
      </h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', ...STATUSES] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>
              {s} ({s === 'all' ? reports.length : reports.filter(r => r.status === s).length})
            </button>
          ))}
        </div>
        <div className="relative sm:w-64 ml-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or type..."
            className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]" />
        </div>
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                {['Member', 'Report Type', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--indigo-deep)]">{r.family_members?.full_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)] capitalize">{r.report_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 outline-none cursor-pointer ${STATUS_COLORS[r.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]/40 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteReport(r.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
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
