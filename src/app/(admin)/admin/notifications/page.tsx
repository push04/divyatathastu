'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Notif {
  id: string; title: string; body: string | null; type: string; created_at: string; is_read: boolean; user_id: string | null
}

const TYPES = [
  { value: 'promotional', label: 'Promotional', color: 'bg-violet-100 text-violet-700' },
  { value: 'feature', label: 'New Feature', color: 'bg-blue-100 text-blue-700' },
  { value: 'spiritual', label: 'Spiritual Reminder', color: 'bg-amber-100 text-amber-700' },
  { value: 'transactional', label: 'Transactional', color: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60' },
]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminNotificationsPage() {
  const supabase = createClient()
  const [history, setHistory] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', message: '', type: 'promotional' })
  const [sending, setSending] = useState(false)

  async function load() {
    const { data } = await supabase.from('notifications').select('id,title,body,type,created_at,is_read,user_id')
      .order('created_at', { ascending: false }).limit(50)
    setHistory(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendBroadcast() {
    if (!form.title || !form.message) { toast.error('Title and message required'); return }
    setSending(true)
    const allUsers = await supabase.from('profiles').select('id')
    const userIds: string[] = (allUsers.data || []).map((u: any) => u.id)

    if (userIds.length === 0) {
      const { error } = await supabase.from('notifications').insert({ title: form.title, body: form.message, type: form.type, is_read: false, user_id: null } as any)
      if (error) toast.error('Failed: ' + error.message)
      else toast.success('Broadcast sent (no users yet, queued as broadcast)')
    } else {
      const rows = userIds.map(uid => ({ title: form.title, body: form.message, type: form.type, is_read: false, user_id: uid }))
      const batchSize = 100
      let errors = 0
      for (let i = 0; i < rows.length; i += batchSize) {
        const { error } = await supabase.from('notifications').insert(rows.slice(i, i + batchSize))
        if (error) errors++
      }
      if (errors) toast.error(`Sent with ${errors} batch errors`)
      else toast.success(`Sent to ${userIds.length} users!`)
    }

    setForm({ title: '', message: '', type: 'promotional' })
    await load()
    setSending(false)
  }

  async function deleteNotif(id: string) {
    if (!confirm('Delete this notification?')) return
    await supabase.from('notifications').delete().eq('id', id)
    setHistory(h => h.filter(n => n.id !== id))
    toast.success('Deleted')
  }

  const broadcastCount = history.filter(n => n.user_id === null).length

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          Broadcast Notifications
        </h1>
        <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">Send in-app notifications to all users</p>
      </div>

      <div className="card-divine p-5 space-y-4">
        <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>Compose
        </h2>
        <div>
          <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Title * ({form.title.length}/60)</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={60} placeholder="e.g. Diwali Special Offer" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Message * ({form.message.length}/200)</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} maxLength={200} rows={3} placeholder="Write your notification..." className={`${inputCls} resize-none`} />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {form.title && (
          <div className="border border-[var(--warm-sand)] rounded-xl p-4 bg-[var(--warm-sand)]/20">
            <p className="text-xs text-[var(--warm-charcoal)]/50 mb-2 uppercase tracking-wide font-semibold">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full icon-divine flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span></div>
              <div>
                <p className="text-[var(--indigo-deep)] text-sm font-semibold">{form.title}</p>
                <p className="text-[var(--warm-charcoal)]/60 text-xs mt-0.5">{form.message}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={sendBroadcast} disabled={sending || !form.title || !form.message}
          className="btn-divine w-full py-3 font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{sending ? 'wifi_tethering' : 'campaign'}</span>
          {sending ? 'Sending...' : 'Send to All Users'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--indigo-deep)]">Notification History <span className="text-[var(--warm-charcoal)]/40 font-normal text-sm">({history.length})</span></h2>
          {loading && <div className="text-xs text-[var(--warm-charcoal)]/40">Loading...</div>}
        </div>
        {history.map(n => {
          const typeInfo = TYPES.find(t => t.value === n.type)
          return (
            <div key={n.id} className="card-divine p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo?.color || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{typeInfo?.label || n.type}</span>
                    {n.user_id === null && <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">Broadcast</span>}
                    <span className="text-xs text-[var(--warm-charcoal)]/40">{new Date(n.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[var(--indigo-deep)] font-semibold text-sm">{n.title}</p>
                  {n.body && <p className="text-[var(--warm-charcoal)]/60 text-xs mt-0.5 line-clamp-2">{n.body}</p>}
                </div>
                <button onClick={() => deleteNotif(n.id)} className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          )
        })}
        {history.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_none</span>
            <p className="text-[var(--warm-charcoal)]/40 text-sm">No notifications sent yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
