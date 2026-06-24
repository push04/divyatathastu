'use client'

import { useState } from 'react'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { useServicePayment } from '@/lib/hooks/useServicePayment'

const NAKSHATRA_INFO = [
  { title: 'Ardra Nakshatra', desc: 'The 6th of 27 nakshatras, ruled by Rudra (Shiva). Symbolized by a teardrop - the tear of transformation, renewal, and cosmic dissolution.' },
  { title: 'Ruling Deity', desc: 'Lord Rudra - the fierce and compassionate form of Shiva who destroys ignorance and grants deep healing.' },
  { title: 'Element', desc: 'Jala (Water) - the most receptive element, capable of holding and transmitting vibrational frequencies.' },
  { title: 'Shakti', desc: 'Yatna Shakti - the power of effort, striving, and achieving through challenge. Water charged at this time carries this quality.' },
]

const HOW_TO_USE = [
  { step: '01', title: 'Morning Ritual', desc: 'Drink 2–3 sips on an empty stomach while reciting "ॐ नमः शिवाय" 3 times. Pause, feel the intention.' },
  { step: '02', title: 'Space Purification', desc: 'Sprinkle drops in the corners of each room while chanting "ॐ" to clear stagnant energy from your home.' },
  { step: '03', title: 'Deity Abhishek', desc: 'Use for ritual bathing of your deity idol or Shivalinga on Mondays or during Rudrabhishek.' },
  { step: '04', title: 'Meditation Activation', desc: 'Apply a single drop to the Ajna chakra (third eye) before meditation to deepen inner clarity.' },
  { step: '05', title: 'Plant & Earth Offering', desc: 'Offer a few drops to your Tulsi plant or into running water as a gratitude offering to nature.' },
]

const BENEFITS = [
  { icon: 'local_fire_department', title: 'Karma Dissolution', desc: 'Dissolves accumulated negative karma accumulated over lifetimes through consistent use' },
  { icon: 'self_improvement', title: 'Meditation Deepening', desc: 'Measurably deepens meditation experiences and enhances mantra siddhi over 21-day sadhana' },
  { icon: 'home', title: 'Space Healing', desc: 'Clears Vastu doshas and negative energetic imprints from your home and workspace' },
  { icon: 'medical_services', title: 'Complementary Healing', desc: 'Supports recovery and healing alongside medical treatment (not a replacement)' },
  { icon: 'waves', title: 'Emotional Clarity', desc: 'Releases emotional blockages, grief, and suppressed traumas stored in the energy body' },
  { icon: 'auto_awesome', title: 'Mantra Amplification', desc: 'Amplifies the potency of your daily japa and sadhana practice when used before practice' },
]

