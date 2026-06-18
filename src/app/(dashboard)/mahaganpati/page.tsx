'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const GANESH_ATTRIBUTES = [
  { sanskrit: 'विघ्नहर्ता', english: 'Vighnaharta', meaning: 'Remover of all obstacles from life, business, and relationships' },
  { sanskrit: 'बुद्धिप्रद', english: 'Buddhiprada', meaning: 'Bestower of intelligence, clarity, and right decision-making' },
  { sanskrit: 'सिद्धिदाता', english: 'Siddhidaata', meaning: 'Giver of success and accomplishment in all endeavors' },
  { sanskrit: 'मंगलमूर्ति', english: 'Mangalmurti', meaning: 'Auspicious form that blesses new beginnings and ventures' },
]

const PUJA_BENEFITS = [
  { icon: 'rocket_launch', title: 'New Beginnings', desc: 'Start any venture - business, marriage, home, education - under Ganesh\'s divine protection.' },
  { icon: 'lock_open', title: 'Remove Blockages', desc: 'Dissolve obstacles in career, finances, relationships, and spiritual progress.' },
  { icon: 'menu_book', title: 'Enhanced Learning', desc: 'Students receive Ganesh\'s special blessings for clarity, retention, and exam success.' },
  { icon: 'work', title: 'Business Prosperity', desc: 'Invite Riddhi (wealth) and Siddhi (success) - Ganesh\'s consorts - into your ventures.' },
  { icon: 'home', title: 'Vastu Harmony', desc: 'Ganesh puja in the northeast (Ishaan corner) of your home amplifies positive Vastu energy.' },
  { icon: 'volunteer_activism', title: 'Spiritual Progress', desc: 'As the first deity worshipped in all Hindu rituals, Ganesh opens the path to higher realms.' },
]

