'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface FamilyMember {
  id: string
  full_name: string
}

interface Request {
  id: string
  report_type: string
  description: string | null
  status: string
  file_url: string | null
  file_name: string | null
  created_at: string
  family_members: { full_name: string } | null
}

const REPORT_TYPES = [
  { value: 'kundli', label: 'Kundli / Birth Chart' },
  { value: 'numerology', label: 'Numerology Reading' },
  { value: 'vastu', label: 'Vastu Shastra' },
  { value: 'compatibility', label: 'Kundli Matching / Compatibility' },
  { value: 'career', label: 'Career & Finance' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'custom', label: 'Custom / Other' },
]

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Review',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

export default function HandwrittenReportPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<Request[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    family_member_id: '',
    report_type: 'kundli',
    description: '',
  })

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [reqRes, memRes] = await Promise.all([
      supabase
        .from('handwritten_report_requests')
        .select('id,report_type,description,status,file_url,file_name,created_at,family_members(full_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('family_members')
        .select('id,full_name')
        .eq('profile_id', user.id),
    ])

    if (reqRes.data) setRequests(reqRes.data as any)
    if (memRes.data) setMembers(memRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setSubmitting(false); return }

    const { error } = await supabase.from('handwritten_report_requests').insert({
      user_id: user.id,
      family_member_id: form.family_member_id || null,
      report_type: form.report_type,
      description: form.description || null,
    })

    if (error) {
      toast.error('Failed to submit: ' + error.message)
    } else {
      toast.success('Request submitted! Our astrologers will prepare your handwritten report.')
      setForm({ family_member_id: '', report_type: 'kundli', description: '' })
      await load()
    }
    setSubmitting(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <SudarshanLoader size="sm" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'var(--indigo-deep)' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Handwritten Report</h1>
        </div>
        <p className="text-sm text-[var(--warm-charcoal)]/50 ml-12">
          Our expert astrologers will prepare a personalised handwritten analysis for you or your family members.
        </p>
      </div>

      {/* Request form */}
      <div className="card-divine p-5 space-y-4">
        <h2 className="text-lg font-bold text-[var(--indigo-deep)] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          <span className="material-symbols-outlined text-[16px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Request a New Report
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">For Whom</label>
            <select
              value={form.family_member_id}
              onChange={e => setForm(f => ({ ...f, family_member_id: e.target.value }))}
              className={inputCls}
            >
              <option value="">Myself</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Report Type *</label>
            <select
              value={form.report_type}
              onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
              className={inputCls}
              required
            >
              {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Additional Details</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className={`${inputCls} resize-none`}
              placeholder="Describe your specific questions or areas of concern - e.g., marriage timing, career change, health concerns..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-divine w-full py-3 text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {submitting ? 'hourglass_empty' : 'send'}
            </span>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <div className="rounded-xl p-3 text-xs text-[var(--warm-charcoal)]/50 flex items-start gap-2" style={{ background: 'var(--warm-sand)' }}>
          <span className="material-symbols-outlined text-[14px] text-[var(--saffron)] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <span>Our astrologers typically prepare handwritten reports within 3–5 business days. You'll be notified here and by email once it's ready.</span>
        </div>
      </div>

      {/* Previous requests */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Your Requests</h2>
          {requests.map(r => (
            <div key={r.id} className="card-divine p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--warm-sand)' }}>
                <span className="material-symbols-outlined text-[18px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-medium text-[var(--indigo-deep)] text-sm">
                    {REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}
                    {r.family_members?.full_name && <span className="text-[var(--warm-charcoal)]/50 font-normal"> · {r.family_members.full_name}</span>}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                </div>
                {r.description && <p className="text-xs text-[var(--warm-charcoal)]/50 mt-1 line-clamp-2">{r.description}</p>}
                <p className="text-xs text-[var(--warm-charcoal)]/30 mt-1">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {r.file_url && (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--terracotta)] hover:underline"
                  >
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                    Download Report {r.file_name ? `(${r.file_name})` : ''}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
