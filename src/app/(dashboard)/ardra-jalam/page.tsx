'use client'

import Link from 'next/link'
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

const FALLBACK_PRICE = 499
const WHATSAPP_NUMBER = '919858784784'

export default function ArdraJalamPage() {
  const { items, loading, error } = useServiceItems('ardra_jalam')
  const [qty, setQty] = useState(1)
  const [booked, setBooked] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const { pay, NoticeModal } = useServicePayment()

  const product = items[0] ?? null
  const unitPrice = product?.price ?? FALLBACK_PRICE
  const totalPrice = unitPrice * qty

  async function handleOrder() {
    if (ordering || booked) return
    setOrdering(true)
    try {
      if (!product) {
        // No product in DB — fallback: open WhatsApp order
        const msg = encodeURIComponent(
          `Hi! I'd like to order ${qty} bottle(s) of Ardra Jalam. Please guide me on the next steps.`
        )
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
        setOrdering(false)
        return
      }
      await pay(
        { id: product.id, title: product.title, price: unitPrice },
        {
          quantity: qty,
          notes: `Qty: ${qty} bottle(s) of Ardra Jalam`,
          onSuccess: () => setBooked(true),
        }
      )
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try ordering via WhatsApp instead.")
    } finally {
      setOrdering(false)
    }
  }

  function handleWhatsAppOrder() {
    const msg = encodeURIComponent(
      `Hi! I'd like to order ${qty} bottle(s) of Ardra Jalam (₹${totalPrice.toLocaleString('en-IN')}). Please guide me.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero - water-inspired parchment gradient */}
      <div style={{ background: 'linear-gradient(160deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)', borderBottom: '2px solid rgba(16,185,129,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left text */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span> Sacred Product · Limited Batches
                </div>
                <Link
                  href="/ebooks"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-transparent font-bold text-xs uppercase tracking-widest transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', boxShadow: '0 0 12px rgba(212,160,23,0.25)' }}
                >
                  <span className="material-symbols-outlined text-[13px] shimmer-text" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                  <span className="shimmer-text" style={{ fontFamily: "'Playfair Display', serif" }}>Shop Sacred Ebooks</span>
                </Link>
              </div>
              <h1 className="text-4xl font-black mb-3 leading-tight shimmer-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                Ardra Jalam
              </h1>
              <p className="text-lg text-[#065f46]/70 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sacred Healing Water
              </p>
              <p className="text-sm text-[#065f46]/60 mb-6 leading-relaxed">
                Charged under the divine frequencies of <strong>Ardra Nakshatra</strong> - the star of transformation ruled by Lord Rudra. Each batch is prepared through specific Vedic rituals, mantras, and cosmic alignment. Available only once every 27 days.
              </p>
              {/* Price Block */}
              <div className="mb-6">
                {loading ? (
                  <div className="h-12 w-40 bg-white/50 rounded-xl animate-pulse" />
                ) : (
                  <div className="inline-flex flex-col gap-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-[var(--terracotta)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        ₹{unitPrice.toLocaleString('en-IN')}
                      </span>
                      {product?.original_price && (
                        <span className="text-xl text-[var(--warm-charcoal)]/40 line-through font-semibold">
                          ₹{product.original_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#065f46]/60 font-medium">per bottle (500ml)</span>
                      {product?.original_price && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Save ₹{(product.original_price - unitPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Scarcity / Urgency */}
              <div className="flex items-center gap-2 mb-5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Limited batch — only once every 27 days
              </div>

              {/* DB error warning */}
              {!loading && error && (
                <div className="mb-4 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2">
                  ⚠️ Product catalogue unavailable. You can still order via WhatsApp below.
                </div>
              )}

              {/* Quantity + Order */}
              {!booked ? (
                <div className="space-y-4">
                  {/* Qty selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#065f46]/60 uppercase tracking-wider">Qty:</span>
                    <div className="flex items-center gap-1 bg-white rounded-2xl border-2 border-emerald-300 p-1 shadow-sm">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-lg transition-colors"
                      >−</button>
                      <span className="w-10 text-center font-black text-[var(--indigo-deep)] text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{qty}</span>
                      <button
                        onClick={() => setQty(q => Math.min(10, q + 1))}
                        className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-lg transition-colors"
                      >+</button>
                    </div>
                    {qty > 1 && (
                      <span className="text-xs text-[#065f46]/50 font-medium">= ₹{totalPrice.toLocaleString('en-IN')} total</span>
                    )}
                  </div>

                  {/* PRIMARY CTA */}
                  <div className="relative">
                    {/* Glow ring */}
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 opacity-60 blur-md animate-pulse" />
                    <button
                      onClick={handleOrder}
                      disabled={ordering || loading}
                      className="relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.45)',
                      }}
                    >
                      {ordering ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Placing Order…</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                          <span>Order Now · ₹{totalPrice.toLocaleString('en-IN')}</span>
                          <span className="material-symbols-outlined text-[18px] ml-1">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* WhatsApp fallback */}
                  <button
                    onClick={handleWhatsAppOrder}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Or order via WhatsApp instead →
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-100 text-emerald-800 rounded-2xl px-5 py-4 border border-emerald-200">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <p className="font-black text-base">Order Placed Successfully! 🙏</p>
                    <p className="text-xs mt-0.5 text-emerald-700/70">Our team will contact you within 24 hours to confirm delivery.</p>
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

        {/* Order CTA Bottom */}
        <section className="relative text-center py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)', borderRadius: 24 }}>
          {/* Background shimmer */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

          <div className="relative z-10">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-emerald-300" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Begin?</h2>
            <p className="text-sm text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
              Each batch is prepared only during Ardra Nakshatra — approximately once every 27 days.
              Order now to secure your bottle from the next batch.
            </p>

            {!booked ? (
              <div className="flex flex-col items-center gap-4">
                {/* Glowing primary CTA */}
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 opacity-50 blur-lg animate-pulse" />
                  <button
                    onClick={handleOrder}
                    disabled={ordering || loading}
                    className="relative flex items-center gap-3 px-14 py-5 rounded-2xl font-black text-xl text-white transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                      boxShadow: '0 12px 40px rgba(52,211,153,0.5)',
                    }}
                  >
                    {ordering ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order…</>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
                        <span>Buy Ardra Jalam — ₹{unitPrice.toLocaleString('en-IN')}</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Trust signals */}
                <div className="flex items-center gap-6 text-white/50 text-xs">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">verified</span> Secure Payment</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">local_shipping</span> Pan India Delivery</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">stars</span> Vedic Certified</span>
                </div>

                <button onClick={handleWhatsAppOrder} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Order via WhatsApp instead
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 bg-white text-emerald-700 rounded-full px-8 py-4 font-black text-base shadow-xl">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Order Placed — We'll Contact You Soon!
              </div>
            )}

            <p className="text-xs text-white/30 mt-6">📞 9858784784 · info@mahatathastu.com</p>
          </div>
        </section>
      </div>
      {NoticeModal}
    </div>
  )
}