export default function ArdraJalamPage() {
  const { items, loading } = useServiceItems('ardra_jalam')
  const [qty, setQty] = useState(1)
  const [booked, setBooked] = useState(false)
  const { pay, bookingId } = useServicePayment()

  const product = items[0]
  const ordering = !!bookingId

  function handleOrder() {
    if (!product) return
    const totalPrice = product.price! * qty
    pay(
      { id: product.id, title: product.title, price: totalPrice },
      {
        notes: `Qty: ${qty} bottle(s) of Ardra Jalam`,
        onSuccess: () => setBooked(true),
      }
    )
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero - water-inspired parchment gradient */}
      <div style={{ background: 'linear-gradient(160deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)', borderBottom: '2px solid rgba(16,185,129,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 bg-emerald-100 text-emerald-800 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span> Sacred Product · Limited Batches
              </div>
              <h1 className="text-4xl font-black text-[#065f46] mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Ardra Jalam
              </h1>
              <p className="text-lg text-[#065f46]/70 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sacred Healing Water
              </p>
              <p className="text-sm text-[#065f46]/60 mb-6 leading-relaxed">
                Charged under the divine frequencies of <strong>Ardra Nakshatra</strong> - the star of transformation ruled by Lord Rudra. Each batch is prepared through specific Vedic rituals, mantras, and cosmic alignment. Available only once every 27 days.
              </p>
              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <div>
                  {loading ? (
                    <div className="h-8 w-24 bg-white/50 rounded animate-pulse" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[var(--terracotta)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        ₹{(product?.price ?? 499).toLocaleString('en-IN')}
                      </span>
                      {product?.original_price && (
                        <span className="text-sm text-[var(--warm-charcoal)]/40 line-through">₹{product.original_price.toLocaleString('en-IN')}</span>
                      )}
                      <span className="text-xs text-[#065f46]/50">per bottle (500ml)</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Quantity + Order */}
              {!booked ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 p-1">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-[var(--warm-sand)] flex items-center justify-center font-bold text-[var(--indigo-deep)] hover:bg-emerald-100">−</button>
                    <span className="w-8 text-center font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(10, q + 1))} className="w-8 h-8 rounded-lg bg-[var(--warm-sand)] flex items-center justify-center font-bold text-[var(--indigo-deep)] hover:bg-emerald-100">+</button>
                  </div>
                  <button onClick={handleOrder} disabled={ordering || loading} className="flex-1 sm:flex-none btn-divine px-8 py-3 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {ordering ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order…</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span> Order Now · ₹{((product?.price ?? 499) * qty).toLocaleString('en-IN')}</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-100 text-emerald-800 rounded-2xl px-5 py-4">
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <p className="font-bold">Order Placed Successfully!</p>
                    <p className="text-xs mt-0.5">Our team will contact you within 24 hours to confirm delivery.</p>
                  </div>
                </div>
              )}
            </div>
            {/* Right - visual */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Bottle visual */}
                <div className="w-48 h-64 bg-gradient-to-b from-[#a7f3d0] via-[#6ee7b7] to-[#34d399] rounded-[40px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" style={{ clipPath: 'polygon(0 0, 30% 0, 30% 100%, 0 100%)' }} />
                  <div className="text-center text-white relative z-10">
                    <span className="material-symbols-outlined text-white block mb-2" style={{ fontSize: '3.5rem', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                    <div className="text-sm font-bold tracking-widest">ARDRA</div>
                    <div className="text-xs opacity-80 tracking-widest">JALAM</div>
                    <div className="text-[10px] opacity-60 mt-2">500ml</div>
                  </div>
                  {/* Water ripple effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 rounded-t-full" />
                </div>
                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 bg-[var(--terracotta)] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                  Limited
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2"><span className="material-symbols-outlined text-emerald-300 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Nakshatra science */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>The Science of Ardra Nakshatra</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mt-2">Why this nakshatra makes the water sacred</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NAKSHATRA_INFO.map(n => (
              <div key={n.title} className="bento-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[20px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span></div>
                <div>
                  <h3 className="font-bold text-[var(--indigo-deep)] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{n.title}</h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 20, padding: '40px' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Benefits</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mt-2">As per Vedic tradition and reported experiences</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="mb-3"><span className="material-symbols-outlined text-[24px] text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span></div>
                <h3 className="font-semibold text-[var(--indigo-deep)] mb-2 text-base">{b.title}</h3>
                <p className="text-xs text-[var(--warm-charcoal)]/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to use */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>How to Use</h2>
          </div>
          <div className="space-y-4">
            {HOW_TO_USE.map(h => (
              <div key={h.step} className="bento-card p-5 flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[var(--indigo-deep)] flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {h.step}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--indigo-deep)] mb-1">{h.title}</h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Long description from DB */}
        {product?.long_description && (
          <section className="bento-card p-8">
            <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Complete Product Details
            </h2>
            <div className="prose prose-sm max-w-none text-[var(--warm-charcoal)]/70 leading-relaxed whitespace-pre-wrap">
              {product.long_description}
            </div>
          </section>
        )}

        {/* Order CTA */}
        <section className="text-center py-8" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: 20 }}>
          <div className="mb-3 flex justify-center"><span className="material-symbols-outlined text-4xl" style={{ color: '#065f46', fontVariationSettings: "'FILL' 1" }}>water_drop</span></div>
          <h2 className="text-2xl font-bold text-[#065f46] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Begin?</h2>
          <p className="text-sm text-[#065f46]/60 mb-6 max-w-md mx-auto">Each batch is prepared only during Ardra Nakshatra - approximately once every 27 days. Order now to secure your bottle from the next batch.</p>
          {!booked ? (
            <button onClick={handleOrder} disabled={ordering || loading} className="btn-divine px-10 py-3.5 text-base font-semibold disabled:opacity-50 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
              Order Ardra Jalam · ₹{(product?.price ?? 499).toLocaleString('en-IN')}
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 bg-white text-emerald-700 rounded-full px-6 py-3 font-semibold shadow-md">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Order Placed - We'll Contact You Soon
            </div>
          )}
          <p className="text-xs text-[#065f46]/40 mt-4">Contact: 9858784784 · levitatelabs.online@gmail.com</p>
        </section>
      </div>
    </div>
  )
}
