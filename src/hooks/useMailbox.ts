'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  content: string
  is_read?: boolean
  created_at: string
}

export interface Thread {
  id: string
  subject: string
  status: string
  created_at: string
  messages?: Message[]
}

export function useMailbox() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('mail_threads')
        .select('*, mail_messages(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setThreads((data as any) || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function sendMessage(threadId: string, content: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase.from('mail_messages').insert({ thread_id: threadId, content, sender_id: user.id }).select().single()
    if (error) throw error
    setThreads(ts => ts.map(t => t.id === threadId ? { ...t, messages: [...(t.messages || []), data as any] } : t))
    return data
  }

  async function createThread(subject: string, content: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: thread } = await supabase.from('mail_threads').insert({ subject, user_id: user.id, status: 'open' }).select().single()
    if (!thread) throw new Error('Failed to create thread')
    await supabase.from('mail_messages').insert({ thread_id: (thread as any).id, content, sender_id: user.id })
    await load()
    return thread
  }

  return { threads, loading, reload: load, sendMessage, createThread }
}
