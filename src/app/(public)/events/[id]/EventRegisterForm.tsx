'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'
import { usePaymentNotice } from '@/lib/hooks/usePaymentNotice'

export default function EventRegisterForm({ eventId, eventTitle, eventDate, price }: { eventId: string; eventTitle: string; eventDate?: string; price: number }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { confirmPayment, NoticeModal } = usePaymentNotice()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return
    if (price > 0) {
      confirmPayment(eventTitle, price, () => doSubmit())
      return
    }
    doSubmit()
  }

  async function doSubmit() {
    setLoading(true)

    try {
      if (price === 0) {
        // Free event — register directly
        const res = await fetch('/api/events/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, name, email, phone, eventTitle, eventDate }),
        })
        if (res.ok) {
          setDone(true)
          toast.success('Registration confirmed! Check your email.')
        } else {
          toast.error('Registration failed. Please try again.')
        }
      } else {
        // Paid event — Razorpay checkout
        const orderRes = await fetch('/api/events/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, name, email, phone, amount: price }),
        })
        const orderData = await orderRes.json()
        if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed')

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        document.head.appendChild(script)
        await new Promise(resolve => { script.onload = resolve })

        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: price * 100,
          currency: 'INR',
          order_id: orderData.order_id,
          name: 'MahaTathastu',
          description: eventTitle,
          prefill: { name, email, contact: phone },
          theme: { color: '#2F2A44' },
          handler: async (response: any) => {
            await fetch('/api/events/payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'verify', eventId, name, email, phone, eventTitle, eventDate, ...response }),
            })
            setDone(true)
            toast.success('Payment successful! You are registered.')
          },
        })
        rzp.open()
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-[36px] text-emerald-500 mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <p className="font-bold text-[var(--indigo-deep)]">You're registered!</p>
        <p className="text-xs text-[var(--warm-charcoal)]/60 mt-1">Confirmation sent to {email}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {NoticeModal}
      <input
        type="text"
        placeholder="Full name *"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="w-full px-3 py-2 border border-[var(--warm-sand)] rounded-lg text-sm focus:outline-none focus:border-[var(--indigo-deep)]"
      />
      <input
        type="email"
        placeholder="Email address *"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border border-[var(--warm-sand)] rounded-lg text-sm focus:outline-none focus:border-[var(--indigo-deep)]"
      />
      <input
        type="tel"
        placeholder="WhatsApp number (optional)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full px-3 py-2 border border-[var(--warm-sand)] rounded-lg text-sm focus:outline-none focus:border-[var(--indigo-deep)]"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-divine w-full py-3 text-sm disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading
          ? <><SudarshanLoader px={18} /><span>Processing…</span></>
          : price === 0
            ? 'Register Free'
            : `Pay ₹${price.toLocaleString('en-IN')} & Register`}
      </button>
    </form>
  )
}
