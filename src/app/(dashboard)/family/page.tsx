'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface FamilyMember {
  id: string
  full_name: string
  relation: string
  date_of_birth: string
  time_of_birth: string | null
  place_of_birth: string | null
  gender: string | null
  reports_count?: number
}

const RELATION_ICONS: Record<string, string> = {
  self: 'person', wife: 'person', husband: 'person', son: 'child_care', daughter: 'child_care',
  father: 'person', mother: 'person', brother: 'person', sister: 'person',
  grandfather: 'person', grandmother: 'person', other: 'person',
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [familyName, setFamilyName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: family } = await supabase.from('families').select('id,family_name').eq('owner_id', user.id).single()
      if (!family) { setLoading(false); return }

      setFamilyName(family.family_name)

      const { data: mems } = await supabase
        .from('family_members')
        .select('id,full_name,relation,date_of_birth,time_of_birth,place_of_birth,gender')
        .eq('family_id', family.id)
        .order('created_at')

      if (mems && mems.length) {
        const { data: reportRows } = await supabase
          .from('reports')
          .select('family_member_id')
          .in('family_member_id', mems.map(m => m.id))
        const counts: Record<string, number> = {}
        reportRows?.forEach((r: any) => { counts[r.family_member_id] = (counts[r.family_member_id] || 0) + 1 })
        setMembers(mems.map(m => ({ ...m, reports_count: counts[m.id] || 0 })))
      } else {
        setMembers([])
      }
      setLoading(false)
    }
    load()
  }, [])

  function getAge(dob: string) {
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <SudarshanLoader size="sm" />
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">Family Management</h1>
          {familyName && <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">{familyName} · {members.length} members</p>}
        </div>
        <Link href="/family/add" className="btn-divine text-sm px-4 py-2 inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">person_add</span>Add Member</Link>
      </div>

      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[var(--warm-sand)] p-16 text-center">
          <div className="flex justify-center mb-4"><span className="material-symbols-outlined text-[48px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>family_restroom</span></div>
          <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-2">Start Your Family Tree</h2>
          <p className="text-[var(--warm-charcoal)]/60 mb-6 max-w-sm mx-auto">Add family members to generate personalized spiritual reports for each of them</p>
          <Link href="/family/add" className="btn-divine px-8 py-3">Add First Member</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Link key={m.id} href={`/family/${m.id}`} className="card-divine p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{RELATION_ICONS[m.relation.toLowerCase()] || 'person'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--indigo-deep)] truncate">{m.full_name}</h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/60 capitalize">{m.relation}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-[var(--warm-charcoal)]/70">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>cake</span>
                  <span>{new Date(m.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({getAge(m.date_of_birth)} yrs)</span>
                </div>
                {m.place_of_birth && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span><span>{m.place_of_birth}</span></div>}
                {m.time_of_birth && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span><span>{m.time_of_birth}</span></div>}
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--warm-sand)] flex items-center justify-between">
                <span className="text-xs text-[var(--warm-charcoal)]/50">{m.reports_count} report{m.reports_count !== 1 ? 's' : ''}</span>
                <span className="text-xs text-[var(--terracotta)] font-medium group-hover:underline inline-flex items-center gap-0.5">View Profile <span className="material-symbols-outlined text-[14px]">arrow_forward</span></span>
              </div>
            </Link>
          ))}

          {/* Add card */}
          <Link href="/family/add" className="border-2 border-dashed border-[var(--warm-sand)] hover:border-[var(--terracotta)] rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all group min-h-[180px]">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--warm-sand)] group-hover:border-[var(--terracotta)] flex items-center justify-center text-[var(--warm-charcoal)]/40 group-hover:text-[var(--terracotta)] transition-all"><span className="material-symbols-outlined text-[22px]">add</span></div>
            <div>
              <p className="font-medium text-[var(--warm-charcoal)]/60 group-hover:text-[var(--terracotta)] transition-all">Add Member</p>
              <p className="text-xs text-[var(--warm-charcoal)]/40 mt-0.5">Generate reports for them</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
