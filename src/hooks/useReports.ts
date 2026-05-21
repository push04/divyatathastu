'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Report {
  id: string
  report_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  content?: any
  family_member_name?: string
  family_member_id?: string
}

export function useReports(limit = 20) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
      if (!family) { setLoading(false); return }
      const { data } = await supabase.from('reports').select('*').eq('family_id', family.id).order('created_at', { ascending: false }).limit(limit)
      setReports((data as any) || [])
    } catch {}
    setLoading(false)
  }, [limit])

  useEffect(() => { load() }, [load])

  return { reports, loading, reload: load }
}
