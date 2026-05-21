'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  product_type: string | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('dt_cart')
      if (!stored) { router.push('/shop'); return }

      const cartMap: [string, number][] = JSON.parse(stored)
      if (!cartMap.length) { router.push('/shop'); return }

      const ids = cartMap.map(([id]) => id)
      const { data: products } = await supabase.from('products').select('id,name,price,product_type').in('id', ids)

      if (products) {
        const cartItems = cartMap.map(([id, qty]) => {
          const p = products.find((pr: Product) => pr.id === id)
          return p ? { id, name: p.name, price: p.price, product_type: p.product_type, quantity: qty } : null
        }).filter(Boolean) as CartItem[]
        setItems(cartItems)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name,phone').eq('id', user.id).single()
        setProfile({ ...data, email: user.email })
      }
    }
    load()
  }, [])

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
      toast.success(`Coupon applied! ₹${Math.round(d)} off`)
    } catch {
      toast.error('Coupon not found')
    }
  }

  async function handlePayment() {
    setProcessing(true)
    try {
      // Create order
      const res = await fetch('/api/payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, couponCode: couponCode || undefined }),
      })
      const orderData = await res.json()
      if (!res.ok) throw new Error(orderData.error)

      if (orderData.mock) {
        // Mock mode — simulate payment
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
        toast.success('Order placed successfully! (Test mode)')
        router.push('/orders')
        return
      }

      // Load Razorpay
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.head.appendChild(script)

      await new Promise(resolve => { script.onload = resolve })

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'DivyaTathastu',
        description: `Order for ${items.length} item(s)`,
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Shop</button>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-2">Checkout</h1>
      </div>

      {/* Order items */}
      <div className="card-divine p-5 space-y-3">
        <h2 className="font-bold text-[var(--indigo-deep)] mb-3">Order Summary</h2>
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-[var(--indigo-deep)]">{item.name}</p>
              <p className="text-[var(--warm-charcoal)]/50">Qty: {item.quantity}</p>
            </div>
            <p className="font-bold text-[var(--indigo-deep)]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
          </div>
        ))}

        <div className="border-t border-[var(--warm-sand)] pt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--warm-charcoal)]/60">Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
          {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
          <div className="flex justify-between text-base font-bold text-[var(--indigo-deep)] pt-1 border-t border-[var(--warm-sand)]">
            <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="card-divine p-5">
        <h2 className="font-bold text-[var(--indigo-deep)] mb-3">Coupon Code</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)] uppercase"
          />
          <button onClick={applyCoupon} className="px-4 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm font-medium hover:bg-[var(--warm-sand)] transition-all">Apply</button>
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={processing || items.length === 0}
          className="btn-divine w-full py-4 text-base font-bold disabled:opacity-50"
        >
          {processing ? (
            <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>hourglass_empty</span> Processing...</span>
          ) : (
            <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span> Pay ₹{total.toLocaleString('en-IN')}</span>
          )}
        </button>
        <p className="text-center text-xs text-[var(--warm-charcoal)]/40 inline-flex items-center justify-center gap-1">Secured by Razorpay · 256-bit SSL encryption <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span></p>
      </div>
    </div>
  )
}
