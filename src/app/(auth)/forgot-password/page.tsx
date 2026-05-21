'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen gradient-divine flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3 flex justify-center"><span className="material-symbols-outlined text-[40px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span></div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-white/60 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl flex justify-center"><span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span></div>
            <p className="text-white font-medium">Check your email!</p>
            <p className="text-white/60 text-sm">We've sent a password reset link to <strong>{email}</strong></p>
            <Link href="/login" className="btn-divine w-full py-2.5 block text-center">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[var(--saffron)]"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-divine w-full py-2.5 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-white/60">
              Remember it? <Link href="/login" className="text-[var(--saffron)] hover:underline">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
