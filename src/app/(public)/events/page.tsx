import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Events | MahaTathastu - Spiritual Events & Workshops',
  description: 'Join live webinars, workshops and spiritual events on astrology, numerology, meditation and Vedic sciences.',
}
export const revalidate = 3600

const FALLBACK_EVENTS = [
  { id: '1', title: 'Navratri Special: Devi Sahasranam Chanting', type: 'online', start_date: '2025-10-02', start_time: '06:00', duration_minutes: 120, price: 0, max_participants: 500, current_participants: 347, description: 'Join 500+ devotees for a live Devi Sahasranam chanting session with Pt. Suresh Mishra. Free for all.', category: 'Spiritual', location: 'Zoom + YouTube Live' },
  { id: '2', title: 'Kundli Reading Workshop - Beginners', type: 'online', start_date: '2025-10-15', start_time: '10:00', duration_minutes: 180, price: 999, max_participants: 50, current_participants: 32, description: 'Learn to read your own birth chart. Covers Lagna, Rashi, planets and basic dasha system.', category: 'Astrology', location: 'Zoom' },
  { id: '3', title: 'Vastu Walk: Transform Your Home', type: 'offline', start_date: '2025-10-20', start_time: '09:00', duration_minutes: 240, price: 2999, max_participants: 20, current_participants: 8, description: 'Physical Vastu consultation walk through your home/office with our expert. Limited to Mumbai area.', category: 'Vastu', location: 'Mumbai (On-site)' },
  { id: '4', title: 'Numerology & Name Correction Masterclass', type: 'online', start_date: '2025-11-01', start_time: '11:00', duration_minutes: 150, price: 1499, max_participants: 100, current_participants: 67, description: 'Discover how to use numerology for business naming, baby naming and mobile number optimization.', category: 'Numerology', location: 'Zoom' },
  { id: '5', title: 'Chakra Healing Meditation Retreat', type: 'offline', start_date: '2025-11-08', start_time: '07:00', duration_minutes: 480, price: 4999, max_participants: 30, current_participants: 15, description: 'Full-day retreat covering all 7 chakras, kundalini yoga, mantra, crystal healing and Ayurvedic lunch.', category: 'Wellness', location: 'Rishikesh, Uttarakhand' },
  { id: '6', title: 'Diwali: Lakshmi Puja Vidhi & Yantra Workshop', type: 'online', start_date: '2025-10-29', start_time: '17:00', duration_minutes: 90, price: 0, max_participants: 1000, current_participants: 621, description: 'Learn the correct Diwali Lakshmi puja vidhi, create your personal Yantra and perform the ritual together.', category: 'Spiritual', location: 'YouTube Live' },
]

const TYPE_BADGE: Record<string, string> = {
  online: 'bg-violet-100 text-violet-700',
  offline: 'bg-emerald-100 text-emerald-700',
}
const CAT_COLOR: Record<string, string> = {
  Astrology: 'bg-violet-100 text-violet-700',
  Numerology: 'bg-purple-100 text-purple-700',
  Spiritual: 'bg-amber-100 text-amber-700',
  Vastu: 'bg-teal-100 text-teal-700',
  Wellness: 'bg-pink-100 text-pink-700',
}

export default async function EventsPage() {
  let events = FALLBACK_EVENTS
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('events').select('*').gte('start_date', new Date().toISOString().split('T')[0]).order('start_date').limit(12)
    if (data?.length) events = data as any
  } catch {}

  return (
    <div className="min-h-screen">
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Sacred Gatherings</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Spiritual Events</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-lg leading-relaxed">Live workshops, retreats and sacred ceremonies - online and offline</p>
        </div>
      </section>

      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e: any) => {
            const spotsLeft = e.max_participants - e.current_participants
            const pct = Math.round((e.current_participants / e.max_participants) * 100)
            return (
              <div key={e.id} className="card-divine flex flex-col overflow-hidden">
                <div className={`h-28 flex items-center justify-center relative overflow-hidden ${
                  e.category === 'Astrology' ? 'bg-gradient-to-br from-indigo-700 to-violet-900' :
                  e.category === 'Numerology' ? 'bg-gradient-to-br from-purple-700 to-indigo-900' :
                  e.category === 'Vastu' ? 'bg-gradient-to-br from-teal-600 to-emerald-900' :
                  e.category === 'Wellness' ? 'bg-gradient-to-br from-rose-600 to-pink-900' :
                  'bg-gradient-to-br from-[var(--terracotta)] to-[var(--plum)]'
                }`}>
                  <span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {e.category === 'Astrology' ? 'brightness_7' : e.category === 'Numerology' ? 'tag' : e.category === 'Vastu' ? 'house' : e.category === 'Wellness' ? 'spa' : 'self_improvement'}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[e.type] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{e.type}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[e.category] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{e.category}</span>
                  </div>
                  <h3 className="font-bold text-[var(--indigo-deep)] mb-1 leading-snug">{e.title}</h3>
                  <p className="text-xs text-[var(--warm-charcoal)]/60 mb-3 flex-1 line-clamp-2">{e.description}</p>
                  <div className="space-y-1 text-xs text-[var(--warm-charcoal)]/60 mb-3">
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">calendar_today</span>{new Date(e.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {e.start_time}</p>
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">timer</span>{e.duration_minutes >= 60 ? `${Math.floor(e.duration_minutes / 60)}h ${e.duration_minutes % 60 ? e.duration_minutes % 60 + 'm' : ''}` : `${e.duration_minutes}m`}</p>
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{e.location}</p>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--warm-charcoal)]/50">{e.current_participants}/{e.max_participants} registered</span>
                      <span className={spotsLeft < 10 ? 'text-red-500 font-bold' : 'text-emerald-600'}>{spotsLeft} spots left</span>
                    </div>
                    <div className="bg-[var(--warm-sand)] rounded-full h-1.5"><div className="h-full bg-[var(--terracotta)] rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[var(--indigo-deep)]">{e.price === 0 ? 'FREE' : `₹${e.price.toLocaleString('en-IN')}`}</span>
                    <Link href={`/events/${e.id}`} className="btn-divine text-xs px-4 py-2">Register</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
