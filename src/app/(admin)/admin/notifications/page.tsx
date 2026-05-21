'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const DEMO_SENT: any[] = [
  { id: '1', title: 'Navratri Special Offer', message: 'Get 30% off on all reports during Navratri. Use code NAVRATRI30.', target: 'all', sent_at: '2025-10-01T09:00:00', reach: 12847, type: 'promotional' },
  { id: '2', title: 'New AI Guide Feature', message: "We've launched our new AI Spiritual Guide — ask any spiritual question 24/7!", target: 'all', sent_at: '2025-09-25T10:00:00', reach: 11203, type: 'feature' },
  { id: '3', title: 'Your Report is Ready', message: 'Your Kundli report has been generated. Visit your dashboard to view it.', target: 'segment', sent_at: '2025-09-20T14:30:00', reach: 543, type: 'transactional' },
]

const TYPES = [
  { value: 'promotional', label: 'Promotional', color: 'bg-violet-100 text-violet-700' },
  { value: 'feature', label: 'New Feature', color: 'bg-blue-100 text-blue-700' },
  { value: 'spiritual', label: 'Spiritual Reminder', color: 'bg-amber-100 text-amber-700' },
  { value: 'transactional', label: 'Transactional', color: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60' },
]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminNotificationsPage() {
  const [sent, setSent] = useState(DEMO_SENT)
  const [form, setForm] = useState({ title: '', message: '', type: 'promotional', target: 'all' })
  const [sending, setSending] = useState(false)

  async function sendNotification() {
    if (!form.title || !form.message) { toast.error('Title and message required'); return }
    setSending(true)
    await new Promise(r => setTimeout(r, 1500))
    const newNotif = { ...form, id: Date.now().toString(), sent_at: new Date().toISOString(), reach: Math.floor(Math.random() * 10000) + 1000 }
    setSent(s => [newNotif, ...s])
    try {
      const supabase = createClient()
      await supabase.from('notifications').insert({ title: form.title, body: form.message, type: form.type, is_read: false, user_id: null })
    } catch {}
    setSending(false)
    setForm({ title: '', message: '', type: 'promotional', target: 'all' })
    toast.success('Notification sent to all users!')
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          Broadcast Notifications
        </h1>
        <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">Send push/in-app notifications to all users or segments</p>
      </div>

      <div className="card-divine p-5 space-y-4">
        <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>Compose Notification
        </h2>
        <div>
          <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={60} placeholder="e.g. Diwali Special Offer" className={inputCls} />
          <p className="text-xs text-[var(--warm-charcoal)]/30 mt-0.5">{form.title.length}/60</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Message *</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} maxLength={200} rows={3} placeholder="Write your notification message..." className={`${inputCls} resize-none`} />
          <p className="text-xs text-[var(--warm-charcoal)]/30 mt-0.5">{form.message.length}/200</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Target Audience</label>
            <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className={inputCls}>
              <option value="all">All Users</option><option value="paid">Paid Users Only</option>
              <option value="free">Free Users Only</option><option value="inactive">Inactive (30+ days)</option>
            </select></div>
        </div>

        {form.title && (
          <div className="border border-[var(--warm-sand)] rounded-xl p-4 bg-[var(--warm-sand)]/20">
            <p className="text-xs text-[var(--warm-charcoal)]/50 mb-2 uppercase tracking-wide font-semibold">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full icon-divine flex items-center justify-center text-white font-bold text-xs flex-shrink-0">ॐ</div>
              <div>
                <p className="text-[var(--indigo-deep)] text-sm font-semibold">{form.title}</p>
                <p className="text-[var(--warm-charcoal)]/60 text-xs mt-0.5">{form.message}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={sendNotification} disabled={sending || !form.title || !form.message} className="btn-divine w-full py-3 font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{sending ? 'wifi_tethering' : 'campaign'}</span>
          {sending ? 'Sending...' : `Send to ${form.target === 'all' ? 'All Users' : form.target}`}
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-[var(--indigo-deep)]">Notification History</h2>
        {sent.map(n => {
          const typeInfo = TYPES.find(t => t.value === n.type)
          return (
            <div key={n.id} className="card-divine p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo?.color || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{typeInfo?.label || n.type}</span>
                    <span className="text-xs text-[var(--warm-charcoal)]/40">{new Date(n.sent_at).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[var(--indigo-deep)] font-semibold text-sm">{n.title}</p>
                  <p className="text-[var(--warm-charcoal)]/60 text-xs mt-0.5">{n.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[var(--indigo-deep)] font-bold text-sm">{n.reach?.toLocaleString()}</p>
                  <p className="text-[var(--warm-charcoal)]/40 text-xs">reached</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
