'use client'

import { useState } from 'react'

export default function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')

  async function subscribe() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'footer-strip' }),
      })
      const data = await res.json()
      if (data.error === 'already_subscribed') setState('duplicate')
      else if (data.success) setState('success')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  if (state === 'success' || state === 'duplicate') {
    return (
      <div className="border-t border-[var(--outline-variant)]/20 bg-[var(--warm-sand)]/60 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm text-[var(--indigo-deep)]/70" style={{ fontFamily: "'Sora', sans-serif" }}>
            {state === 'duplicate' ? 'You are already subscribed to the Adhyatmic Digest.' : 'Subscribed. Your first digest arrives in the next 3-day cycle.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-[var(--outline-variant)]/20 bg-[var(--warm-sand)]/60 py-7 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

          {/* Copy */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="material-symbols-outlined text-[22px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <div>
              <p className="text-sm font-semibold text-[var(--indigo-deep)] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Adhyatmic Digest
              </p>
              <p className="text-xs text-[var(--indigo-deep)]/50 mt-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                Vedic wisdom delivered every 3 days
              </p>
            </div>
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && subscribe()}
              placeholder="your@email.com"
              className="flex-1 sm:w-64 text-sm px-3.5 py-2.5 rounded-lg outline-none border border-[var(--outline-variant)]/40 focus:border-[var(--terracotta)]/50 bg-white text-[var(--indigo-deep)] placeholder:text-[var(--indigo-deep)]/30 transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}
              disabled={state === 'loading'}
            />
            <button
              onClick={subscribe}
              disabled={state === 'loading' || !email}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--terracotta)', fontFamily: "'Sora', sans-serif" }}
            >
              {state === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

        </div>
        {state === 'error' && (
          <p className="text-xs text-red-500 mt-2 text-center sm:text-right" style={{ fontFamily: "'Sora', sans-serif" }}>
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  )
}
