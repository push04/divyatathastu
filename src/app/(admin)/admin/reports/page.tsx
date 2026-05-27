'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Report {
  id: string
  report_type: string
  status: string
  created_at: string
  admin_notes: string | null
  report_content: any
  raw_data: any
  family_member_id: string
  family_members: { full_name: string; date_of_birth: string } | null
  family_id: string
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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('reports')
      .select('id,report_type,status,created_at,admin_notes,report_content,raw_data,family_id,family_member_id,family_members(full_name,date_of_birth)')
      .order('created_at', { ascending: false })
      .limit(200)
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

  async function saveNotes(id: string) {
    setSavingNotes(true)
    const { error } = await supabase.from('reports').update({ admin_notes: adminNotes || null }).eq('id', id)
    if (error) toast.error('Failed to save notes')
    else {
      toast.success('Notes saved')
      setReports(prev => prev.map(r => r.id === id ? { ...r, admin_notes: adminNotes || null } : r))
      if (selectedReport?.id === id) setSelectedReport(r => r ? { ...r, admin_notes: adminNotes || null } : r)
    }
    setSavingNotes(false)
  }

  async function regenerateReport(report: Report) {
    if (!report.family_member_id) { toast.error('Family member info missing'); return }
    setRegenerating(true)
    try {
      const res = await fetch('/api/noxatra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_member_id: report.family_member_id,
          report_types: [report.report_type],
        }),
      })
      if (!res.ok) throw new Error('Regeneration failed')
      toast.success('Report regenerated successfully')
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Regeneration failed')
    }
    setRegenerating(false)
  }

  async function deleteReport(id: string) {
    if (!confirm('Delete this report?')) return
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else {
      setReports(prev => prev.filter(r => r.id !== id))
      if (selectedReport?.id === id) setSelectedReport(null)
      toast.success('Deleted')
    }
  }

  function openReport(r: Report) {
    setSelectedReport(r)
    setAdminNotes(r.admin_notes || '')
  }

  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search && !r.family_members?.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !r.report_type.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const content = selectedReport?.report_content || selectedReport?.raw_data

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

      <div className="flex gap-5">
        {/* Table */}
        <div className="card-divine overflow-hidden flex-1 min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
                <tr>
                  {['Member', 'Report Type', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--warm-sand)]/60">
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className={`hover:bg-[var(--warm-sand)]/20 transition-colors cursor-pointer ${selectedReport?.id === r.id ? 'bg-amber-50/60' : ''}`}
                    onClick={() => openReport(r)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--indigo-deep)]">{r.family_members?.full_name || 'N/A'}</p>
                      {r.family_members?.date_of_birth && (
                        <p className="text-xs text-[var(--warm-charcoal)]/40">{new Date(r.family_members.date_of_birth).toLocaleDateString('en-IN')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--warm-charcoal)] capitalize text-xs">{r.report_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 outline-none cursor-pointer ${STATUS_COLORS[r.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[var(--warm-charcoal)]/40 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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

        {/* Detail Panel */}
        {selectedReport && (
          <div className="w-80 flex-shrink-0">
            <div className="card-divine p-4 space-y-4 sticky top-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--indigo-deep)] text-sm capitalize">
                  {selectedReport.report_type.replace(/_/g, ' ')}
                </h3>
                <button onClick={() => setSelectedReport(null)} className="text-[var(--warm-charcoal)]/40 hover:text-[var(--warm-charcoal)]">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--warm-charcoal)]/50">Member</span>
                  <span className="font-medium text-[var(--indigo-deep)]">{selectedReport.family_members?.full_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--warm-charcoal)]/50">Status</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedReport.status] || ''}`}>{selectedReport.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--warm-charcoal)]/50">Generated</span>
                  <span>{new Date(selectedReport.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-wide mb-1">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add review notes..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-xs focus:outline-none focus:border-[var(--saffron)] resize-none bg-white"
                />
                <button
                  onClick={() => saveNotes(selectedReport.id)}
                  disabled={savingNotes}
                  className="mt-1.5 btn-divine px-3 py-1 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[12px]">save</span>
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selectedReport.id, 'reviewed')}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors font-medium"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => updateStatus(selectedReport.id, 'delivered')}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                >
                  Mark Delivered
                </button>
              </div>

              {/* Report Content Preview */}
              {content && (
                <div>
                  <p className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-wide mb-1">Report Data</p>
                  <pre className="text-xs bg-[var(--warm-sand)]/40 p-2 rounded-lg overflow-x-auto overflow-y-auto max-h-40 text-[var(--warm-charcoal)]/70 whitespace-pre-wrap break-words">
                    {JSON.stringify(content, null, 2).slice(0, 2000)}{JSON.stringify(content).length > 2000 ? '\n...[truncated]' : ''}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
