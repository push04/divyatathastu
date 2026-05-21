'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Member {
  id: string
  full_name: string
  relation: string
  gender: string | null
  date_of_birth: string
  time_of_birth: string | null
  place_of_birth: string | null
  birth_timezone: string | null
}

interface Report {
  id: string
  report_type: string
  status: string
  created_at: string
}

const reportTypeLabels: Record<string, string> = {
  full_tathastu: 'Full Tathastu', kundli: 'Kundli', numerology: 'Numerology',
  chakra: 'Chakra Analysis', prakriti: 'Prakriti', yantra_colour: 'Yantra & Colour',
  mantra: 'Mantra Science', annual_prediction: 'Annual Prediction', vastu: 'Vastu',
  child_development: 'Child Development', dmit: 'DMIT', colour_therapy: 'Colour Therapy',
  psychology: 'Psychology', remedies: 'Remedies',
}

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [member, setMember] = useState<Member | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const [memberRes, reportsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('id', memberId).single(),
        supabase.from('reports').select('id,report_type,status,created_at').eq('family_member_id', memberId).order('created_at', { ascending: false }),
      ])
      if (memberRes.data) setMember(memberRes.data)
      if (reportsRes.data) setReports(reportsRes.data)
      setLoading(false)
    }
    load()
  }, [memberId])

  async function handleDelete() {
    if (!confirm(`Delete ${member?.full_name} and all their reports? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('family_members').delete().eq('id', memberId)
    toast.success('Member removed')
    router.push('/family')
  }

  function getAge(date_of_birth: string) {
    return Math.floor((Date.now() - new Date(date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow">ॐ</div></div>
  if (!member) return <div className="p-6 text-center"><p>Member not found.</p><Link href="/family" className="text-[var(--terracotta)] inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back</Link></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/family" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Family</Link>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-2">{member.full_name}</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 capitalize">{member.relation} · {member.gender}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/reports/generate?member=${memberId}`} className="btn-divine text-sm px-4 py-2">Generate Report</Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card-divine p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {member.full_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--indigo-deep)]">{member.full_name}</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60">{getAge(member.date_of_birth)} years old · Born {new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Date of Birth', value: new Date(member.date_of_birth).toLocaleDateString('en-IN'), icon: 'cake' },
            { label: 'Birth Time', value: member.time_of_birth || 'Not provided', icon: 'schedule' },
            { label: 'Place of Birth', value: member.place_of_birth || 'Not provided', icon: 'location_on' },
            { label: 'Timezone', value: member.birth_timezone || 'Asia/Kolkata', icon: 'schedule' },
          ].map(item => (
            <div key={item.label} className="bg-[var(--warm-sand)] rounded-xl p-3">
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span> {item.label}</p>
              <p className="font-medium text-[var(--indigo-deep)] truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reports */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">Reports ({reports.length})</h2>
          <Link href={`/reports/generate?member=${memberId}`} className="text-sm text-[var(--terracotta)] font-medium hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">add</span>New Report</Link>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[var(--warm-sand)] p-10 text-center">
            <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[40px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span></div>
            <p className="text-[var(--warm-charcoal)]/60 mb-4">No reports generated yet for {member.full_name}</p>
            <Link href={`/reports/generate?member=${memberId}`} className="btn-divine px-6 py-2.5 text-sm">Generate Report</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map(r => (
              <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-[var(--warm-sand)] hover:border-[var(--saffron)] transition-all">
                <div className="w-10 h-10 rounded-lg bg-[var(--warm-sand)] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{r.report_type === 'kundli' ? 'brightness_7' : r.report_type === 'full_tathastu' ? 'auto_awesome' : 'description'}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[var(--indigo-deep)]">{reportTypeLabels[r.report_type] || r.report_type}</p>
                  <p className="text-xs text-[var(--warm-charcoal)]/50">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h3>
        <p className="text-xs text-red-600/70 mb-3">Removing this member will delete all their reports permanently.</p>
        <button onClick={handleDelete} disabled={deleting} className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50">
          {deleting ? 'Removing...' : 'Remove Member'}
        </button>
      </div>
    </div>
  )
}