export default function MahaganpatiPage() {
  const { items, loading } = useServiceItems('mahaganpati')
  const [booking, setBooking] = useState<string | null>(null)
  const [booked, setBooked] = useState<Set<string>>(new Set())
  const [preferred, setPreferred] = useState<Record<string, string>>({})

  async function bookService(item: typeof items[number]) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login to book'); return }
    setBooking(item.id)
    const { error } = await (supabase as any).from('service_bookings').insert({
      service_item_id: item.id, user_id: user.id,
      status: 'pending', amount: item.price ?? 0, payment_status: 'pending',
      preferred_date: preferred[item.id] || null,
      notes: `Puja: ${item.title}${preferred[item.id] ? ` - Preferred date: ${preferred[item.id]}` : ''}`,
    })
    if (error) toast.error('Booking failed. Try again.')
    else {
      toast.success(`Booked "${item.title}"! Our pandit will contact you to finalize the muhurta.`)
      setBooked(s => new Set([...s, item.id]))
    }
    setBooking(null)
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)', borderBottom: '2px solid rgba(234,88,12,0.25)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs text-[#9a3412] tracking-[0.4em] uppercase mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Sacred Puja Service</p>
              <h1 className="text-5xl font-black text-[#431407] mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Mahaganpati
              </h1>
              <p className="text-lg text-[#9a3412] mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ
              </p>
              <p className="text-sm text-[#7c2d12]/70 mb-8 leading-relaxed">
                Invoke the blessings of Mahaganpati - the supreme form of Lord Ganesha - through authentic Vedic puja performed by trained priests. Remove every obstacle from your path and invite divine grace into your life, business, and home.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a href="#pujas" className="btn-divine px-7 py-3 inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">temple_hindu</span>
                  Book a Puja
                </a>
                <a href="tel:9858784784" className="btn-outline-divine px-7 py-3 inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Call Pandit
                </a>
              </div>
            </div>
            {/* Ganesh visual */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-56 h-56 rounded-full flex items-center justify-center shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #fed7aa, #fdba74, #fb923c)', border: '4px solid rgba(234,88,12,0.3)' }}>
                  <span className="text-8xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-lg font-black text-[#9a3412]" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ गं गणपतये नमः</p>
                </div>
                <div className="absolute -top-3 -right-3 bg-[var(--terracotta)] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                  Pandit Guided
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Names of Ganesh */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>The Forms of Mahaganpati</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mt-2">Each attribute invoked for specific blessings</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GANESH_ATTRIBUTES.map(a => (
              <div key={a.english} className="bento-card p-5 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid rgba(234,88,12,0.2)' }}>
                  <span className="text-[#9a3412] font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-bold text-[#cc2200]" style={{ fontFamily: "'Playfair Display', serif" }}>{a.sanskrit}</h3>
                    <span className="text-xs text-[var(--warm-charcoal)]/50">({a.english})</span>
                  </div>
                  <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{a.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Puja offerings from DB */}
        <section id="pujas">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Sacred Puja Offerings</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">All pujas performed with proper Vedic procedures and personalized sankalpa</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-52 bg-[var(--warm-sand)] rounded-2xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bento-card p-10 text-center">
              <p className="text-[var(--warm-charcoal)]/40">Puja schedules coming soon. Contact us to book directly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {items.map(item => (
                <div key={item.id} className="bento-card p-6 flex flex-col hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {item.is_live && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">Live</span>}
                      {item.badge_text && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${item.badge_color || '#D4A017'}20`, color: item.badge_color || '#D4A017' }}>{item.badge_text}</span>}
                    </div>
                    {item.duration && <span className="text-[11px] text-[var(--warm-charcoal)]/40 shrink-0" style={{ fontFamily: "'Sora', sans-serif" }}>{item.duration}</span>}
                  </div>
                  <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                  {item.subtitle && <p className="text-sm text-[var(--saffron)] font-semibold mb-3">{item.subtitle}</p>}
                  {item.description && <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed mb-4 flex-1">{item.description}</p>}

                  {/* Date preference */}
                  {!booked.has(item.id) && item.is_bookable && (
                    <div className="mb-4">
                      <label className="text-xs text-[var(--warm-charcoal)]/50 mb-1 block">Preferred date (optional)</label>
                      <input type="date" value={preferred[item.id] || ''} onChange={e => setPreferred(p => ({ ...p, [item.id]: e.target.value }))}
                        className="w-full border border-[var(--warm-sand)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--outline-variant)]/20">
                    {item.price ? (
                      <div>
                        <span className="font-bold text-[var(--terracotta)] text-xl">₹{item.price.toLocaleString('en-IN')}</span>
                        {item.original_price && <span className="text-xs line-through text-[var(--warm-charcoal)]/30 ml-2">₹{item.original_price.toLocaleString('en-IN')}</span>}
                      </div>
                    ) : <span className="text-sm text-emerald-600 font-semibold">Daan Based</span>}
                    {booked.has(item.id) ? (
                      <span className="text-sm px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓ Booked</span>
                    ) : (
                      <button onClick={() => bookService(item)} disabled={booking === item.id || !item.is_bookable}
                        className="btn-divine px-6 py-2.5 disabled:opacity-40 inline-flex items-center gap-1.5">
                        {booking === item.id ? 'Booking…' : item.is_bookable ? (
                          <><span className="material-symbols-outlined text-[16px]">temple_hindu</span>Book Puja</>
                        ) : 'Notify Me'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Benefits */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Blessings of Mahaganpati</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PUJA_BENEFITS.map(b => (
              <div key={b.title} className="bento-card p-5 text-center hover:shadow-md transition-all">
                <div className="mb-3"><span className="material-symbols-outlined text-[30px] text-[#9a3412]" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span></div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{b.title}</h3>
                <p className="text-xs text-[var(--warm-charcoal)]/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chaturthi callout */}
        <section className="text-center py-10 rounded-2xl" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '2px solid rgba(234,88,12,0.2)' }}>
          <div className="text-5xl mb-3 font-black text-[#9a3412]" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ</div>
          <h2 className="text-2xl font-bold text-[#431407] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Chaturthi - The Auspicious Day</h2>
          <p className="text-sm text-[#7c2d12]/70 mb-6 max-w-lg mx-auto">
            Every Chaturthi tithi (4th lunar day) is sacred to Ganesha. Book your puja on a Chaturthi for maximum divine blessings. Our pandits are available for home visits and online guided pujas.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="tel:9858784784" className="btn-divine px-7 py-3 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">call</span>Book Home Puja: 9858784784
            </a>
            <Link href="/consultations" className="btn-outline-divine px-7 py-3">Ask Pandit Online</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
