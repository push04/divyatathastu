'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: number
  product_type: string | null
  quantity: number
}

interface Product {
  id: string
  name: string
  price: number
  sale_price: number | null
  product_type: string | null
}

const TYPE_ICON: Record<string, string> = {
  ebook: 'auto_stories',
  report: 'description',
  service: 'spa',
  crystal: 'diamond',
  yantra: 'brightness_7',
}

function ItemIcon({ type }: { type: string | null }) {
  const icon = TYPE_ICON[type || ''] || 'shopping_bag'
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, var(--saffron), var(--terracotta))' }}>
      <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [processing, setProcessing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('dt_cart')
      if (!stored) { router.push('/shop'); return }
      const cartMap: [string, number][] = JSON.parse(stored)
      if (!cartMap.length) { router.push('/shop'); return }

      const ids = cartMap.map(([id]) => id)
      const { data: products } = await supabase.from('products').select('id,name,price,sale_price,product_type').in('id', ids)

      if (products) {
        const cartItems = cartMap.map(([id, qty]) => {
          const p = products.find((pr: Product) => pr.id === id)
          return p ? { id, name: p.name, price: p.sale_price ?? p.price, product_type: p.product_type, quantity: qty } : null
        }).filter(Boolean) as CartItem[]
        setItems(cartItems)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name,phone').eq('id', user.id).single()
        setProfile({ ...data, email: user.email })
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = Math.max(0, subtotal - discount)

  async function applyCoupon() {
    if (!couponCode) return
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single()
      if (!data) { toast.error('Invalid coupon code'); return }
      if (subtotal < data.min_order_amount) { toast.error(`Min order ₹${data.min_order_amount} required`); return }
      const d = data.discount_type === 'percentage' ? subtotal * data.discount_value / 100 : data.discount_value
      setDiscount(Math.min(d, subtotal))
      setCouponApplied(couponCode.toUpperCase())
      toast.success(`Coupon applied! ₹${Math.round(d)} off`)
    } catch {
      toast.error('Coupon not found')
    }
  }

  function removeCoupon() {
    setDiscount(0)
    setCouponApplied('')
    setCouponCode('')
  }

  async function handlePayment() {
    setProcessing(true)
    try {
      const res = await fetch('/api/payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, couponCode: couponCode || undefined }),
      })
      const orderData = await res.json()
      if (!res.ok) throw new Error(orderData.error)

      if (orderData.mock) {
        await fetch('/api/payment?action=verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderData.order_id,
            razorpay_payment_id: 'mock_pay_' + Date.now(),
            razorpay_signature: 'mock_sig',
            db_order_id: orderData.db_order_id,
          }),
        })
        localStorage.removeItem('dt_cart')
        toast.success('Order placed! (Test mode)')
        router.push('/orders')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.head.appendChild(script)
      await new Promise(resolve => { script.onload = resolve })

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'MahaTathastu',
        description: `Order · ${items.length} item${items.length > 1 ? 's' : ''}`,
        image: '/icon.svg',
        prefill: { name: profile?.full_name, email: profile?.email, contact: profile?.phone },
        theme: { color: '#2F2A44' },
        handler: async (response: any) => {
          await fetch('/api/payment?action=verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, db_order_id: orderData.db_order_id }),
          })
          localStorage.removeItem('dt_cart')
          toast.success('Payment successful! Order placed.')
          router.push('/orders')
        },
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SudarshanLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--kutch-white)' }}>

      {/* Sacred pattern background */}
      <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: 0 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" opacity="0.025">
          {Array.from({ length: 8 }, (_, r) =>
            Array.from({ length: 12 }, (_, c) => (
              <g key={`${r}-${c}`} transform={`translate(${c * 160 + (r % 2) * 80}, ${r * 140})`}>
                <polygon points="80,10 140,45 140,115 80,150 20,115 20,45" fill="none" stroke="#C67D53" strokeWidth="0.5" />
                <circle cx="80" cy="80" r="25" fill="none" stroke="#D4A017" strokeWidth="0.4" />
              </g>
            ))
          )}
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 lg:py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-[var(--warm-sand)] hover:bg-[var(--warm-sand)] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]">arrow_back</span>
          </button>
          <div className="flex items-center gap-3">
            <SudarshanLoader px={36} />
            <div>
              <h1 className="text-xl font-bold text-[var(--indigo-deep)] leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Secure Checkout
              </h1>
              <p className="text-xs text-[var(--warm-charcoal)]/50">MahaTathastu · Divine Store</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT - Items + Coupon */}
          <div className="lg:col-span-3 space-y-4">

            {/* Order items card */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--warm-sand)', background: 'white' }}>
              <div className="px-5 py-4 border-b border-[var(--warm-sand)]"
                style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, #3B2882 100%)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                    Your Order ({items.length} item{items.length !== 1 ? 's' : ''})
                  </h2>
                  <Link href="/shop" className="text-white/50 hover:text-white text-xs transition-colors">Edit cart</Link>
                </div>
              </div>

              <div className="divide-y divide-[var(--warm-sand)]">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <ItemIcon type={item.product_type} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--indigo-deep)] text-sm leading-snug">{item.name}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5 capitalize">{item.product_type?.replace('_', ' ') || 'Product'} · Qty {item.quantity}</p>
                    </div>
                    <p className="font-bold text-[var(--indigo-deep)] flex-shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon card */}
            <div className="rounded-2xl p-5" style={{ border: '1.5px solid var(--warm-sand)', background: 'white' }}>
              <h2 className="text-sm font-bold text-[var(--indigo-deep)] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
                Coupon / Promo Code
              </h2>

              {couponApplied ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">{couponApplied} applied</p>
                      <p className="text-xs text-emerald-600">−₹{discount.toLocaleString('en-IN')} discount</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-emerald-600 hover:text-red-500 font-medium transition-colors">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--warm-sand)] bg-[var(--kutch-white)] text-sm focus:outline-none focus:border-[var(--saffron)] uppercase tracking-wider font-medium placeholder:normal-case placeholder:font-normal"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: 'var(--warm-sand)', color: 'var(--indigo-deep)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--saffron)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--warm-sand)')}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: 'lock', label: '256-bit SSL', sub: 'Encrypted' },
                { icon: 'verified', label: 'Razorpay', sub: 'Secured' },
                { icon: 'support_agent', label: '24/7 Support', sub: 'Always here' },
              ].map(b => (
                <div key={b.icon} className="flex flex-col items-center p-3 rounded-xl text-center"
                  style={{ background: 'white', border: '1px solid var(--warm-sand)' }}>
                  <span className="material-symbols-outlined text-[20px] text-[var(--saffron)] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                  <p className="text-[11px] font-bold text-[var(--indigo-deep)]">{b.label}</p>
                  <p className="text-[10px] text-[var(--warm-charcoal)]/40">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT - Summary + Pay */}
          <div className="lg:col-span-2 space-y-4">

            {/* Order total card */}
            <div className="rounded-2xl overflow-hidden sticky top-6"
              style={{ border: '1.5px solid var(--warm-sand)', background: 'white' }}>

              {/* Card header - sacred saffron gradient */}
              <div className="px-5 py-5 text-center"
                style={{ background: 'linear-gradient(160deg, #2F2A44 0%, var(--terracotta) 100%)' }}>
                <div className="flex justify-center mb-2">
                  <SudarshanLoader px={40} />
                </div>
                <p className="text-white/60 text-[10px] tracking-[0.2em] uppercase mt-1">Order Total</p>
                <p className="text-4xl font-bold text-white mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  ₹{total.toLocaleString('en-IN')}
                </p>
                {discount > 0 && (
                  <p className="text-emerald-300 text-xs mt-1 font-semibold">You save ₹{discount.toLocaleString('en-IN')}</p>
                )}
              </div>

              {/* Breakdown */}
              <div className="px-5 py-4 space-y-2.5 border-b border-[var(--warm-sand)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--warm-charcoal)]/60">Subtotal</span>
                  <span className="font-medium text-[var(--indigo-deep)]">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
                      Coupon ({couponApplied})
                    </span>
                    <span className="font-medium text-emerald-600">−₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--warm-charcoal)]/60">GST / Taxes</span>
                  <span className="text-[var(--warm-charcoal)]/60 text-xs">Included</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-[var(--warm-sand)]">
                  <span className="text-[var(--indigo-deep)]">Amount to Pay</span>
                  <span className="text-[var(--terracotta)]">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Profile info if available */}
              {profile?.full_name && (
                <div className="px-5 py-3 border-b border-[var(--warm-sand)]">
                  <p className="text-[10px] text-[var(--warm-charcoal)]/40 uppercase tracking-wider mb-1.5">Billing to</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--indigo-deep)' }}>
                      {profile.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--indigo-deep)] leading-none">{profile.full_name}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5">{profile.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pay button */}
              <div className="p-5">
                <button
                  onClick={handlePayment}
                  disabled={processing || items.length === 0}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2.5"
                  style={{
                    background: processing ? '#9ca3af' : 'linear-gradient(135deg, #2F2A44, var(--terracotta))',
                    boxShadow: processing ? 'none' : '0 4px 20px rgba(198,125,83,0.35)',
                  }}
                >
                  {processing ? (
                    <><SudarshanLoader px={22} /><span>Processing…</span></>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>payment</span>
                      Pay ₹{total.toLocaleString('en-IN')} Securely
                    </>
                  )}
                </button>

                {/* Payment methods row */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
                    <span key={m} className="text-[9px] font-bold px-2 py-1 rounded bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50 tracking-wide">{m}</span>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="material-symbols-outlined text-[14px] text-[var(--warm-charcoal)]/30" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  <p className="text-[10px] text-[var(--warm-charcoal)]/30 text-center">
                    256-bit SSL · Razorpay PCI-DSS Level 1
                  </p>
                </div>
              </div>
            </div>

            {/* MahaTathastu commitment */}
            <div className="rounded-2xl p-4" style={{ border: '1.5px solid var(--warm-sand)', background: 'white' }}>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-[var(--saffron)] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <div>
                  <p className="text-xs font-bold text-[var(--indigo-deep)]">MahaTathastu Promise</p>
                  <p className="text-[11px] text-[var(--warm-charcoal)]/60 mt-0.5 leading-relaxed">
                    Authentic Vedic knowledge. If you're unsatisfied, contact us within 7 days for a full refund.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
