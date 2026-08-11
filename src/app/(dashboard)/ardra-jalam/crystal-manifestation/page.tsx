'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { useServicePayment } from '@/lib/hooks/useServicePayment'

import Icon from '@/components/ui/Icon'
const WHATSAPP_NUMBER = '919858784784'
const FALLBACK_PRICE = 1299

const INTENTIONS = [
  { id: 'abundance', label: 'Abundance & Wealth', icon: 'payments', stone: 'Citrine + Pyrite', color: '#B45309', soft: '#FEF3C7' },
  { id: 'love', label: 'Love & Harmony', icon: 'favorite', stone: 'Rose Quartz + Rhodonite', color: '#BE185D', soft: '#FCE7F3' },
  { id: 'protection', label: 'Protection & Grounding', icon: 'shield', stone: 'Black Tourmaline + Hematite', color: '#374151', soft: '#F3F4F6' },
  { id: 'clarity', label: 'Clarity & Focus', icon: 'visibility', stone: 'Clear Quartz + Fluorite', color: '#0E7490', soft: '#CFFAFE' },
  { id: 'healing', label: 'Healing & Calm', icon: 'spa', stone: 'Amethyst + Green Aventurine', color: '#6D28D9', soft: '#EDE9FE' },
  { id: 'courage', label: 'Courage & Willpower', icon: 'local_fire_department', stone: 'Carnelian + Tiger Eye', color: '#C2410C', soft: '#FFEDD5' },
]

const PROCESS = [
  {
    step: '01',
    title: 'You State the Sankalpa',
    desc: 'A single intention, written in your own words. Not a wish list. One clear resolve, phrased in the present tense, is what the stone will hold.',
  },
  {
    step: '02',
    title: 'The Stone Is Matched',
    desc: 'We map your intention against your birth number, ruling planet and dominant chakra, then select the primary stone and its supporting companion.',
  },
  {
    step: '03',
    title: 'Cleansing in Nakshatra Jal',
    desc: 'Every crystal arrives carrying the imprint of whoever handled it. It is submerged in Nakshatra Jal and rock salt for a full night to strip that residue.',
  },
  {
    step: '04',
    title: 'The 21-Day Charge',
    desc: 'The stone is placed at the centre of its matching yantra. The relevant beeja mantra is chanted over it daily for twenty-one consecutive days.',
  },
  {
    step: '05',
    title: 'Sealing and Dispatch',
    desc: 'Sealed with kumkum, wrapped in unbleached cotton, and dispatched with your handwritten sankalpa card and the daily activation vidhi.',
  },
]

const KIT_CONTENTS = [
  { icon: 'diamond', title: 'Primary Crystal', desc: 'Your main programmed stone, tumbled or raw depending on the intention it carries.' },
  { icon: 'category', title: 'Companion Stone', desc: 'A supporting crystal that stabilises the primary stone and keeps the charge steady.' },
  { icon: 'draw', title: 'Sankalpa Card', desc: 'Your intention, handwritten in Devanagari and English, on handmade paper.' },
  { icon: 'grid_on', title: 'Pocket Yantra', desc: 'The copper yantra the stone was charged upon, for you to recharge it monthly at home.' },
  { icon: 'menu_book', title: 'Activation Vidhi', desc: 'A printed step-by-step method: morning activation, mantra count, and the monthly recharge cycle.' },
  { icon: 'water_drop', title: 'Nakshatra Jal Vial', desc: 'A 30ml vial of the same charged water used in cleansing, for your own re-cleansing at home.' },
]

const TRUTHS = [
  'A crystal holds an intention. It does not replace the work that intention demands of you.',
  'This is a spiritual practice, not medical or financial treatment. Never stop prescribed care.',
  'The charge weakens with handling. Recharge monthly on the yantra, as the vidhi describes.',
  'One kit carries one sankalpa. Changing your intention means starting the cycle again.',
]

