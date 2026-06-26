'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mahatathastu.com'

interface Webinar {
  id: string
  title: string
  description: string | null
  host_name: string
  scheduled_at: string | null
  duration_minutes: number
  max_participants: number
  price: number
  livekit_room_name: string
  status: 'upcoming' | 'live' | 'ended'
  is_public: boolean
  created_at: string
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'
const btnPrimary = 'px-4 py-2 rounded-xl bg-[var(--indigo-deep)] text-white text-sm font-semibold hover:opacity-90 transition-opacity'

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-amber-50 text-amber-700 border-amber-200',
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ended: 'bg-gray-100 text-gray-500 border-gray-200',
}

const EMPTY_FORM = {
  title: '', description: '', host_name: 'MahaTathastu Team',
  scheduled_at: '', duration_minutes: 60, max_participants: 50, price: 0,
}

export default function AdminWebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Send invite modal state
  const [inviteWebinar, setInviteWebinar] = useState<Webinar | null>(null)
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/webinars')
    if (res.ok) {
      const json = await res.json()
      setWebinars(json.webinars || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createWebinar() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const res = await fetch('/api/admin/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed to create'); setSaving(false); return }
    toast.success('Webinar created!')
    setWebinars(w => [json.webinar, ...w])
    setForm(EMPTY_FORM)
    setShowCreate(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: 'upcoming' | 'live' | 'ended') {
    const res = await fetch(`/api/admin/webinars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setWebinars(w => w.map(x => x.id === id ? { ...x, status } : x))
      toast.success(`Status → ${status}`)
    } else {
      toast.error('Update failed')
    }
  }

  async function deleteWebinar(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/webinars/${id}`, { method: 'DELETE' })
    if (res.ok) { setWebinars(w => w.filter(x => x.id !== id)); toast.success('Deleted') }
    else toast.error('Delete failed')
  }

  function joinUrl(w: Webinar) { return `${APP}/webinar/${w.id}` }

  async function copyLink(w: Webinar) {
    await navigator.clipboard.writeText(joinUrl(w))
    setCopiedId(w.id)
    toast.success('Link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function sendInvites() {
    if (!inviteWebinar) return
    const emails = inviteEmails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
    if (!emails.length) { toast.error('Enter at least one email'); return }
    setSendingInvite(true)
    const res = await fetch(`/api/admin/webinars/${inviteWebinar.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails, recipientName: inviteName || 'Seeker' }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error('Send failed'); setSendingInvite(false); return }
    const ok = (json.results as any[]).filter(r => r.ok).length
    const fail = (json.results as any[]).filter(r => !r.ok).length
    toast.success(`Sent ${ok} invite(s)${fail ? ` · ${fail} failed` : ''}`)
    setSendingInvite(false)
    setInviteWebinar(null)
    setInviteEmails('')
    setInviteName('')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">Webinars</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">Create group live sessions · Generate join links · Send invites</p>
        </div>
        <button onClick={() => setShowCreate(s => !s)} className={btnPrimary}>
          <span className="material-symbols-outlined text-[16px] align-middle mr-1">add</span>
          New Webinar
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card-divine p-5 mb-6">
          <h2 className="font-bold text-[var(--indigo-deep)] mb-4">Create Webinar</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Title *</label>
              <input className={inputCls} placeholder="e.g. Vedic Astrology Live Q&A" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Description</label>
              <textarea className={inputCls} rows={3} placeholder="What will this session cover?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Host Name</label>
              <input className={inputCls} value={form.host_name} onChange={e => setForm(f => ({ ...f, host_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Schedule Date & Time</label>
              <input type="datetime-local" className={inputCls} value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Duration (minutes)</label>
              <input type="number" className={inputCls} value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Max Participants</label>
              <input type="number" className={inputCls} value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Price (₹, 0 = free)</label>
              <input type="number" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createWebinar} disabled={saving} className={btnPrimary}>
              {saving ? 'Creating…' : 'Create & Get Link'}
            </button>
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM) }} className="px-4 py-2 rounded-xl border border-[var(--warm-sand)] text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Webinar list */}
      {loading ? (
        <div className="text-center py-12 text-[var(--warm-charcoal)]/40 text-sm">Loading webinars…</div>
      ) : webinars.length === 0 ? (
        <div className="card-divine p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--warm-sand)] block mb-3">live_tv</span>
          <p className="text-[var(--warm-charcoal)]/50">No webinars yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webinars.map(w => (
            <div key={w.id} className="card-divine p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-[var(--indigo-deep)]">{w.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[w.status]}`}>
                      {w.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />}
                      {w.status}
                    </span>
                    {w.price > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">₹{w.price}</span>}
                    {w.price === 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Free</span>}
                  </div>
                  <div className="text-xs text-[var(--warm-charcoal)]/50 mb-2">
                    Host: {w.host_name} · {w.max_participants} max · {w.duration_minutes} min
                    {w.scheduled_at && ` · ${new Date(w.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`}
                  </div>
                  {w.description && <p className="text-xs text-[var(--warm-charcoal)]/60 line-clamp-2">{w.description}</p>}

                  {/* Join link */}
                  <div className="mt-3 flex items-center gap-2 bg-[var(--warm-sand)]/40 rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]">link</span>
                    <a
                      href={`/webinar/${w.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--indigo-deep)] flex-1 truncate hover:underline font-mono font-semibold"
                    >
                      {joinUrl(w)}
                    </a>
                    <button
                      onClick={() => copyLink(w)}
                      className="flex items-center gap-1 text-xs text-[var(--indigo-deep)] font-semibold hover:opacity-70 transition-opacity ml-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedId === w.id ? 'check' : 'content_copy'}
                      </span>
                      {copiedId === w.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {/* Status toggle */}
                  <div className="flex gap-1">
                    {w.status !== 'live' && (
                      <button onClick={() => updateStatus(w.id, 'live')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">
                        <span className="material-symbols-outlined text-[13px]">videocam</span> Go Live
                      </button>
                    )}
                    {w.status === 'live' && (
                      <>
                        <a
                          href={`/webinar/${w.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">meeting_room</span> Join Live
                        </a>
                        <button onClick={() => updateStatus(w.id, 'ended')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
                          <span className="material-symbols-outlined text-[13px]">stop</span> End
                        </button>
                      </>
                    )}
                    {w.status === 'ended' && (
                      <button onClick={() => updateStatus(w.id, 'upcoming')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors">
                        <span className="material-symbols-outlined text-[13px]">restart_alt</span> Reschedule
                      </button>
                    )}
                  </div>

                  {/* Send invite */}
                  <button
                    onClick={() => setInviteWebinar(w)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--indigo-deep)] text-white text-xs font-semibold hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[13px]">send</span> Send Invite
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteWebinar(w.id, w.title)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 border border-red-100 text-xs hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Invite Modal */}
      {inviteWebinar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-[var(--indigo-deep)] mb-1">Send Webinar Invite</h2>
            <p className="text-xs text-[var(--warm-charcoal)]/50 mb-4">{inviteWebinar.title}</p>

            <div className="mb-3">
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Recipient Name (optional)</label>
              <input className={inputCls} placeholder="Seeker" value={inviteName} onChange={e => setInviteName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-[var(--warm-charcoal)]/60 mb-1 block">Email Addresses</label>
              <textarea
                className={inputCls}
                rows={4}
                placeholder="one@example.com&#10;two@example.com&#10;(one per line, or comma-separated)"
                value={inviteEmails}
                onChange={e => setInviteEmails(e.target.value)}
              />
              <p className="text-[10px] text-[var(--warm-charcoal)]/40 mt-1">Enter multiple addresses — one per line or comma-separated</p>
            </div>

            {/* Join URL preview */}
            <div className="bg-[var(--warm-sand)]/40 rounded-xl px-3 py-2 mb-4 text-xs text-[var(--indigo-deep)] truncate">
              🔗 <a href={`/webinar/${inviteWebinar.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline font-mono font-semibold">{joinUrl(inviteWebinar)}</a>
            </div>

            <div className="flex gap-3">
              <button onClick={sendInvites} disabled={sendingInvite} className={`flex-1 ${btnPrimary}`}>
                {sendingInvite ? 'Sending…' : 'Send Invites'}
              </button>
              <button onClick={() => setInviteWebinar(null)} className="px-4 py-2 rounded-xl border border-[var(--warm-sand)] text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
