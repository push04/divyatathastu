'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ReportRequest {
  id: string
  user_id: string
  report_type: string
  description: string | null
  status: string
  file_url: string | null
  file_name: string | null
  admin_notes: string | null
  created_at: string
  profiles: { full_name: string; phone: string | null } | null
  family_members: { full_name: string } | null
}

const REPORT_TYPES: Record<string, string> = {
  kundli: 'Kundli / Birth Chart',
  numerology: 'Numerology Reading',
  vastu: 'Vastu Shastra',
  compatibility: 'Kundli Matching',
  career: 'Career & Finance',
  health: 'Health & Wellness',
  custom: 'Custom / Other',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminHandwrittenReportsPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<ReportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [uploading, setUploading] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function load() {
    const { data } = await supabase
      .from('handwritten_report_requests')
      .select('id,user_id,report_type,description,status,file_url,file_name,admin_notes,created_at,profiles(full_name,phone),family_members(full_name)')
      .order('created_at', { ascending: false })
    if (data) {
      setRequests(data as any)
      const notesMap: Record<string, string> = {}
      data.forEach((r: any) => { if (r.admin_notes) notesMap[r.id] = r.admin_notes })
      setNotes(notesMap)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('handwritten_report_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) toast.error('Failed to update status')
    else {
      toast.success('Status updated')
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  async function saveNotes(id: string) {
    const { error } = await supabase
      .from('handwritten_report_requests')
      .update({ admin_notes: notes[id] || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) toast.error('Failed to save notes')
    else toast.success('Notes saved')
  }

  async function uploadReport(requestId: string, userId: string, file: File) {
    setUploading(requestId)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${requestId}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('handwritten-reports')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      toast.error('Upload failed: ' + uploadErr.message)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('handwritten-reports').getPublicUrl(path)

    const { error: updateErr } = await supabase
      .from('handwritten_report_requests')
      .update({
        file_url: publicUrl,
        file_name: file.name,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateErr) toast.error('DB update failed: ' + updateErr.message)
    else {
      toast.success('Report uploaded and status set to Completed!')
      await load()
    }
    setUploading(null)
  }

  function handleFileChange(requestId: string, userId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadReport(requestId, userId, file)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const inputCls = 'w-full px-2 py-1.5 rounded-lg border border-[var(--warm-sand)] text-xs focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
          Handwritten Reports <span className="text-[var(--warm-charcoal)]/40 font-normal">({requests.length})</span>
        </h1>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'pending', 'in_progress', 'completed', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:bg-[var(--warm-sand)]/80'}`}
            >
              {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r.id} className="card-divine p-5 space-y-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-[var(--indigo-deep)]">
                  {REPORT_TYPES[r.report_type] || r.report_type}
                  {r.family_members?.full_name && <span className="text-[var(--warm-charcoal)]/50 font-normal"> · {r.family_members.full_name}</span>}
                </p>
                <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5">
                  {r.profiles?.full_name || 'Unknown'}{r.profiles?.phone ? ` · ${r.profiles.phone}` : ''}
                </p>
                <p className="text-xs text-[var(--warm-charcoal)]/30 mt-0.5">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[r.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                  {r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
            </div>

            {r.description && (
              <div className="rounded-lg p-3 text-sm text-[var(--warm-charcoal)]/70" style={{ background: 'var(--warm-sand)' }}>
                <span className="text-xs font-semibold text-[var(--warm-charcoal)]/40 uppercase tracking-wide block mb-1">User Description</span>
                {r.description}
              </div>
            )}

            {/* Actions row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Status change */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Change Status</label>
                <select
                  value={r.status}
                  onChange={e => updateStatus(r.id, e.target.value)}
                  className={inputCls}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Upload report */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Upload Report</label>
                {uploading === r.id ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--warm-charcoal)]/60">
                    <span className="material-symbols-outlined text-[14px] animate-spin">hourglass_empty</span>
                    Uploading...
                  </div>
                ) : r.file_url ? (
                  <div className="flex items-center gap-2">
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {r.file_name || 'View Report'}
                    </a>
                    <label className="cursor-pointer text-xs text-[var(--terracotta)] hover:underline">
                      Replace
                      <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => handleFileChange(r.id, r.user_id, e)} />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--warm-sand)] text-xs font-medium text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">upload</span>
                    Upload PDF / Image
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => handleFileChange(r.id, r.user_id, e)} />
                  </label>
                )}
              </div>

              {/* Admin notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Internal Notes</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={notes[r.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Add notes..."
                    className={inputCls}
                  />
                  <button onClick={() => saveNotes(r.id)} className="px-2 py-1 rounded-lg bg-[var(--indigo-deep)] text-white text-xs font-medium hover:opacity-90 whitespace-nowrap">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 card-divine">
            <span className="material-symbols-outlined text-[48px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
            <p className="text-[var(--warm-charcoal)]/40 text-sm">No handwritten report requests{filter !== 'all' ? ` with status "${filter}"` : ''} yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
