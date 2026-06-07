'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const DOSHAS = [
  {
    name: 'Vata', sanskrit: 'वात', element: 'Air + Ether', planet: 'Rahu / Saturn',
    qualities: 'Mobile, dry, cold, subtle, rough', color: '#7c3aed',
    imbalance: 'Anxiety, dryness, constipation, insomnia, joint pain',
    balance: 'Warm oils, routine, grounding foods, Ashwagandha',
  },
  {
    name: 'Pitta', sanskrit: 'पित्त', element: 'Fire + Water', planet: 'Sun / Mars',
    qualities: 'Hot, sharp, penetrating, oily, liquid', color: '#dc2626',
    imbalance: 'Inflammation, anger, acid reflux, skin issues, perfectionism',
    balance: 'Cooling foods, moonbathing, Shatavari, avoiding midday sun',
  },
  {
    name: 'Kapha', sanskrit: 'कफ', element: 'Earth + Water', planet: 'Moon / Jupiter',
    qualities: 'Heavy, slow, cool, oily, smooth, stable', color: '#059669',
    imbalance: 'Weight gain, congestion, lethargy, attachment, depression',
    balance: 'Exercise, fasting, Trikatu, stimulating herbs, warmth',
  },
]

const MEDICAL_ASTRO_HOUSES = [
  { house: '1st', title: 'Constitution & Overall Vitality', desc: 'Lagna and Lagna lord reveal the fundamental body type, immunity, and life force.' },
  { house: '6th', title: 'Disease & Chronic Conditions', desc: 'The house of illness — its lord and occupants show the type and nature of health challenges.' },
  { house: '8th', title: 'Chronic & Transformative Illness', desc: 'Longevity, accidents, surgeries, and deep transformative health events.' },
  { house: '12th', title: 'Hospitalization & Hidden Ailments', desc: 'Hidden diseases, foreign travel for medical care, and spiritual causes of illness.' },
]

