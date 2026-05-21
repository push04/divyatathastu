'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const DEMO_SLOTS: any[] = [
  { id: 's1', expert_name: 'Dr. Rajesh Sharma', date: '2025-10-10', time: '10:00', duration_minutes: 60, price: 1500, is_booked: true, booked_by_email: 'priya@example.com', type: 'Astrology' },
  { id: 's2', expert_name: 'Dr. Rajesh Sharma', date: '2025-10-10', time: '11:30', duration_minutes: 60, price: 1500, is_booked: false, booked_by_email: null, type: 'Astrology' },
  { id: 's3', expert_name: 'Numerologist Kavita Jain', date: '2025-10-11', time: '14:00', duration_minutes: 45, price: 999, is_booked: true, booked_by_email: 'amit@example.com', type: 'Numerology' },
  { id: 's4', expert_name: 'Ar. Priya Vastu', date: '2025-10-12', time: '09:00', duration_minutes: 90, price: 2000, is_booked: false, booked_by_email: null, type: 'Vastu' },
  { id: 's5', expert_name: 'Swami Ananda', date: '2025-10-13', time: '07:00', duration_minutes: 60, price: 800, is_booked: false, booked_by_email: null, type: 'Wellness' },
]

const EXPERTS = ['Dr. Rajesh Sharma', 'Numerologist Kavita Jain', 'Ar. Priya Vastu', 'Swami Ananda']
const TYPES = ['Astrology', 'Numerology', 'Vastu', 'Wellness', 'Spiritual']

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminConsultationsPage() {
  const [slots, setSlots] = useState(DEMO_SLOTS)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ expert_name: EXPERTS[0], date: '', time: '10:00', duration_minutes: '60', price: '1500', type: 'Astrology' })
  const [filter, setFilter] = useState('all')

  const filtered = slots.filter(s => filter === 'all' ? true : filter === 'booked' ? s.is_booked : !s.is_booked)
  const booked = slots.filter(s => s.is_booked).length
  const revenue = slots.filter(s => s.is_booked).reduce((acc, s) => acc + Number(s.price), 0)

  async function addSlot() {
    if (!form.date) { toast.error('Select a date'); return }
    const newSlot = { ...form, id: Date.now().toString(), duration_minutes: Number(form.duration_minutes), price: Number(form.price), is_booked: false, booked_by_email: null }
    setSlots(s => [newSlot, ...s])
    try { const supabase = createClient(); await supabase.from('consultation_slots').insert(newSlot as any) } catch {}
    setShowAdd(false)
    toast.success('Slot added')
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return
    setSlots(s => s.map(x => x.id === id ? { ...x, is_booked: false, booked_by_email: null } : x))
    try { const supabase = createClient(); await supabase.from('consultation_slots').update({ is_booked: false } as any).eq('id', id) } catch {}
    toast.success('Booking cancelled')
  }

  async function deleteSlot(id: string) {
    if (!confirm('Delete this slot?')) return
    setSlots(s => s.filter(x => x.id !== id))
    try { const supabase = createClient(); await supabase.from('consultation_slots').delete().eq('id', id) } catch {}
    toast.success('Slot deleted')
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
            Consultations
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">{booked}/{slots.length} booked · <span className="text-emerald-600 font-semibold">₹{revenue.toLocaleString('en-IN')}</span> revenue</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">add</span>Add Slot
        </button>
      </div>

      {showAdd && (
        <div className="card-divine p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Expert</label>
            <select value={form.expert_name} onChange={e => setForm(f => ({ ...f, expert_name: e.target.value }))} className={inputCls}>{EXPERTS.map(e => <option key={e}>{e}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Time</label>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Duration (min)</label>
            <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Price (₹)</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="sm:col-span-3 flex gap-3 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-sm text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)] px-4 py-2">Cancel</button>
            <button onClick={addSlot} className="btn-divine px-6 py-2 text-sm">Add Slot</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {['all', 'booked', 'available'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(slot => (
          <div key={slot.id} className={`card-divine p-4 flex items-center justify-between gap-4 border-l-4 ${slot.is_booked ? 'border-l-emerald-500' : 'border-l-[var(--warm-sand)]'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full ${slot.is_booked ? 'bg-emerald-500' : 'bg-[var(--warm-sand)]'}`} />
              <div>
                <p className="text-[var(--indigo-deep)] font-semibold text-sm">{slot.expert_name}</p>
                <p className="text-[var(--warm-charcoal)]/50 text-xs">{slot.type} · {slot.date} at {slot.time} · {slot.duration_minutes} min</p>
                {slot.is_booked && <p className="text-emerald-600 text-xs mt-0.5">Booked by: {slot.booked_by_email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-[var(--indigo-deep)]">₹{Number(slot.price).toLocaleString('en-IN')}</span>
              <div className="flex gap-3">
                {slot.is_booked && <button onClick={() => cancelBooking(slot.id)} className="text-xs text-amber-600 hover:underline font-medium">Cancel booking</button>}
                <button onClick={() => deleteSlot(slot.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
              </div>
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
