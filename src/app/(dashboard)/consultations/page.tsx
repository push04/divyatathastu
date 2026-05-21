'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Slot {
  id: string
  expert_id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
  is_blocked: boolean
}

interface Booking {
  id: string
  slot_id: string
  status: string
  booked_at: string
  consultation_slots: { expert_id: string; date: string; start_time: string; end_time: string } | null
}

const SPECIALIZATIONS = ['All', 'Astrology', 'Numerology', 'Vastu', 'Ayurveda', 'Tarot', 'Meditation']

export default function ConsultationsPage() {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'book' | 'my'>('book')
  const [filter, setFilter] = useState('All')
  const [booking, setBooking] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const [slotsRes, { data: { user } }] = await Promise.all([
        supabase.from('consultation_slots').select('*').eq('is_booked', false).gte('date', today).order('date').order('start_time'),
        supabase.auth.getUser(),
      ])
      if (slotsRes.data) setSlots(slotsRes.data)

      if (user) {
        const { data: bks } = await supabase.from('consultation_bookings').select('id,slot_id,status,booked_at,consultation_slots(expert_id,date,start_time,end_time)').eq('user_id', user.id).order('booked_at', { ascending: false })
        if (bks) setBookings(bks as unknown as Booking[])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function bookSlot(slotId: string) {
    setBooking(slotId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login'); setBooking(null); return }

    const { error } = await supabase.from('consultation_bookings').insert({ user_id: user.id, slot_id: slotId, status: 'confirmed' })
    if (error) { toast.error('Booking failed. Slot may be taken.'); setBooking(null); return }

    await supabase.from('consultation_slots').update({ is_booked: true }).eq('id', slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
    toast.success('Consultation booked! Check your email for confirmation.')
    setBooking(null)
    setTab('my')
  }

  const filtered = slots

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow">ॐ</div></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2"><span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span> Consultations</h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">Book 1-on-1 sessions with Vedic experts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['book', 'my'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${tab === t ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
            {t === 'book' ? (
              <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span> Book Session</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span> My Bookings ({bookings.length})</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'book' ? (
        <>
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SPECIALIZATIONS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                {s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card-divine p-12 text-center">
              <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[40px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span></div>
              <p className="font-bold text-[var(--indigo-deep)] mb-1">No slots available</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60">Check back later or contact us via Mailbox</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(slot => (
                <div key={slot.id} className="card-divine p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-[var(--indigo-deep)]">Expert Consultation</h3>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--warm-charcoal)]/60">
                    <div className="bg-[var(--warm-sand)] rounded-lg p-2"><p className="font-medium text-[var(--indigo-deep)] inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span> Date</p><p>{new Date(slot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
                    <div className="bg-[var(--warm-sand)] rounded-lg p-2"><p className="font-medium text-[var(--indigo-deep)] inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span> Time</p><p>{slot.start_time}</p></div>
                  </div>

                  <button
                    onClick={() => bookSlot(slot.id)}
                    disabled={booking === slot.id}
                    className="btn-divine w-full py-2.5 text-sm mt-3 disabled:opacity-50"
                  >
                    {booking === slot.id ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="card-divine p-12 text-center">
              <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[40px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span></div>
              <p className="font-bold text-[var(--indigo-deep)] mb-1">No bookings yet</p>
              <button onClick={() => setTab('book')} className="btn-divine px-6 py-2.5 mt-3 text-sm">Book a Session</button>
            </div>
          ) : (
            bookings.map(b => {
              const slot = b.consultation_slots as any
              return (
                <div key={b.id} className="card-divine p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--indigo-deep)]">Expert Consultation</p>
                    <p className="text-sm text-[var(--warm-charcoal)]/60">{slot ? `${new Date(slot.date).toLocaleDateString('en-IN')} at ${slot.start_time}` : new Date(b.booked_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{b.status}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
