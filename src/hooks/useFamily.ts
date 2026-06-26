'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface FamilyMember {
  id: string
  full_name: string
  relation: string
  date_of_birth: string
  time_of_birth?: string
  place_of_birth?: string
  birth_latitude?: number
  birth_longitude?: number
  gender?: string
}

export function useFamily() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: families } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
      if (!families) { setLoading(false); return }
      const { data, error: err } = await supabase.from('family_members').select('*').eq('family_id', families.id).order('created_at')
      if (err) throw err
      setMembers((data as any) || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function addMember(member: Omit<FamilyMember, 'id'> & { family_id: string }) {
    const supabase = createClient()
    const { data, error } = await supabase.from('family_members').insert(member as any).select().single()
    if (error) throw error
    setMembers(m => [...m, data as any])
    return data
  }

  async function deleteMember(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthenticated')
    const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
    if (!family) throw new Error('No family found')
    await supabase.from('family_members').delete().eq('id', id).eq('family_id', (family as any).id)
    setMembers(m => m.filter(x => x.id !== id))
  }

  return { members, loading, error, reload: load, addMember, deleteMember }
}
