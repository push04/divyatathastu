'use client'

import Link from 'next/link'
import SudarshanLoader from '@/components/SudarshanLoader'
import ConsultationRoom from '@/components/consultation/ConsultationRoom'

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
  specialization?: string
}

interface Booking {
  id: string
  slot_id: string
  status: string
  booked_at: string
  meeting_link: string | null
  call_mode: string | null
  consultation_slots: { expert_id: string; date: string; start_time: string; end_time: string } | null
}

const SPECIALIZATIONS = ['All', 'Astrology', 'Numerology', 'Vastu', 'Ayurveda', 'Tarot', 'Meditation']

export default function ConsultationsPage() {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [experts, setExperts] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'book' | 'my'>('book')
  const [filter, setFilter] = useState('All')
  const [booking, setBooking] = useState<string | null>(null)
  const [activeCallBookingId, setActiveCallBookingId] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)

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

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) createClient().from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => { if (data) setProfile(data as any) })
    })
  }, [])

  // Generate 7-day date slider in IST
  useEffect(() => {
    const list: string[] = []
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    for (let i = 0; i < 7; i++) {
      const d = new Date(nowIST)
      d.setDate(d.getDate() + i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      list.push(`${yyyy}-${mm}-${dd}`)
    }
    setDates(list)
    setSelectedDate(list[0])
  }, [])

  // Fetch slot & expert bookings
  useEffect(() => {
    if (dates.length === 0) return
    async function load() {
      const todayStr = dates[0]
      const endOfWeekStr = dates[dates.length - 1]
      const [slotsRes, expertsRes, { data: { user } }] = await Promise.all([
        supabase.from('consultation_slots')
          .select('*')
          .gte('date', todayStr)
          .lte('date', endOfWeekStr),
        supabase.from('profiles').select('id,full_name').or('role.eq.expert,role.eq.admin'),
        supabase.auth.getUser(),
      ])

      if (slotsRes.data) setSlots(slotsRes.data as Slot[])
      if (expertsRes.data) setExperts(expertsRes.data as any[])

      if (user) {
        const { data: bks } = await supabase.from('consultation_bookings')
          .select('*, consultation_slots(expert_id,date,start_time,end_time)')
          .eq('user_id', user.id)
          .order('booked_at', { ascending: false })
        if (bks) setBookings(bks as unknown as Booking[])
      }
      setLoading(false)
    }
    load()
  }, [dates]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPast = (date: string, startTime: string) => {
    const [sh, sm] = startTime.split(':').map(Number)
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const slotDateTime = new Date(nowIST)
    const [y, m, d] = date.split('-').map(Number)
    slotDateTime.setFullYear(y, m - 1, d)
    slotDateTime.setHours(sh, sm, 0, 0)
    return slotDateTime.getTime() < nowIST.getTime()
  }

  const isSlotBooked = (date: string, startTime: string) => {
    const normTime = startTime.substring(0, 5)
    return slots.some(s => s.date === date && s.start_time.substring(0, 5) === normTime && s.is_booked)
  }

  const isSlotBlocked = (date: string, startTime: string) => {
    const normTime = startTime.substring(0, 5)
    return slots.some(s => s.date === date && s.start_time.substring(0, 5) === normTime && s.is_blocked)
  }

  const getBookingsCount = (date: string) => {
    return slots.filter(s => s.date === date && s.is_booked).length
  }

  const isSpecializationMatch = (startTime: string) => {
    if (filter === 'All') return true
    const normTime = startTime.substring(0, 5)
    const dbSlot = slots.find(s => s.date === selectedDate && s.start_time.substring(0, 5) === normTime)
    if (!dbSlot) return true
    return dbSlot.specialization === filter
  }

  async function bookSlot(date: string, startTime: string, endTime: string) {
    const count = getBookingsCount(date)
    if (count >= 5) {
      toast.error('This day is fully booked. Please select another date.')
      return
    }

    const bookingKey = `${date}_${startTime}`
    setBooking(bookingKey)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login'); setBooking(null); return }

    const normTime = startTime.substring(0, 5)
    const dbSlot = slots.find(s => s.date === date && s.start_time.substring(0, 5) === normTime)
    let slotId = dbSlot?.id

    if (!slotId) {
      if (experts.length === 0) {
        toast.error('No experts available for booking.')
        setBooking(null)
        return
      }
      const selectedExpertId = experts[0].id

      const { data: newSlot, error: slotErr } = await supabase
        .from('consultation_slots')
        .insert({
          expert_id: selectedExpertId,
          date,
          start_time: startTime,
          end_time: endTime,
          is_booked: true,
          is_blocked: false,
          duration_minutes: 45,
          specialization: filter === 'All' ? 'Astrology' : filter
        })
        .select()
        .single()

      if (slotErr || !newSlot) {
        toast.error('Booking failed. Could not register slot.')
        setBooking(null)
        return
      }
      slotId = newSlot.id
      setSlots(prev => [...prev, newSlot as Slot])
    } else {
      const { error: slotUpdErr } = await supabase
        .from('consultation_slots')
        .update({ is_booked: true })
        .eq('id', slotId)

      if (slotUpdErr) {
        toast.error('Booking failed. Slot may be taken.')
        setBooking(null)
        return
      }
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, is_booked: true } : s))
    }

    const { error: bookErr } = await supabase
      .from('consultation_bookings')
      .insert({ user_id: user.id, slot_id: slotId, status: 'confirmed' })

    if (bookErr) {
      toast.error('Booking failed. Please try again.')
      await supabase.from('consultation_slots').update({ is_booked: false }).eq('id', slotId)
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, is_booked: false } : s))
      setBooking(null)
      return
    }

    toast.success('Consultation booked! Check your email for confirmation.')
    setBooking(null)

    const { data: bks } = await supabase.from('consultation_bookings')
      .select('*, consultation_slots(expert_id,date,start_time,end_time)')
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false })
    if (bks) setBookings(bks as unknown as Booking[])

    setTab('my')
  }

  const fmtTime = (t: string) => {
    if (!t) return t
    const [h, m] = t.split(':').map(Number)
    const p = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${p} IST`
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  const visiblePredefined = PREDEFINED_SLOTS.filter(ps => !isPast(selectedDate, ps.start) && isSpecializationMatch(ps.start))
  const dayBookingsCount = getBookingsCount(selectedDate)
  const isDayFull = dayBookingsCount >= 5

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2"><span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span> Consultations</h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">Book 1-on-1 sessions with Vedic experts · <span className="text-[var(--saffron)] font-semibold">5 PM – 11 PM IST · 45 min slots</span></p>
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
          {/* Specialization Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SPECIALIZATIONS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Date Selector slider */}
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide">
            {dates.map(dStr => {
              const [y, m, dNum] = dStr.split('-')
              const dateObj = new Date(+y, +m - 1, +dNum)
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const day = dateObj.getDate()
              const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
              const isSelected = selectedDate === dStr
              const count = getBookingsCount(dStr)
              const isFull = count >= 5

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[var(--indigo-deep)] text-white border-[var(--indigo-deep)] shadow-md scale-105'
                      : isFull
                      ? 'bg-red-50 border-red-100 text-red-700 opacity-80'
                      : 'bg-white border-[var(--warm-sand)] text-[var(--warm-charcoal)] hover:border-[var(--indigo-deep)]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{weekday}</span>
                  <span className="text-xl font-extrabold my-1">{day}</span>
                  <span className="text-[10px] font-semibold">{month}</span>
                  {isFull && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold mt-1 scale-90">FULL</span>}
                </button>
              )
            })}
          </div>

          {/* Capping / Kind message if full */}
          {isDayFull ? (
            <div className="card-divine p-12 text-center">
              <div className="flex justify-center mb-3">
                <span className="material-symbols-outlined text-[40px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
              </div>
              <p className="font-bold text-lg text-[var(--indigo-deep)] mb-2">Slots Fully Booked for This Date</p>
              <p className="text-sm text-[var(--warm-charcoal)]/75 max-w-md mx-auto leading-relaxed mb-3">
                To ensure deep, high-quality focus for every session, our Vedic experts limit their availability to exactly 5 consultations per day.
              </p>
              <p className="text-sm text-[var(--indigo-deep)] font-medium max-w-md mx-auto">
                We kindly invite you to select another date above, check back tomorrow, or write to us in the <Link href="/mailbox" className="text-[var(--terracotta)] hover:underline font-semibold">Mailbox</Link> if you have an urgent query.
              </p>
            </div>
          ) : visiblePredefined.length === 0 ? (
            <div className="card-divine p-8 text-center text-sm text-[var(--warm-charcoal)]/60">
              <span className="material-symbols-outlined text-[32px] text-[var(--warm-charcoal)]/40 block mb-2">bedtime</span>
              Sessions for this date are fully booked or have already concluded. Please select another date above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visiblePredefined.map(ps => {
                const isBooked = isSlotBooked(selectedDate, ps.start)
                const isBlocked = isSlotBlocked(selectedDate, ps.start)
                const isAvailable = !isBooked && !isBlocked

                return (
                  <div key={ps.start} className={`card-divine p-5 transition-all ${!isAvailable ? 'opacity-60 bg-gray-50' : 'hover:shadow-md'}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                        <span className="font-bold text-[var(--indigo-deep)]">{fmtTime(ps.start)}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isBooked
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isBlocked
                          ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isBooked ? 'Booked' : isBlocked ? 'Blocked' : 'Available'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mb-3">45 minutes session with a Vedic expert</p>
                    
                    {isAvailable && (
                      <button
                        onClick={() => bookSlot(selectedDate, ps.start, ps.end)}
                        disabled={booking === `${selectedDate}_${ps.start}`}
                        className="btn-divine w-full py-2.5 text-sm mt-3 disabled:opacity-50"
                      >
                        {booking === `${selectedDate}_${ps.start}` ? 'Booking...' : 'Book Now'}
                      </button>
                    )}
                  </div>
                )
              })}
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
              const isActive = activeCallBookingId === b.id
              return (
                <div key={b.id} className="card-divine overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white font-bold flex-shrink-0">
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[var(--indigo-deep)]">Expert Consultation</p>
                      <p className="text-sm text-[var(--warm-charcoal)]/60">{slot ? `${(() => { const [y,m,d] = slot.date.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-IN') })()}  at ${slot.start_time}` : new Date(b.booked_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-700'}`}>{b.status}</span>
                      {b.status === 'confirmed' && b.meeting_link && (
                        <a
                          href={b.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
                          Join via Google Meet
                        </a>
                      )}
                      {b.status === 'confirmed' && b.call_mode !== 'google_meet' && (
                        <button
                          onClick={() => setActiveCallBookingId(isActive ? null : b.id)}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${isActive ? 'bg-red-100 text-red-700' : 'bg-[var(--indigo-deep)] text-white hover:opacity-90'}`}
                        >
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isActive ? 'call_end' : 'videocam'}
                          </span>
                          {isActive ? 'Leave Call' : 'Join Call'}
                        </button>
                      )}
                    </div>
                  </div>
                  {b.meeting_link && b.status === 'confirmed' && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                        <span className="material-symbols-outlined text-blue-400 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        <p className="text-xs text-blue-600">Your expert has set up a Google Meet for this session. Click <strong>Join via Google Meet</strong> above to join.</p>
                      </div>
                    </div>
                  )}
                  {isActive && b.call_mode !== 'google_meet' && (
                    <div className="px-4 pb-4">
                      <ConsultationRoom
                        bookingId={b.id}
                        userName={profile?.full_name || 'User'}
                        slotDate={slot?.date}
                        slotTime={slot?.start_time}
                        onLeave={() => setActiveCallBookingId(null)}
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
