'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Slot {
  id: string; expert_id: string; date: string; start_time: string; end_time: string
  is_booked: boolean; is_blocked: boolean; created_at: string
  profiles: { full_name: string } | null
}

interface Expert { id: string; full_name: string }

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

const emptyForm = { expert_id: '', date: '', start_time: '10:00', end_time: '11:00' }

export default function AdminConsultationsPage() {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  async function loadAll() {
    const [slotsRes, expertsRes] = await Promise.all([
      supabase.from('consultation_slots')
        .select('id,expert_id,date,start_time,end_time,is_booked,is_blocked,created_at,profiles!expert_id(full_name)')
        .order('date').order('start_time'),
      supabase.from('profiles').select('id,full_name').eq('role', 'expert'),
    ])
    setSlots((slotsRes.data || []) as unknown as Slot[])
    setExperts(expertsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function addSlot() {
    if (!form.expert_id || !form.date) { toast.error('Select expert and date'); return }
    setSaving(true)
    const { data, error } = await supabase.from('consultation_slots').insert({
      expert_id: form.expert_id, date: form.date,
      start_time: form.start_time, end_time: form.end_time,
      is_booked: false, is_blocked: false,
    }).select('id,expert_id,date,start_time,end_time,is_booked,is_blocked,created_at,profiles!expert_id(full_name)').single()
    if (error) toast.error('Failed: ' + error.message)
    else { setSlots(s => [...s, data as unknown as Slot]); toast.success('Slot added'); setShowAdd(false); setForm(emptyForm) }
    setSaving(false)
  }

  async function toggleBlocked(id: string, blocked: boolean) {
    await supabase.from('consultation_slots').update({ is_blocked: !blocked } as any).eq('id', id)
    setSlots(s => s.map(x => x.id === id ? { ...x, is_blocked: !blocked } : x))
    toast.success(blocked ? 'Unblocked' : 'Blocked')
  }

  async function deleteSlot(id: string) {
    if (!confirm('Delete this slot?')) return
    const { error } = await supabase.from('consultation_slots').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setSlots(s => s.filter(x => x.id !== id)); toast.success('Deleted') }
  }

  const filtered = slots.filter(s =>
    filter === 'all' ? true :
    filter === 'booked' ? s.is_booked :
    filter === 'available' ? (!s.is_booked && !s.is_blocked) :
    filter === 'blocked' ? s.is_blocked : true
  )

  const stats = { booked: slots.filter(s => s.is_booked).length, available: slots.filter(s => !s.is_booked && !s.is_blocked).length }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
            Consultations
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">{stats.booked} booked · {stats.available} available · {slots.length} total slots</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">add</span>Add Slot
        </button>
      </div>

      {showAdd && (
        <div className="card-divine p-5">
          {experts.length === 0 ? (
            <p className="text-sm text-[var(--warm-charcoal)]/60 text-center py-2">
              No expert users found. Go to <strong>Users</strong> and set a user's role to <strong>expert</strong> first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Expert *</label>
                <select value={form.expert_id} onChange={e => setForm(f => ({ ...f, expert_id: e.target.value }))} className={inputCls}>
                  <option value="">— Select —</option>
                  {experts.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Date *</label>
                <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">End Time</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={inputCls} /></div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-3 justify-end">
                <button onClick={() => setShowAdd(false)} className="text-sm text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)] px-4 py-2">Cancel</button>
                <button onClick={addSlot} disabled={saving} className="btn-divine px-6 py-2 text-sm disabled:opacity-60">{saving ? 'Adding...' : 'Add Slot'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {['all', 'available', 'booked', 'blocked'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(slot => (
          <div key={slot.id} className={`card-divine p-4 flex items-center justify-between gap-4 border-l-4 ${slot.is_booked ? 'border-l-emerald-500' : slot.is_blocked ? 'border-l-red-300' : 'border-l-[var(--warm-sand)]'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${slot.is_booked ? 'bg-emerald-500' : slot.is_blocked ? 'bg-red-400' : 'bg-[var(--warm-sand)]'}`} />
              <div>
                <p className="text-[var(--indigo-deep)] font-semibold text-sm">{slot.profiles?.full_name || 'Unknown Expert'}</p>
                <p className="text-[var(--warm-charcoal)]/50 text-xs">
                  {slot.date} · {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                </p>
                <div className="flex gap-1 mt-1">
                  {slot.is_booked && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Booked</span>}
                  {slot.is_blocked && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Blocked</span>}
                  {!slot.is_booked && !slot.is_blocked && <span className="text-[10px] bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 px-1.5 py-0.5 rounded-full font-medium">Available</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button onClick={() => toggleBlocked(slot.id, slot.is_blocked)}
                className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">
                {slot.is_blocked ? 'Unblock' : 'Block'}
              </button>
              <button onClick={() => deleteSlot(slot.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            <p className="text-[var(--warm-charcoal)]/40 text-sm">No slots found</p>
          </div>
        )}
      </div>
    </div>
  )
}
