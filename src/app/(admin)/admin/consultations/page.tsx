'use client'

import SudarshanLoader from '@/components/SudarshanLoader'
import ConsultationRoom from '@/components/consultation/ConsultationRoom'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Slot {
  id: string; expert_id: string; date: string; start_time: string; end_time: string
  is_booked: boolean; is_blocked: boolean; created_at: string; price?: number
  profiles: { full_name: string } | null
}

interface Booking {
  id: string; slot_id: string; status: string; booked_at: string
  meeting_link: string | null; call_mode: string
  profiles: { full_name: string } | null
  consultation_slots: { date: string; start_time: string; end_time: string } | null
}

interface Expert { id: string; full_name: string }

const LIVEKIT_LIMITS = [
  { label: 'Total Concurrent Participants', value: '100', icon: 'group', warn: true },
  { label: 'WebRTC Minutes / Month', value: '5,000', icon: 'schedule', warn: false },
  { label: 'Egress Bandwidth / Month', value: '50 GB', icon: 'download', warn: false },
  { label: 'Active Egress Sessions', value: '2', icon: 'videocam', warn: true },
  { label: 'Active Ingress Sessions', value: '2', icon: 'upload', warn: true },
  { label: 'Concurrent AI Agents', value: '5', icon: 'smart_toy', warn: false },
  { label: 'Server API Requests / min', value: '1,000', icon: 'api', warn: false },
  { label: 'Egress Transcode Minutes / Month', value: '60 min', icon: 'movie', warn: true },
]

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminConsultationsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'slots' | 'bookings' | 'livekit'>('slots')
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ expert_id: '', date: '', start_time: '17:00', end_time: '17:45', price: '' })
  const [generatingSlots, setGeneratingSlots] = useState(false)
  const [generateDate, setGenerateDate] = useState('')
  const [generatePrice, setGeneratePrice] = useState('')
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [meetLinkEditing, setMeetLinkEditing] = useState<string | null>(null)
  const [meetLinkValue, setMeetLinkValue] = useState('')
  const [savingMeet, setSavingMeet] = useState(false)
  const [livekitMode, setLivekitMode] = useState<'production' | 'sandbox'>('production')
  const [savingMode, setSavingMode] = useState(false)
  const [activeCallBookingId, setActiveCallBookingId] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('Expert')

  async function loadAll() {
    setLoading(true)
    try {
      const [slotsRes, expertsRes, bookingsRes, modeRes] = await Promise.all([
        (supabase as any).from('consultation_slots')
          .select('id,expert_id,date,start_time,end_time,is_booked,is_blocked,created_at,price,profiles!expert_id(full_name)')
          .order('date').order('start_time'),
        supabase.from('profiles').select('id,full_name').or('role.eq.expert,role.eq.admin'),
        supabase.from('consultation_bookings')
          .select('*, profiles!user_id(full_name), consultation_slots(date,start_time,end_time)')
          .order('booked_at', { ascending: false })
          .limit(100),
        (supabase as any).from('platform_settings').select('value').eq('key', 'livekit_mode').single(),
      ])
      setSlots((slotsRes.data || []) as unknown as Slot[])
      setExperts(expertsRes.data || [])
      if (bookingsRes.error) {
        console.error('Bookings query error:', bookingsRes.error)
        toast.error('Bookings error: ' + bookingsRes.error.message + ' - Run migrations 014/015 in Supabase then refresh schema cache.')
      }
      setBookings((bookingsRes.data || []) as unknown as Booking[])
      if (modeRes.data?.value) setLivekitMode(modeRes.data.value as 'production' | 'sandbox')
    } catch (e: any) {
      toast.error('Failed to load consultations data: ' + (e?.message || 'network error'))
    } finally {
      setLoading(false)
    }
  }

  async function saveLivekitMode(newMode: 'production' | 'sandbox') {
    setSavingMode(true)
    const { error } = await (supabase as any).from('platform_settings').upsert({ key: 'livekit_mode', value: newMode, updated_at: new Date().toISOString() })
    if (error) toast.error('Failed to save: ' + error.message)
    else { setLivekitMode(newMode); toast.success(newMode === 'sandbox' ? 'Switched to Sandbox mode - dev only' : 'Switched to Production mode') }
    setSavingMode(false)
  }

  useEffect(() => {
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const PREDEFINED_SLOTS = [
    { start: '17:00', end: '17:45' },
    { start: '17:45', end: '18:30' },
    { start: '18:30', end: '19:15' },
    { start: '19:15', end: '20:00' },
    { start: '20:00', end: '20:45' },
    { start: '20:45', end: '21:30' },
    { start: '21:30', end: '22:15' },
    { start: '22:15', end: '23:00' },
  ]

  async function generateAllSlots() {
    if (!generateDate) { toast.error('Select a date first'); return }
    setGeneratingSlots(true)
    const price = parseFloat(generatePrice) || 0
    const expertId = experts[0]?.id || null
    let created = 0
    for (const ps of PREDEFINED_SLOTS) {
      const exists = slots.some(s => s.date === generateDate && s.start_time?.substring(0, 5) === ps.start)
      if (!exists) {
        const { data, error } = await supabase.from('consultation_slots').insert({
          expert_id: expertId, date: generateDate,
          start_time: ps.start, end_time: ps.end,
          is_booked: false, is_blocked: false,
          price, duration_minutes: 45,
        } as any).select('id,expert_id,date,start_time,end_time,is_booked,is_blocked,created_at,profiles!expert_id(full_name)').single()
        if (!error && data) { setSlots(s => [...s, data as unknown as Slot]); created++ }
      }
    }
    toast.success(created > 0 ? `${created} slots generated for ${generateDate}` : 'All slots already exist for this date')
    setGeneratingSlots(false)
    setGenerateDate('')
    setGeneratePrice('')
  }

  async function addSlot() {
    if (!form.expert_id || !form.date) { toast.error('Select expert and date'); return }

    const [sh, sm] = form.start_time.split(':').map(Number)
    const [eh, em] = form.end_time.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    if (startMin < 17 * 60 || endMin > 23 * 60) {
      toast.error('Slots must be between 5:00 PM and 11:00 PM'); return
    }

    setSaving(true)
    const { data, error } = await supabase.from('consultation_slots').insert({
      expert_id: form.expert_id, date: form.date,
      start_time: form.start_time, end_time: form.end_time,
      is_booked: false, is_blocked: false,
      price: parseFloat(form.price) || 0,
      duration_minutes: 45,
    } as any).select('id,expert_id,date,start_time,end_time,is_booked,is_blocked,created_at,profiles!expert_id(full_name)').single()
    if (error) toast.error('Failed: ' + error.message)
    else { setSlots(s => [...s, data as unknown as Slot]); toast.success('Slot added'); setShowAdd(false); setForm({ expert_id: '', date: '', start_time: '17:00', end_time: '17:45', price: '' }) }
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

  function openMeetEdit(b: Booking) {
    setMeetLinkEditing(b.id)
    setMeetLinkValue(b.meeting_link || '')
  }

  async function saveMeetLink(bookingId: string) {
    setSavingMeet(true)
    const isGoogleMeet = meetLinkValue.includes('meet.google.com') || meetLinkValue.includes('zoom.us') || meetLinkValue.startsWith('http')
    const { error } = await supabase.from('consultation_bookings').update({
      meeting_link: meetLinkValue || null,
      call_mode: meetLinkValue ? 'google_meet' : 'livekit',
    } as any).eq('id', bookingId)
    if (error) toast.error(error.message)
    else {
      toast.success(meetLinkValue ? 'Meet link saved - user will see it' : 'Meet link removed - LiveKit will be used')
      setBookings(bks => bks.map(b => b.id === bookingId ? { ...b, meeting_link: meetLinkValue || null, call_mode: meetLinkValue ? 'google_meet' : 'livekit' } : b))
      setMeetLinkEditing(null)
    }
    setSavingMeet(false)
  }

  async function updateBookingStatus(id: string, status: string) {
    const { error } = await supabase.from('consultation_bookings').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Status updated')
      setBookings(bks => bks.map(b => b.id === id ? { ...b, status } : b))
    }
  }

  const filtered = slots.filter(s =>
    filter === 'all' ? true :
    filter === 'booked' ? s.is_booked :
    filter === 'available' ? (!s.is_booked && !s.is_blocked) :
    filter === 'blocked' ? s.is_blocked : true
  )
  const stats = {
    booked: slots.filter(s => s.is_booked).length,
    available: slots.filter(s => !s.is_booked && !s.is_blocked).length,
    meetLinks: bookings.filter(b => b.meeting_link).length,
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
            Consultations
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">
            {stats.booked} booked · {stats.available} available · {bookings.length} total bookings · {stats.meetLinks} with Meet link
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setTab('slots'); setShowAdd(v => !v) }} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">add</span>Add Single Slot
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--warm-sand)]">
        {([
          { key: 'slots', label: 'Slots', icon: 'event' },
          { key: 'bookings', label: `Bookings (${bookings.length})`, icon: 'book_online' },
          { key: 'livekit', label: 'Video Settings', icon: 'videocam' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.key ? 'border-[var(--indigo-deep)] text-[var(--indigo-deep)]' : 'border-transparent text-[var(--warm-charcoal)]/50 hover:text-[var(--indigo-deep)]'}`}>
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: tab === t.key ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SLOTS TAB ── */}
      {tab === 'slots' && (
        <>
          {/* Generate All Slots panel */}
          <div className="bento-card p-5" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-bold text-[#166534] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Generate All 8 Slots for a Date (5 PM – 11 PM · 45 min each)
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-[#166534]/70 mb-1.5 uppercase tracking-wide">Date *</label>
                <input type="date" value={generateDate} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setGenerateDate(e.target.value)} className={inputCls} style={{ minWidth: 160 }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#166534]/70 mb-1.5 uppercase tracking-wide">Price per slot (₹)</label>
                <input type="number" value={generatePrice} min="0" step="50"
                  onChange={e => setGeneratePrice(e.target.value)}
                  placeholder="0 = free"
                  className={inputCls} style={{ minWidth: 130 }} />
              </div>
              <button onClick={generateAllSlots} disabled={generatingSlots || !generateDate}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#166534] text-white hover:bg-[#14532d] transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                {generatingSlots ? 'Generating...' : 'Generate All Slots'}
              </button>
            </div>
            <p className="text-xs text-[#166534]/60 mt-2">Creates 8 slots: 5:00 PM, 5:45 PM, 6:30 PM, 7:15 PM, 8:00 PM, 8:45 PM, 9:30 PM, 10:15 PM. Skips slots already created.</p>
          </div>

          {/* Manual Add Single Slot */}
          {showAdd && (
            <div className="bento-card p-5">
              {experts.length === 0 ? (
                <div className="text-sm text-[var(--warm-charcoal)]/60 text-center py-2">
                  <p>No expert/admin users found in profiles. Make sure at least one user has <strong>role = expert</strong> or <strong>role = admin</strong>.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Expert *</label>
                    <select value={form.expert_id} onChange={e => setForm(f => ({ ...f, expert_id: e.target.value }))} className={inputCls}>
                      <option value="">- Select -</option>
                      {experts.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Date *</label>
                    <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Start</label>
                    <input type="time" value={form.start_time} min="17:00" max="22:15"
                      onChange={e => {
                        const start = e.target.value
                        const [h, m] = start.split(':').map(Number)
                        const endTotalMin = h * 60 + m + 45
                        const end = `${String(Math.floor(endTotalMin / 60)).padStart(2, '0')}:${String(endTotalMin % 60).padStart(2, '0')}`
                        setForm(f => ({ ...f, start_time: start, end_time: end }))
                      }}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">End (auto · 45 min)</label>
                    <input type="time" value={form.end_time} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Price (₹)</label>
                    <input type="number" value={form.price} min="0" step="50"
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0 = free" className={inputCls} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-5 flex gap-3 justify-end">
                    <button onClick={() => setShowAdd(false)} className="text-sm text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)] px-4 py-2">Cancel</button>
                    <button onClick={addSlot} disabled={saving} className="btn-divine px-6 py-2 text-sm disabled:opacity-60">
                      {saving ? 'Adding...' : 'Add Slot'}
                    </button>
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

          <div className="space-y-2.5">
            {filtered.map(slot => (
              <div key={slot.id} className={`bento-card p-4 flex items-center justify-between gap-4 border-l-4 ${slot.is_booked ? 'border-l-emerald-500' : slot.is_blocked ? 'border-l-red-300' : 'border-l-[var(--warm-sand)]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${slot.is_booked ? 'bg-emerald-500' : slot.is_blocked ? 'bg-red-400' : 'bg-[var(--warm-sand)]'}`} />
                  <div>
                    <p className="text-[var(--indigo-deep)] font-semibold text-sm">{slot.profiles?.full_name || 'No Expert Assigned'}</p>
                    <p className="text-[var(--warm-charcoal)]/50 text-xs">{slot.date} · {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)} · {slot.price ? `₹${slot.price}` : 'Free'}</p>
                    <div className="flex gap-1 mt-1">
                      {slot.is_booked && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Booked</span>}
                      {slot.is_blocked && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Blocked</span>}
                      {!slot.is_booked && !slot.is_blocked && <span className="text-[10px] bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 px-1.5 py-0.5 rounded-full font-medium">Available</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => toggleBlocked(slot.id, slot.is_blocked)} className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">
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
        </>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="bento-card p-4 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="material-symbols-outlined text-blue-500 text-[20px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <p className="text-sm text-blue-700 leading-relaxed">
              <strong>Google Meet Fallback:</strong> If LiveKit has issues or the user prefers it, paste a Google Meet / Zoom link below. The user's booking page will show a "Join via Meet" button instead of the LiveKit room. Leave blank to use LiveKit (default).
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2">book_online</span>
              <p className="text-[var(--warm-charcoal)]/40 text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => {
                const slot = b.consultation_slots as any
                const isEditing = meetLinkEditing === b.id
                return (
                  <div key={b.id} className="bento-card overflow-hidden">
                    <div className="p-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--indigo-deep)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(b.profiles?.full_name || 'U').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--indigo-deep)] text-sm">{b.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-[var(--warm-charcoal)]/50">User booking</p>
                          <p className="text-xs text-[var(--warm-charcoal)]/40 mt-0.5">
                            {slot ? `${slot.date} · ${slot.start_time?.slice(0,5)} – ${slot.end_time?.slice(0,5)}` : new Date(b.booked_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Call mode badge */}
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide inline-flex items-center gap-1 ${b.call_mode === 'google_meet' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {b.call_mode === 'google_meet' ? 'meeting_room' : 'videocam'}
                          </span>
                          {b.call_mode === 'google_meet' ? 'Google Meet' : 'Built-in Video'}
                        </span>
                        {/* Status dropdown */}
                        <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}
                          className="text-xs border border-[var(--warm-sand)] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[var(--indigo-deep)]">
                          {['pending','confirmed','completed','cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {/* Join Call - LiveKit */}
                        {b.status === 'confirmed' && b.call_mode !== 'google_meet' && (
                          <button
                            onClick={() => setActiveCallBookingId(activeCallBookingId === b.id ? null : b.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all inline-flex items-center gap-1 ${activeCallBookingId === b.id ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-[var(--indigo-deep)] text-white hover:opacity-90'}`}>
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {activeCallBookingId === b.id ? 'call_end' : 'videocam'}
                            </span>
                            {activeCallBookingId === b.id ? 'Leave Call' : 'Join Call'}
                          </button>
                        )}
                        {/* Open Google Meet */}
                        {b.status === 'confirmed' && b.call_mode === 'google_meet' && b.meeting_link && (
                          <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
                            Open Meet
                          </a>
                        )}
                        <button onClick={() => isEditing ? setMeetLinkEditing(null) : openMeetEdit(b)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all inline-flex items-center gap-1 ${isEditing ? 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          <span className="material-symbols-outlined text-[14px]">video_call</span>
                          {isEditing ? 'Cancel' : 'Set Meet Link'}
                        </button>
                      </div>
                    </div>

                    {/* Inline LiveKit room for admin/expert */}
                    {activeCallBookingId === b.id && b.call_mode !== 'google_meet' && (
                      <div className="px-4 pb-4 pt-2 border-t border-[var(--warm-sand)]/60">
                        <ConsultationRoom
                          bookingId={b.id}
                          userName={adminName}
                          isExpert={true}
                          onLeave={() => setActiveCallBookingId(null)}
                        />
                      </div>
                    )}

                    {/* Meet link editor */}
                    {isEditing && (
                      <div className="px-4 pb-4 pt-1 border-t border-[var(--warm-sand)]/60 bg-blue-50/40">
                        <label className="block text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                          Google Meet / Zoom Link
                          <span className="ml-2 text-[10px] text-blue-500 normal-case tracking-normal font-normal">(leave blank to use LiveKit)</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={meetLinkValue}
                            onChange={e => setMeetLinkValue(e.target.value)}
                            placeholder="https://meet.google.com/xxx-yyyy-zzz"
                            className="flex-1 px-3 py-2 rounded-xl border border-blue-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <button onClick={() => saveMeetLink(b.id)} disabled={savingMeet}
                            className="btn-divine px-5 py-2 text-sm disabled:opacity-50 whitespace-nowrap">
                            {savingMeet ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                        {meetLinkValue && (
                          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">info</span>
                            User will see a "Join via Google Meet" button - LiveKit room will be hidden.
                          </p>
                        )}
                        {!meetLinkValue && b.meeting_link && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            Saving empty will remove the Meet link and switch back to LiveKit.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Show existing meet link if set */}
                    {!isEditing && b.meeting_link && (
                      <div className="px-4 pb-3 pt-0">
                        <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                          <span className="material-symbols-outlined text-blue-500 text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
                          <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline font-medium truncate flex-1">{b.meeting_link}</a>
                          <button onClick={() => navigator.clipboard.writeText(b.meeting_link!)}
                            className="text-blue-400 hover:text-blue-600 transition-colors shrink-0">
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── LIVEKIT PLAN TAB ── */}
      {tab === 'livekit' && (
        <div className="space-y-5">

          {/* ── TOKEN MODE TOGGLE ── */}
          <div className="bento-card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                  Token Mode
                </h3>
                <p className="text-xs text-[var(--warm-charcoal)]/50 max-w-sm leading-relaxed">
                  Controls how video call tokens are generated.
                  {livekitMode === 'sandbox'
                    ? ' Sandbox uses a free test server - no API key needed, but sessions are ephemeral and not production-grade.'
                    : ' Production uses your private API key to mint signed tokens - secure and fully under your control.'}
                </p>
              </div>
              {/* Toggle pills */}
              <div className="flex gap-2 rounded-2xl p-1 shrink-0" style={{ background: 'var(--warm-sand)' }}>
                {(['production', 'sandbox'] as const).map(m => (
                  <button
                    key={m}
                    disabled={savingMode}
                    onClick={() => m !== livekitMode && saveLivekitMode(m)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all disabled:opacity-60 ${livekitMode === m ? (m === 'sandbox' ? 'bg-amber-500 text-white shadow-sm' : 'bg-[var(--indigo-deep)] text-white shadow-sm') : 'text-[var(--warm-charcoal)]/50 hover:text-[var(--indigo-deep)]'}`}
                  >
                    {m === 'production' ? 'Production' : 'Sandbox'}
                  </button>
                ))}
              </div>
            </div>

            {/* Status badge row */}
            <div className="mt-4 pt-4 border-t border-[var(--warm-sand)] flex flex-wrap gap-3 items-center">
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold ${livekitMode === 'sandbox' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${livekitMode === 'sandbox' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {livekitMode === 'sandbox' ? 'Sandbox Active' : 'Production Active'}
              </span>
              {livekitMode === 'production' && (
                <span className="text-xs text-[var(--warm-charcoal)]/40">Token endpoint: <code className="text-[var(--indigo-deep)] bg-[var(--warm-sand)] px-1.5 py-0.5 rounded">/api/get-video-token</code> → signed JWT</span>
              )}
              {livekitMode === 'sandbox' && (
                <span className="text-xs text-amber-700/70">Token endpoint: <code className="bg-amber-50 px-1.5 py-0.5 rounded">sandbox.mahatathastu.com/token</code> (dev)</span>
              )}
            </div>

            {livekitMode === 'sandbox' && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="material-symbols-outlined text-amber-600 text-[16px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Dev only:</strong> Sandbox tokens are publicly accessible and may be rate-limited. All users on this platform will connect via the sandbox - switch back to Production before going live.
                </p>
              </div>
            )}
          </div>

          {/* Plan header */}
          <div className="bento-card p-5" style={{ background: 'linear-gradient(135deg, #0f0920, #1a0e2e)', border: '1px solid rgba(212,160,23,0.35)' }}>
            <div className="flex items-start gap-4">
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4A017, #b8860b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><span className="material-symbols-outlined text-[#1a0e2e] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>brightness_7</span></div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    MahaTathastu Video - Build Plan
                  </h2>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-400 font-bold border border-emerald-700/40 uppercase tracking-widest">
                    Free · $0/mo
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-900/60 text-amber-400 font-bold border border-amber-700/40 uppercase tracking-widest">
                    Hard Caps - No Overage
                  </span>
                </div>
                <p className="text-sm text-white/50 mt-1">Server: <span className="text-amber-400/80 font-mono">mahatathastu-chyl883d</span></p>
              </div>
            </div>
          </div>

          {/* Rate limits grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--warm-charcoal)]/50 mb-3">Monthly Allowances & Hard Limits</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LIVEKIT_LIMITS.map(l => (
                <div key={l.label} className={`bento-card p-4 ${l.warn ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-[18px] ${l.warn ? 'text-amber-500' : 'text-[var(--indigo-deep)]'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>{l.icon}</span>
                    {l.warn && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Low</span>}
                  </div>
                  <p className={`text-xl font-black mb-1 ${l.warn ? 'text-amber-600' : 'text-[var(--indigo-deep)]'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{l.value}</p>
                  <p className="text-[10px] text-[var(--warm-charcoal)]/50 leading-tight">{l.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Warning callout */}
          <div className="bento-card p-4 flex gap-3 items-start border-amber-200" style={{ background: '#fffbeb' }}>
            <span className="material-symbols-outlined text-amber-500 text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Video Call Capacity Limits</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Current plan has <strong>hard caps with no overage</strong> - once limits are hit, calls will fail. Key constraint: <strong>only 100 total concurrent participants</strong> across all rooms. For 1-on-1 sessions that's 50 simultaneous calls max.
                Monthly: <strong>5,000 video minutes</strong> (~83 hours of calls).
                When approaching limits, use the <strong>Google Meet fallback</strong> in the Bookings tab.
              </p>
            </div>
          </div>

          {/* Google Meet fallback info */}
          <div className="bento-card p-4 flex gap-3 items-start border-blue-200" style={{ background: '#eff6ff' }}>
            <span className="material-symbols-outlined text-blue-500 text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
            <div>
              <p className="text-sm font-bold text-blue-800 mb-1">Google Meet Fallback - How It Works</p>
              <ol className="text-xs text-blue-700 leading-relaxed space-y-1 list-decimal list-inside">
                <li>Create a Google Meet link at <strong>meet.google.com</strong> (or use Zoom)</li>
                <li>Go to the <strong>Bookings</strong> tab above</li>
                <li>Click <strong>"Set Meet Link"</strong> on any confirmed booking and paste the link</li>
                <li>User will see a <strong>"Join via Google Meet"</strong> button on their consultations page</li>
                <li>The built-in video room is automatically hidden when a Meet link is set</li>
              </ol>
            </div>
          </div>

          {/* Sandbox token server */}
          <div className="bento-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--warm-charcoal)]/50 mb-3">Server Configuration</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Video Server URL', value: 'wss://mahatathastu-chyl883d.livekit.cloud', icon: 'link' },
                { label: 'Dev Token Server', value: 'https://mahatathastu-2hw6kd.sandbox.livekit.io', icon: 'token' },
                { label: 'Dev Server ID', value: 'mahatathastu-2hw6kd', icon: 'tag' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--indigo-deep)]/40 text-[16px] shrink-0">{row.icon}</span>
                  <span className="text-xs text-[var(--warm-charcoal)]/50 w-40 shrink-0">{row.label}</span>
                  <span className="text-xs font-mono text-[var(--indigo-deep)] bg-[var(--warm-sand)] px-2.5 py-1 rounded-lg truncate flex-1">{row.value}</span>
                  <button onClick={() => navigator.clipboard.writeText(row.value)}
                    className="shrink-0 text-[var(--warm-charcoal)]/30 hover:text-[var(--indigo-deep)] transition-colors">
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-amber-600 mt-1">⚠ API keys are managed via Vercel environment variables and not shown here.</p>
            </div>
          </div>

          {/* Upgrade tip */}
          <div className="text-center py-4 text-xs text-[var(--warm-charcoal)]/40">
            To increase capacity, contact your infrastructure provider - next tier gives 50,000 video minutes + 500 GB bandwidth + unlimited participants
          </div>
        </div>
      )}
    </div>
  )
}
