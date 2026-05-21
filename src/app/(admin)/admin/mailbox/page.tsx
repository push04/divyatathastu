'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Thread { id: string; subject: string; status: string; created_at: string; last_message_at: string; profiles: { full_name: string } | null }
interface Message { id: string; thread_id: string; sender_id: string; content: string; created_at: string }

function FilterBar({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  return (
    <div className="flex gap-1">
      {['open', 'closed'].map(f => (
        <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{f}</button>
      ))}
    </div>
  )
}

export default function AdminMailboxPage() {
  const supabase = createClient()
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [active, setActive] = useState<Thread | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('open')
  const [userId, setUserId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])
  useEffect(() => { loadThreads() }, [filter])
  useEffect(() => { if (active) loadMessages(active.id) }, [active])

  async function loadThreads() {
    const { data } = await supabase.from('mail_threads').select('id,subject,status,created_at,last_message_at').eq('status', filter).order('last_message_at', { ascending: false })
    if (data) setThreads(data as unknown as Thread[])
  }

  async function loadMessages(threadId: string) {
    const { data } = await supabase.from('mail_messages').select('*').eq('thread_id', threadId).order('created_at')
    if (data) { setMessages(data); setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }
  }

  async function sendReply() {
    if (!reply.trim() || !active || !userId) return
    setSending(true)
    await supabase.from('mail_messages').insert({ thread_id: active.id, sender_id: userId, content: reply })
    await supabase.from('mail_threads').update({ last_message_at: new Date().toISOString() }).eq('id', active.id)
    setReply('')
    await loadMessages(active.id)
    setSending(false)
    toast.success('Reply sent!')
  }

  async function closeThread(id: string) {
    await supabase.from('mail_threads').update({ status: 'closed' }).eq('id', id)
    setThreads(prev => prev.filter(t => t.id !== id))
    if (active?.id === id) setActive(null)
    toast.success('Thread closed')
  }

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen">
      {/* Sidebar — desktop */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--warm-sand)] bg-white flex-col hidden lg:flex">
        <div className="p-3 border-b border-[var(--warm-sand)]"><FilterBar filter={filter} setFilter={setFilter} /></div>
        <div className="flex-1 overflow-y-auto">
          {threads.map(t => (
            <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left p-3 border-b border-[var(--warm-sand)]/60 hover:bg-[var(--warm-sand)]/30 transition-colors ${active?.id === t.id ? 'bg-[var(--warm-sand)]/40 border-l-2 border-l-[var(--terracotta)]' : ''}`}>
              <p className="text-sm font-semibold text-[var(--indigo-deep)] truncate">{t.subject}</p>
              <p className="text-xs text-[var(--warm-charcoal)]/50">{(t.profiles as any)?.full_name || 'Unknown'}</p>
              <p className="text-xs text-[var(--warm-charcoal)]/30">{new Date(t.last_message_at).toLocaleDateString('en-IN')}</p>
            </button>
          ))}
          {threads.length === 0 && <p className="p-4 text-sm text-[var(--warm-charcoal)]/40 text-center">No {filter} tickets</p>}
        </div>
      </div>

      {/* Mobile thread list */}
      {!active && (
        <div className="lg:hidden flex-1 flex flex-col">
          <div className="p-3 border-b border-[var(--warm-sand)]"><FilterBar filter={filter} setFilter={setFilter} /></div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(t => (
              <button key={t.id} onClick={() => setActive(t)} className="w-full text-left p-3 border-b border-[var(--warm-sand)]/60 hover:bg-[var(--warm-sand)]/30 transition-colors">
                <p className="text-sm font-semibold text-[var(--indigo-deep)] truncate">{t.subject}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">{(t.profiles as any)?.full_name || 'Unknown'}</p>
              </button>
            ))}
            {threads.length === 0 && <p className="p-4 text-sm text-[var(--warm-charcoal)]/40 text-center">No {filter} tickets</p>}
          </div>
        </div>
      )}

      {/* Message pane */}
      <div className={`${active ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-[var(--kutch-white)]`}>
        {active ? (
          <>
            <div className="px-4 lg:px-6 py-3 border-b border-[var(--warm-sand)] bg-white flex items-center justify-between gap-3">
              <button onClick={() => setActive(null)} className="lg:hidden text-[var(--warm-charcoal)]/40 hover:text-[var(--warm-charcoal)]">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--indigo-deep)] truncate">{active.subject}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/40">{(active.profiles as any)?.full_name}</p>
              </div>
              {filter === 'open' && <button onClick={() => closeThread(active.id)} className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">Close Thread</button>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${m.sender_id === userId ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]'}`}>
                    {m.sender_id === userId && <p className="text-xs font-bold text-white/50 mb-1">Support Agent</p>}
                    <p>{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            {filter === 'open' && (
              <div className="p-4 bg-white border-t border-[var(--warm-sand)] flex gap-2">
                <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }} placeholder="Type reply... (Enter to send)" rows={2} className="flex-1 px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm resize-none focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]" />
                <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-divine px-4 py-2 text-sm disabled:opacity-40 self-end">Send</button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <span className="material-symbols-outlined text-[56px] text-[var(--warm-charcoal)]/20 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
              <p className="text-[var(--warm-charcoal)]/40">Select a thread to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
