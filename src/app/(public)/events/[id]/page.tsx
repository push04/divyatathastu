import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EventRegisterForm from './EventRegisterForm'

const FALLBACK_EVENTS: Record<string, any> = {
  '1': { id: '1', title: 'Navratri Special: Devi Sahasranam Chanting', type: 'online', start_date: '2025-10-02', start_time: '06:00', duration_minutes: 120, price: 0, max_participants: 500, current_participants: 347, description: 'Join 500+ devotees for a live Devi Sahasranam chanting session with Pt. Suresh Mishra. Free for all. Experience the divine vibrations of 1000 names of Goddess Durga in a collective virtual space.', category: 'Spiritual', location: 'Zoom + YouTube Live', host: 'Pt. Suresh Mishra', requirements: 'Zoom/YouTube app, quiet space', includes: ['Live recording access for 7 days', 'PDF of Devi Sahasranam text', 'Certificate of participation'] },
  '2': { id: '2', title: 'Kundli Reading Workshop — Beginners', type: 'online', start_date: '2025-10-15', start_time: '10:00', duration_minutes: 180, price: 999, max_participants: 50, current_participants: 32, description: 'Learn to read your own birth chart. Covers Lagna, Rashi, planets and basic dasha system. By end of workshop you will be able to interpret your own kundli and understand planetary influences on your life.', category: 'Astrology', location: 'Zoom', host: 'Dr. Rajesh Sharma', requirements: 'Notebook, your birth details (date/time/place)', includes: ['3-hour live session', 'Recorded video access for 30 days', 'Kundli workbook PDF', 'Practice exercises', 'Q&A session'] },
  '3': { id: '3', title: 'Vastu Walk: Transform Your Home', type: 'offline', start_date: '2025-10-20', start_time: '09:00', duration_minutes: 240, price: 2999, max_participants: 20, current_participants: 8, description: 'Physical Vastu consultation walk through your home/office with our expert. Get personalized remedies and placement suggestions. Limited to Mumbai area.', category: 'Vastu', location: 'Mumbai (On-site)', host: 'Ar. Priya Vastu', requirements: 'Home/office address in Mumbai, floor plan if available', includes: ['4-hour on-site visit', 'Detailed Vastu report', 'Remedy suggestions', 'Follow-up call within 7 days'] },
  '4': { id: '4', title: 'Numerology & Name Correction Masterclass', type: 'online', start_date: '2025-11-01', start_time: '11:00', duration_minutes: 150, price: 1499, max_participants: 100, current_participants: 67, description: 'Discover how to use numerology for business naming, baby naming and mobile number optimization. Learn to calculate life path, destiny and soul numbers.', category: 'Numerology', location: 'Zoom', host: 'Numerologist Kavita Jain', requirements: 'Your full name, date of birth', includes: ['2.5-hour live session', 'Personal numerology report', 'Name correction worksheet', 'Recorded access 30 days'] },
  '5': { id: '5', title: 'Chakra Healing Meditation Retreat', type: 'offline', start_date: '2025-11-08', start_time: '07:00', duration_minutes: 480, price: 4999, max_participants: 30, current_participants: 15, description: 'Full-day retreat covering all 7 chakras, kundalini yoga, mantra, crystal healing and Ayurvedic lunch. Transform your energy body in one powerful day.', category: 'Wellness', location: 'Rishikesh, Uttarakhand', host: 'Swami Ananda', requirements: 'Comfortable yoga clothes, open mind, transport to Rishikesh', includes: ['Full-day retreat 7am-3pm', 'Ayurvedic lunch and refreshments', 'Crystal set (take home)', 'Guided meditation audio files', 'Yoga mat provided'] },
  '6': { id: '6', title: 'Diwali: Lakshmi Puja Vidhi & Yantra Workshop', type: 'online', start_date: '2025-10-29', start_time: '17:00', duration_minutes: 90, price: 0, max_participants: 1000, current_participants: 621, description: 'Learn the correct Diwali Lakshmi puja vidhi, create your personal Yantra and perform the ritual together. Bring divine abundance into your home this Diwali.', category: 'Spiritual', location: 'YouTube Live', host: 'Acharya Deepak Shastri', requirements: 'Puja thali with basic items (list sent on registration)', includes: ['Live YouTube stream', 'Yantra creation guide PDF', 'Post-event recording access', 'Puja items checklist'] },
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const event = FALLBACK_EVENTS[id]
  return {
    title: event ? `${event.title} | MahaTathastu Events` : 'Event | MahaTathastu',
    description: event?.description?.slice(0, 155),
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let event = FALLBACK_EVENTS[id]

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('events').select('*').eq('id', id).single()
    if (data) event = data
  } catch {}

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4"><span className="material-symbols-outlined text-[64px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>temple_hindu</span></div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mb-2">Event not found</h1>
          <Link href="/events" className="btn-divine">Browse Events</Link>
        </div>
      </div>
    )
  }

  const spotsLeft = event.max_participants - event.current_participants
  const pct = Math.round((event.current_participants / event.max_participants) * 100)
  const categoryIcon = event.category === 'Astrology' ? 'brightness_7' : event.category === 'Numerology' ? 'tag' : event.category === 'Vastu' ? 'house' : event.category === 'Wellness' ? 'spa' : 'self_improvement'

  const CAT_COLOR: Record<string, string> = {
    Astrology: 'bg-violet-100 text-violet-700',
    Numerology: 'bg-purple-100 text-purple-700',
    Spiritual: 'bg-amber-100 text-amber-700',
    Vastu: 'bg-teal-100 text-teal-700',
    Wellness: 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, var(--plum) 55%, #1a0a2e 100%)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 text-[220px] leading-none text-white/[0.03] select-none pointer-events-none" style={{ fontFamily: 'serif' }}>ॐ</div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="icon-divine w-24 h-24 rounded-3xl shadow-2xl shadow-[var(--terracotta)]/30">
            <span className="material-symbols-outlined text-[52px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{categoryIcon}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${event.type === 'online' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>{event.type}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[event.category] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{event.category}</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--indigo-deep)] mb-2">{event.title}</h1>
            <p className="text-[var(--warm-charcoal)]/70 leading-relaxed">{event.description}</p>
          </div>

          {/* Meta */}
          <div className="card-divine p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Date & Time</p>
              <p className="font-semibold text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>{new Date(event.start_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-sm text-[var(--warm-charcoal)]/70 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{event.start_time} IST</p>
            </div>
            <div>
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Duration</p>
              <p className="font-semibold text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span>{event.duration_minutes >= 60 ? `${Math.floor(event.duration_minutes / 60)}h ${event.duration_minutes % 60 ? event.duration_minutes % 60 + 'm' : ''}` : `${event.duration_minutes}m`}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Location</p>
              <p className="font-semibold text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span> {event.location}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">Hosted by</p>
              <p className="font-semibold text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span> {event.host || 'MahaTathastu Team'}</p>
            </div>
          </div>

          {/* What's included */}
          {event.includes && (
            <div className="card-divine p-5">
              <h2 className="font-bold text-[var(--indigo-deep)] mb-3">What's Included</h2>
              <ul className="space-y-2">
                {event.includes.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--warm-charcoal)]/80">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {event.requirements && (
            <div className="card-divine p-5">
              <h2 className="font-bold text-[var(--indigo-deep)] mb-2">Requirements</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/70">{event.requirements}</p>
            </div>
          )}
        </div>

        {/* Right: registration card */}
        <div className="space-y-4">
          <div className="card-divine p-5 sticky top-24">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-[var(--indigo-deep)]">{event.price === 0 ? 'FREE' : `₹${event.price.toLocaleString('en-IN')}`}</p>
              {event.price > 0 && <p className="text-xs text-[var(--warm-charcoal)]/50">per person</p>}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--warm-charcoal)]/50">{event.current_participants}/{event.max_participants} registered</span>
                <span className={spotsLeft < 10 ? 'text-red-500 font-bold' : 'text-emerald-600'}>{spotsLeft} spots left</span>
              </div>
              <div className="bg-[var(--warm-sand)] rounded-full h-2">
                <div className="h-full bg-[var(--terracotta)] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {spotsLeft > 0 ? (
              <EventRegisterForm eventId={event.id} eventTitle={event.title} price={event.price} />
            ) : (
              <div className="text-center py-3 bg-red-50 rounded-lg text-red-600 text-sm font-medium">Event Full — Join Waitlist</div>
            )}

            <p className="text-xs text-center text-[var(--warm-charcoal)]/40 mt-3">Secure payment · Instant confirmation</p>
          </div>

          <Link href="/events" className="flex items-center justify-center gap-1 text-sm text-[var(--indigo-deep)] hover:underline"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to all events</Link>
        </div>
      </div>
    </div>
  )
}
