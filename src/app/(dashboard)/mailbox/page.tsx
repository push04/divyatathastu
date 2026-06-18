'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Thread {
  id: string
  subject: string
  status: string
  created_at: string
  last_message_at: string
}

interface Message {
  id: string
  thread_id: string | null
  sender_id: string | null
  content: string
  created_at: string
}

export default function MailboxPage() {
  const supabase = createClient()
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [composing, setComposing] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await loadThreads(user.id)

      // Realtime subscription
      const sub = supabase.channel('mailbox')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mail_messages' }, payload => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        .subscribe()

      return () => { supabase.removeChannel(sub) }
    }
    load()
  }, [])

  useEffect(() => {
    if (activeThread) loadMessages(activeThread.id)
  }, [activeThread])

  async function loadThreads(uid: string) {
    const { data } = await supabase.from('mail_threads').select('*').eq('user_id', uid).order('last_message_at', { ascending: false })
    if (data) setThreads(data)
  }

  async function loadMessages(threadId: string) {
    const { data } = await supabase.from('mail_messages').select('*').eq('thread_id', threadId).order('created_at')
    if (data) {
      setMessages(data)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    // Mark as read - update last_message_at to keep thread active
    await supabase.from('mail_messages').update({ is_read: true }).eq('thread_id', threadId)
  }

  async function sendNewThread() {
    if (!newSubject.trim() || !newMessage.trim()) { toast.error('Enter subject and message'); return }
    setSending(true)
    const { data: thread } = await supabase.from('mail_threads').insert({
      user_id: userId,
      subject: newSubject,
      status: 'open',
    }).select().single()

    if (thread) {
      await supabase.from('mail_messages').insert({ thread_id: thread.id, sender_id: userId, content: newMessage })
      setThreads(prev => [thread, ...prev])
      setActiveThread(thread)
      setComposing(false)
      setNewSubject('')
      setNewMessage('')
      toast.success('Message sent!')
    }
    setSending(false)
  }

  async function sendReply() {
    if (!reply.trim() || !activeThread) return
    setSending(true)
    await supabase.from('mail_messages').insert({ thread_id: activeThread.id, sender_id: userId, content: reply })
    await supabase.from('mail_threads').update({ last_message_at: new Date().toISOString() }).eq('id', activeThread.id)
    setReply('')
    setSending(false)
  }

  const showList = !activeThread && !composing

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen">
      {/* Sidebar */}
      <div className={`${showList ? 'flex' : 'hidden'} lg:flex w-full lg:w-72 flex-shrink-0 border-r border-[var(--warm-sand)] bg-white flex-col`}>
        <div className="p-4 border-b border-[var(--warm-sand)]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
              Mailbox
            </h1>
            <button onClick={() => { setComposing(true); setActiveThread(null) }} className="btn-divine text-xs px-3 py-1.5 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">edit</span>New</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--warm-charcoal)]/50">No messages yet</div>
          ) : (
            threads.map(t => (
              <button
                key={t.id}
                onClick={() => { setActiveThread(t); setComposing(false) }}
                className={`w-full text-left p-3 border-b border-[var(--warm-sand)] hover:bg-[var(--warm-sand)] transition-all ${activeThread?.id === t.id ? 'bg-[var(--warm-sand)]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--indigo-deep)] truncate">{t.subject}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${t.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>{t.status}</span>
                  <span className="text-xs text-[var(--warm-charcoal)]/40">{new Date(t.last_message_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main */}
      <div className={`${!showList ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
        {/* Mobile back button */}
        {(activeThread || composing) && (
          <button
            onClick={() => { setActiveThread(null); setComposing(false) }}
            className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-[var(--warm-sand)] bg-white text-sm text-[var(--terracotta)] font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Mailbox
          </button>
        )}
        {composing ? (
          <div className="flex-1 p-6">
            <h2 className="text-lg font-bold text-[var(--indigo-deep)] mb-4">New Message</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Subject</label>
                <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="How can we help you?" className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Message</label>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Describe your question or concern..." rows={8} className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={sendNewThread} disabled={sending} className="btn-divine px-6 py-2.5 text-sm disabled:opacity-50">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
                <button onClick={() => setComposing(false)} className="px-6 py-2.5 text-sm rounded-lg border border-[var(--warm-sand)] hover:bg-[var(--warm-sand)] transition-all">Cancel</button>
              </div>
            </div>
          </div>
        ) : activeThread ? (
          <>
            <div className="px-6 py-4 border-b border-[var(--warm-sand)] bg-white">
              <h2 className="font-bold text-[var(--indigo-deep)]">{activeThread.subject}</h2>
              <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${activeThread.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>{activeThread.status}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--kutch-white)]">
              {messages.map(m => {
                const isOwn = m.sender_id === userId
                return (
                  <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${isOwn ? 'bg-[var(--indigo-deep)] text-white rounded-tr-sm' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)] rounded-tl-sm'}`}>
                      {!isOwn && <p className="text-xs font-bold mb-1 text-[var(--terracotta)]">MahaTathastu Support</p>}
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/50' : 'text-[var(--warm-charcoal)]/40'}`}>{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-6 py-4 bg-white border-t border-[var(--warm-sand)] flex gap-3">
              <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }} placeholder="Type your reply... (Enter to send)" rows={2} className="flex-1 px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] resize-none" />
              <button onClick={sendReply} disabled={sending || !reply.trim()} className="px-4 py-2 bg-[var(--indigo-deep)] text-white rounded-lg text-sm font-medium hover:bg-[var(--indigo-deep)]/90 disabled:opacity-40 self-end">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <span className="material-symbols-outlined text-[56px] text-[var(--outline-variant)] mb-4 block">mail</span>
              <p className="font-bold text-[var(--indigo-deep)] text-xl mb-2">Your Mailbox</p>
              <p className="text-[var(--warm-charcoal)]/60 mb-6">Select a conversation or start a new one</p>
              <button onClick={() => setComposing(true)} className="btn-divine px-6 py-2.5 inline-flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">edit</span>New Message</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
