'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'

export function useUser() {
  const { user, profile, loading, setUser, setProfile, setLoading, clear } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { clear(); return }
      setUser(user)
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data as any)
      } catch {}
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) { clear(); return }
      setUser(session.user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading }
}