export default function CrystalManifestationPage() {
  const { items, loading, error } = useServiceItems('crystal_manifestation')
  const [intention, setIntention] = useState<string>('')
  const [sankalpa, setSankalpa] = useState('')
  const [booked, setBooked] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const { pay, NoticeModal } = useServicePayment()

  const product = items[0] ?? null
  const price = product?.price ?? FALLBACK_PRICE
  const chosen = INTENTIONS.find(i => i.id === intention)

  function orderMessage() {
    return [
      `Namaste! I'd like to order a Crystal Manifestation kit.`,
      chosen ? `Intention: ${chosen.label} (${chosen.stone})` : null,
      sankalpa.trim() ? `My sankalpa: ${sankalpa.trim()}` : null,
      `Price: ₹${price.toLocaleString('en-IN')}`,
    ].filter(Boolean).join('\n')
  }

  async function handleOrder() {
    if (ordering || booked) return
    if (!intention) {
      alert('Please choose an intention first so we know which stone to prepare.')
      return
    }
    setOrdering(true)
    try {
      if (!product) {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage())}`, '_blank')
        return
      }
      await pay(
        { id: product.id, title: product.title, price },
        {
          quantity: 1,
          notes: [
            `Crystal Manifestation kit`,
            chosen ? `Intention: ${chosen.label}` : '',
            sankalpa.trim() ? `Sankalpa: ${sankalpa.trim().slice(0, 300)}` : '',
          ].filter(Boolean).join(' | '),
          onSuccess: () => setBooked(true),
        }
      )
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try ordering via WhatsApp instead.')
    } finally {
      setOrdering(false)
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage())}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)', borderBottom: '2px solid rgba(124,58,237,0.25)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-14">
          <Link
            href="/ardra-jalam"
            className="inline-flex items-center gap-1.5 mb-6 text-sm font-semibold text-violet-800/70 hover:text-violet-900 transition-colors"
          >
            <Icon name="arrow_back" size={18} />
            Ardra Jalam
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 uppercase tracking-widest mb-4">
                <Icon name="diamond" size={14} />
                Programmed to One Intention
              </div>

              <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight" style={{ fontFamily: "var(--font-display)", color: '#5b21b6' }}>
                Crystal Manifestation
              </h1>
              <p className="text-xl text-violet-900/70 mb-3" style={{ fontFamily: "var(--font-display)" }}>
                स्फटिक संकल्प
              </p>
              <p className="text-base sm:text-lg text-violet-900/75 mb-6 leading-relaxed">
                A crystal that has been cleansed in <strong>Nakshatra Jal</strong>, charged on its matching yantra
                through a twenty-one day mantra cycle, and programmed to hold one clearly stated sankalpa. Prepared to order,
                never from stock.
              </p>

              <div className="mb-6">
                {loading ? (
                  <div className="h-14 w-44 bg-white/50 rounded-xl animate-pulse" />
                ) : (
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-5xl font-black text-violet-700" style={{ fontFamily: "var(--font-display)" }}>
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {product?.original_price && (
                      <span className="text-xl text-[var(--text-muted)] line-through font-semibold">
                        ₹{product.original_price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-base text-violet-900/70 font-medium w-full sm:w-auto">complete kit, delivered across India</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Prepared to order · allow 21 days for the charge cycle
              </div>

              {!loading && error && (
                <div className="mt-4 text-sm bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg px-4 py-3">
                  Product catalogue unavailable right now. You can still order via WhatsApp below.
                </div>
              )}
            </div>

            {/* Crystal visual */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-52 h-64 flex items-center justify-center shadow-2xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(150deg, #ddd6fe 0%, #a78bfa 45%, #7c3aed 100%)',
                    clipPath: 'polygon(50% 0%, 100% 26%, 100% 74%, 50% 100%, 0% 74%, 0% 26%)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/25 to-transparent" style={{ clipPath: 'polygon(0 0, 34% 0, 34% 100%, 0 100%)' }} />
                  <div className="text-center text-white relative z-10 px-4">
                    <Icon name="diamond" className="text-white block mb-2" />
                    <div className="text-sm font-bold tracking-widest">CRYSTAL</div>
                    <div className="text-xs opacity-85 tracking-widest">MANIFESTATION</div>
                    <div className="text-xs opacity-70 mt-2">21-day charge</div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-1 bg-[var(--terracotta)] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                  Made to Order
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-12 space-y-14 sm:space-y-16">

        {/* ── Choose intention + sankalpa ── */}
        <section id="order">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>
              Choose Your Intention
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mt-2 max-w-xl mx-auto leading-relaxed">
              One kit holds one sankalpa. Pick the direction you are actually working in right now.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {INTENTIONS.map(i => {
              const active = intention === i.id
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setIntention(i.id)}
                  aria-pressed={active}
                  className="text-left rounded-2xl p-5 transition-all active:scale-[0.99]"
                  style={{
                    background: active ? i.soft : '#ffffff',
                    border: active ? `2px solid ${i.color}` : '2px solid var(--surface-container)',
                    boxShadow: active ? `0 8px 24px ${i.color}33` : '0 2px 8px rgba(47,42,68,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name={i.icon} size={26} style={{ color: i.color }} />
                    {active && (
                      <Icon name="check_circle" size={22} className="ml-auto" style={{ color: i.color }} />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--indigo-deep)] mb-1">{i.label}</h3>
                  <p className="text-base text-[var(--text-secondary)] leading-relaxed">{i.stone}</p>
                </button>
              )
            })}
          </div>

          <div className="bento-card p-5 sm:p-7">
            <label htmlFor="sankalpa" className="block text-lg font-bold text-[var(--indigo-deep)] mb-2">
              Write your sankalpa <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
            </label>
            <p className="text-base text-[var(--text-secondary)] mb-4 leading-relaxed">
              One sentence, present tense, in your own words. This is written onto the card that ships with your kit.
              Leave it blank and our team will help you phrase it before preparation begins.
            </p>
            <textarea
              id="sankalpa"
              value={sankalpa}
              onChange={e => setSankalpa(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="e.g. My work is steady, my mind is calm, and my family is provided for."
              className="w-full rounded-xl border-2 border-[var(--surface-container)] focus:border-violet-500 focus:outline-none px-4 py-3 text-base leading-relaxed resize-y"
            />
            <p className="text-sm text-[var(--text-muted)] mt-2 text-right">{sankalpa.length}/300</p>
          </div>
        </section>

        {/* ── Order CTA ── */}
        <section
          className="relative text-center py-10 sm:py-12 px-5 sm:px-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 60%, #6d28d9 100%)', borderRadius: 24 }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Begin the Cycle
            </h2>
            <p className="text-lg text-[var(--text-on-dark)] mb-3 max-w-lg mx-auto leading-relaxed">
              Your twenty-one days of charging start the day after your order is confirmed.
            </p>
            <p className="text-base text-[var(--text-on-dark-secondary)] mb-8">
              {chosen ? `Selected: ${chosen.label} · ${chosen.stone}` : 'Choose an intention above to continue'}
            </p>

            {!booked ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleOrder}
                  disabled={ordering || loading || !intention}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)',
                    boxShadow: '0 12px 40px rgba(167,139,250,0.45)',
                  }}
                >
                  {ordering ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <Icon name="shopping_bag" size={24} />
                      Order Kit · ₹{price.toLocaleString('en-IN')}
                    </>
                  )}
                </button>

                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[var(--text-on-dark-secondary)] text-sm">
                  <span className="flex items-center gap-1"><Icon name="verified" size={16} /> Secure Payment</span>
                  <span className="flex items-center gap-1"><Icon name="local_shipping" size={16} /> Pan India Delivery</span>
                  <span className="flex items-center gap-1"><Icon name="handshake" size={16} /> Prepared by Hand</span>
                </div>

                <button onClick={handleWhatsApp} className="inline-flex items-center gap-2 text-base font-semibold text-violet-200 hover:text-white transition-colors">
                  <Icon name="chat" size={18} />
                  Order via WhatsApp instead
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 bg-white text-violet-700 rounded-full px-7 py-4 font-black text-base shadow-xl">
                <Icon name="check_circle" size={26} />
                Order placed. We will confirm your sankalpa within 24 hours.
              </div>
            )}
          </div>
        </section>

        {/* ── Process ── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>
              How Your Crystal Is Prepared
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mt-2">Five stages, twenty-one days, nothing skipped</p>
          </div>
          <div className="space-y-4">
            {PROCESS.map(p => (
              <div key={p.step} className="bento-card p-5 sm:p-6 flex items-start gap-4 sm:gap-5">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', fontFamily: "var(--font-mono)" }}
                >
                  {p.step}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[var(--indigo-deep)] mb-1.5">{p.title}</h3>
                  <p className="text-base text-[var(--text-secondary)] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Kit contents ── */}
        <section style={{ background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)', borderRadius: 20 }} className="p-6 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>
              What Arrives at Your Door
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mt-2">Six pieces, packed in unbleached cotton</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {KIT_CONTENTS.map(k => (
              <div key={k.title} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="mb-3">
                  <Icon name={k.icon} size={26} className="text-violet-700" />
                </div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-lg">{k.title}</h3>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed">{k.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Honest expectations ── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>
              What We Will Not Claim
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mt-2 max-w-xl mx-auto leading-relaxed">
              Read this before you order. If any of it changes your mind, that is the right outcome.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRUTHS.map(t => (
              <div key={t} className="flex items-start gap-3 bg-white rounded-2xl border border-[var(--surface-container)] p-5">
                <Icon name="info" size={22} className="text-[var(--terracotta)] shrink-0 mt-0.5" />
                <p className="text-base text-[var(--text-primary)] leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Long description from DB ── */}
        {product?.long_description && (
          <section className="bento-card p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--indigo-deep)] mb-5" style={{ fontFamily: "var(--font-display)" }}>
              Complete Product Details
            </h2>
            <div className="max-w-none text-base text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {product.long_description}
            </div>
          </section>
        )}

        {/* ── Cross-link ── */}
        <section className="text-center">
          <Link
            href="/ardra-jalam/nakshatra-jal"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-base text-emerald-800 bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Icon name="water_drop" size={22} />
            Looking for charged water instead? See Nakshatra Jal
          </Link>
          <p className="text-sm text-[var(--text-muted)] mt-6">9858784784 · info@mahatathastu.com</p>
        </section>
      </div>

      {NoticeModal}
    </div>
  )
}