export default function AyurvedaPage() {
  const { items, loading } = useServiceItems('ayurveda')
  const [booking, setBooking] = useState<string | null>(null)
  const [booked, setBooked] = useState<Set<string>>(new Set())
  const [activeDosha, setActiveDosha] = useState(0)

  async function bookService(item: typeof items[number]) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login to book'); return }
    setBooking(item.id)
    const { error } = await supabase.from('service_bookings').insert({
      service_item_id: item.id, user_id: user.id,
      status: 'pending', amount: item.price ?? 0, payment_status: 'pending',
    })
    if (error) toast.error('Booking failed. Try again.')
    else {
      toast.success(`Booked! Our Ayurvedic practitioner will contact you within 24 hours.`)
      setBooked(s => new Set([...s, item.id]))
    }
    setBooking(null)
  }

  const d = DOSHAS[activeDosha]

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)', borderBottom: '2px solid rgba(5,150,105,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #065f46, #047857)' }}>🌿</div>
          <p className="text-xs text-[#065f46] tracking-[0.4em] uppercase mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Ancient Science of Life & Healing</p>
          <h1 className="text-5xl font-black text-[#052e16] mb-3 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>AYURVEDA</h1>
          <p className="text-sm text-[#065f46] tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>& Medical Astrology</p>
          <p className="text-base text-[var(--warm-charcoal)]/70 max-w-2xl mx-auto leading-relaxed mt-4">
            The sister sciences of Ayurveda (science of life) and Jyotish (planetary medicine) together offer the most complete system for health, healing, and longevity in human history. Know your prakriti, understand your planetary health signatures, and receive personalized healing protocols.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Dosha explorer */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>The Three Doshas</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mt-2">Your constitution is determined by the balance of these three biological forces</p>
          </div>
          <div className="flex gap-2 mb-6 justify-center">
            {DOSHAS.map((dos, i) => (
              <button key={dos.name} onClick={() => setActiveDosha(i)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${activeDosha === i ? 'text-white shadow-md' : 'bg-white border text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}
                style={activeDosha === i ? { background: dos.color } : {}}>
                {dos.sanskrit} {dos.name}
              </button>
            ))}
          </div>
          <div className="bento-card p-8" style={{ borderTop: `4px solid ${d.color}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-[var(--warm-charcoal)]/40 uppercase tracking-widest mb-1">Element</p>
                <p className="font-semibold text-[var(--indigo-deep)]">{d.element}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--warm-charcoal)]/40 uppercase tracking-widest mb-1">Ruling Planet(s)</p>
                <p className="font-semibold text-[var(--indigo-deep)]">{d.planet}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--warm-charcoal)]/40 uppercase tracking-widest mb-1">Qualities</p>
                <p className="font-semibold text-[var(--indigo-deep)]">{d.qualities}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: d.color }}>When Imbalanced</p>
                <p className="text-sm text-[var(--warm-charcoal)]/70 leading-relaxed">{d.imbalance}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">How to Balance</p>
                <p className="text-sm text-[var(--warm-charcoal)]/70 leading-relaxed">{d.balance}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services from DB */}
        <section id="consultations">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Consultation Services</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Personalized Ayurvedic & medical astrology consultations</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-[var(--warm-sand)] rounded-2xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bento-card p-10 text-center">
              <p className="text-[var(--warm-charcoal)]/40">Services launching soon. Call us to book directly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {items.map(item => (
                <div key={item.id} className="bento-card p-6 flex flex-col hover:shadow-lg transition-all hover:-translate-y-0.5 border-l-4" style={{ borderLeftColor: '#059669' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-1.5">
                      {item.badge_text && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${item.badge_color || '#059669'}20`, color: item.badge_color || '#059669' }}>{item.badge_text}</span>}
                    </div>
                    {item.duration && <span className="text-[11px] text-[var(--warm-charcoal)]/40 shrink-0">{item.duration}</span>}
                  </div>
                  <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                  {item.subtitle && <p className="text-sm text-emerald-700 font-semibold mb-2">{item.subtitle}</p>}
                  {item.description && <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed mb-4 flex-1">{item.description}</p>}
                  {item.instructor_name && <p className="text-xs text-[var(--warm-charcoal)]/50 mb-4">👤 {item.instructor_name}</p>}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--outline-variant)]/20">
                    {item.price ? (
                      <div>
                        <span className="font-bold text-[var(--terracotta)] text-xl">₹{item.price.toLocaleString('en-IN')}</span>
                        {item.original_price && <span className="text-xs line-through text-[var(--warm-charcoal)]/30 ml-2">₹{item.original_price.toLocaleString('en-IN')}</span>}
                      </div>
                    ) : <span className="text-sm text-emerald-600 font-semibold">Free</span>}
                    {booked.has(item.id) ? (
                      <span className="text-sm px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓ Booked</span>
                    ) : (
                      <button onClick={() => bookService(item)} disabled={booking === item.id || !item.is_bookable}
                        className="btn-divine px-5 py-2 disabled:opacity-40 text-sm inline-flex items-center gap-1.5">
                        {booking === item.id ? 'Booking…' : item.is_bookable ? (
                          <><span className="material-symbols-outlined text-[15px]">event</span>Book Now</>
                        ) : 'Notify Me'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Medical Astrology */}
        <section style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 20, padding: '40px', border: '1px solid rgba(5,150,105,0.2)' }}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#052e16]" style={{ fontFamily: "'Playfair Display', serif" }}>Medical Astrology — Reading Health in the Stars</h2>
            <p className="text-sm text-[#065f46]/70 mt-2">Jyotish reveals the karmic basis of health conditions — and the planetary remedies</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MEDICAL_ASTRO_HOUSES.map(h => (
              <div key={h.house} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{h.house}</div>
                  <h3 className="font-bold text-[#052e16] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{h.title}</h3>
                </div>
                <p className="text-xs text-[#065f46]/70 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#065f46]/60 mt-6 max-w-2xl mx-auto">
            A combined Ayurvedic-Jyotish consultation identifies not just the physical symptoms but the karmic root — enabling deeper, lasting healing through planetary remedies, herbs, and lifestyle corrections.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-sm text-[var(--warm-charcoal)]/60">Ready to understand your body's constitutional blueprint?</p>
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
