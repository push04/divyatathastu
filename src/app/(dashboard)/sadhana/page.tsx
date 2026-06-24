'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { useServicePayment } from '@/lib/hooks/useServicePayment'

const SADHANA_PILLARS = [
  { icon: 'brightness_5', title: 'Mantra Deeksha', desc: 'Receive a personalized beej mantra determined by your birth nakshatra, ruling planet, and current dasha. A mantra given in proper initiation carries 1000× the power.' },
  { icon: 'air', title: 'Dhyana (Meditation)', desc: 'Learn chakra-based visualization techniques combined with pranayama - specific to your planetary constitution from the birth chart.' },
  { icon: 'self_improvement', title: 'Japa Sadhana', desc: 'Structured daily japa practice with a personal mala energized during auspicious muhurta. Includes mantras for each day of the week by ruling planet.' },
  { icon: 'dark_mode', title: 'Nakshatric Timing', desc: 'Each sadhana is timed to begin on the most auspicious nakshatra for your chart - maximizing cosmic resonance and spiritual upliftment.' },
]

const SADHANA_JOURNEY = [
  { day: 'Day 1', title: 'Sankalpa & Initiation', desc: 'Take the formal vow (sankalpa) with a witness and receive your personalized mantra and practice plan.' },
  { day: 'Days 2–7', title: 'Foundation Practice', desc: 'Establish the daily routine: 108 japa each morning, pranayama, and brief meditation. Build the habit.' },
  { day: 'Days 8–14', title: 'Deepening', desc: 'Increase to 216 japa. Add visualization of the ruling deity. Energy begins to stabilize.' },
  { day: 'Days 15–20', title: 'Purification', desc: 'The sadhana enters a purification phase - old patterns and mental impressions surface and dissolve.' },
  { day: 'Day 21', title: 'Purnabhishek', desc: 'Completion ritual with Havan/Homa offering 1/10th of the total japa count into sacred fire.' },
]

