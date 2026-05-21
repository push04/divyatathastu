'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function EventRegisterForm({ eventId, eventTitle, price }: { eventId: string; eventTitle: string; price: number }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setDone(true)
    toast.success('Registration confirmed! Check your email.')
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
        className="btn-divine w-full py-3 text-sm disabled:opacity-60"
      >
        {loading ? 'Processing...' : price === 0 ? 'Register Free' : `Pay ₹${price.toLocaleString('en-IN')} & Register`}
      </button>
    </form>
  )
}