export default function SadhanaPage() {
  const { items, loading } = useServiceItems('sadhana')
  const [booked, setBooked] = useState<Set<string>>(new Set())
  const { pay, bookingId: booking } = useServicePayment()

  function bookService(item: typeof items[number]) {
    pay({ id: item.id, title: item.title, price: item.price ?? 0 }, {
      onSuccess: (id) => setBooked(s => new Set([...s, id])),
    })
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #fdf6e3 0%, #fef3c7 50%, #fde68a 100%)', borderBottom: '2px solid rgba(217,119,6,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #78350f, #92400e)' }}><span className="material-symbols-outlined text-white" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>self_improvement</span></div>
          <p className="text-xs text-[#92400e] tracking-[0.4em] uppercase mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Divine Practice • Inner Transformation</p>
          <h1 className="text-5xl font-black text-[#1c1917] mb-3 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>SAADHANA</h1>
          <p className="text-sm text-[#78350f] tracking-[0.2em] uppercase mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            सा धनं यस्मिन् लक्ष्मीः स्थिरा - "Wealth is stable in one whose practice is firm"
          </p>
          <p className="text-base text-[var(--warm-charcoal)]/70 max-w-2xl mx-auto leading-relaxed">
            Personalized Vedic spiritual practices - mantra deeksha, guided sadhana programs, and japa siddhi - tailored to your birth chart, nakshatra, and current planetary period. Transform karma through disciplined daily practice.
          </p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            <a href="#programs" className="btn-divine px-8 py-3 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">self_improvement</span>
              Begin Sadhana
            </a>
            <Link href="/consultations" className="btn-outline-divine px-8 py-3 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">event</span>
              Consult Acharya
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* 4 Pillars */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Four Pillars of Vedic Saadhana</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mt-2">Each element works in concert to purify the body, mind, and consciousness</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SADHANA_PILLARS.map(p => (
              <div key={p.title} className="bento-card p-6 flex gap-4 items-start hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #fef9c3, #fde68a)' }}><span className="material-symbols-outlined text-[24px] text-[#92400e]" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span></div>
                <div>
                  <h3 className="font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{p.title}</h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Programs from DB */}
        <section id="programs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Sadhana Programs</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Book your personalized spiritual practice initiation</p>
            </div>
            <span className="text-xs text-[var(--warm-charcoal)]/40">{items.length} available</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-[var(--warm-sand)] rounded-2xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bento-card p-10 text-center">
              <p className="text-[var(--warm-charcoal)]/40">Programs launching soon. Contact us to register interest.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="bento-card p-6 flex flex-col hover:shadow-lg transition-all hover:-translate-y-0.5">
                  {item.image_url && (
                    <div className="w-full h-36 rounded-xl overflow-hidden mb-4">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {item.is_live && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Live</span>}
                      {item.badge_text && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${item.badge_color || '#D4A017'}20`, color: item.badge_color || '#D4A017' }}>{item.badge_text}</span>}
                    </div>
                    {item.duration && <span className="text-[11px] text-[var(--warm-charcoal)]/40" style={{ fontFamily: "'Sora', sans-serif" }}>{item.duration}</span>}
                  </div>
                  <h3 className="font-bold text-[var(--indigo-deep)] mb-2 flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                  {item.subtitle && <p className="text-xs text-[var(--saffron)] font-semibold mb-2">{item.subtitle}</p>}
                  {item.description && <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed mb-4 flex-1">{item.description}</p>}
                  {item.instructor_name && <p className="text-xs text-[var(--warm-charcoal)]/50 mb-4">Guided by {item.instructor_name}</p>}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--outline-variant)]/20">
                    {item.price ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[var(--terracotta)] text-lg">₹{item.price.toLocaleString('en-IN')}</span>
                        {item.original_price && <span className="text-xs line-through text-[var(--warm-charcoal)]/30">₹{item.original_price.toLocaleString('en-IN')}</span>}
                      </div>
                    ) : <span className="text-sm text-emerald-600 font-semibold">Free</span>}
                    {booked.has(item.id) ? (
                      <span className="text-xs px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓ Booked</span>
                    ) : (
                      <button onClick={() => bookService(item)} disabled={booking === item.id || !item.is_bookable}
                        className="btn-divine text-sm px-5 py-2 disabled:opacity-40">
                        {booking === item.id ? 'Booking…' : item.is_bookable ? 'Book Now' : 'Notify Me'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 21-Day Journey */}
        <section style={{ background: 'linear-gradient(135deg, #fdf6e3, #fef9c3)', borderRadius: 20, padding: '40px', border: '1px solid rgba(217,119,6,0.3)' }}>
          <div className="text-center mb-8">
            <div className="text-3xl mb-2 text-[#D4A017]" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ</div>
            <h2 className="text-2xl font-bold text-[#1c1917]" style={{ fontFamily: "'Playfair Display', serif" }}>The 21-Day Sadhana Arc</h2>
            <p className="text-sm text-[#78350f]/70 mt-1">Every powerful sadhana follows this ancient structure</p>
          </div>
          <div className="space-y-3">
            {SADHANA_JOURNEY.map((j, i) => (
              <div key={j.day} className="flex gap-4 items-start">
                <div className="w-16 shrink-0 text-right">
                  <span className="text-xs font-bold text-[#D4A017]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{j.day}</span>
                </div>
                <div className="w-px bg-[#D4A017]/30 self-stretch shrink-0" />
                <div className="pb-4">
                  <p className="font-semibold text-[#1c1917] text-sm mb-0.5">{j.title}</p>
                  <p className="text-xs text-[#78350f]/60 leading-relaxed">{j.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-sm text-[var(--warm-charcoal)]/60">Ready to begin your spiritual transformation? Speak with our acharyas.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="tel:9858784784" className="btn-divine inline-flex items-center gap-2 px-6 py-3">
              <span className="material-symbols-outlined text-[18px]">call</span>9858784784
            </a>
            <Link href="/consultations" className="btn-outline-divine inline-flex items-center gap-2 px-6 py-3">
              <span className="material-symbols-outlined text-[18px]">event</span>Book Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
