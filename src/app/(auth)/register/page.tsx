'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Shield, Users, Clock } from 'lucide-react'

const CROSS_HATCH = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12L12 0M-3 3L3 -3M9 15L15 9' stroke='white' stroke-width='0.5' stroke-opacity='0.04'/%3E%3C/svg%3E")`

const TRUST = [
  { Icon: CheckCircle, text: '14 personalized reports from your birth data' },
  { Icon: Shield, text: 'Your data stays private. No sharing. No ads.' },
  { Icon: Users, text: 'One account covers your entire family' },
  { Icon: Clock, text: 'Reports generated instantly after signup' },
]

const INPUT_BASE: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  color: 'var(--indigo-deep)',
  background: 'white',
  border: '1px solid var(--outline-variant, #D8D0C8)',
  borderRadius: '8px',
  padding: '10px 16px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function Field({
  label, field, type = 'text', placeholder, value, onChange, required = true, helper,
}: {
  label: string; field: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean; helper?: string;
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(28,30,74,0.7)', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={field === 'password' ? 8 : undefined}
        style={{
          ...INPUT_BASE,
          borderColor: focused ? 'var(--terracotta)' : 'var(--outline-variant, #D8D0C8)',
          boxShadow: focused ? '0 0 0 3px rgba(198,125,83,0.12)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {helper && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(28,30,74,0.35)', marginTop: '4px' }}>
          {helper}
        </p>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, phone: form.phone },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Check your email to verify your account!')
      router.push('/login')
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'var(--kutch-white)' }}>

      {/* ── Left panel ── */}
      <div
        className="lg:w-[48%] flex flex-col"
        style={{ background: 'var(--indigo-deep)', backgroundImage: CROSS_HATCH }}
      >
        {/* Mobile: compact header */}
        <div className="lg:hidden flex items-center gap-3 p-6" style={{ minHeight: '80px' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'var(--terracotta)' }}>ॐ</div>
          <span style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontWeight: 700, fontSize: '16px' }}>DivyaTathastu</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>India's holistic platform</span>
        </div>

        {/* Desktop: full panel */}
        <div className="hidden lg:flex flex-col h-full p-10">
          {/* Wordmark */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--terracotta)', fontSize: '14px' }}>ॐ</div>
            <span style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontWeight: 700, fontSize: '18px' }}>DivyaTathastu</span>
          </div>

          {/* Center content */}
          <div className="my-auto">
            <p
              className="mb-5"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '22px', color: 'rgba(255,255,255,0.8)', maxWidth: '300px', lineHeight: 1.5 }}
            >
              ॐ तत् सत् — That is Truth. Know thyself fully.
            </p>
            <div className="mb-8" style={{ height: '1px', width: '60px', background: 'rgba(212,160,67,0.3)' }} />

            <div className="space-y-1">
              {TRUST.map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-3 py-2">
                  <Icon size={16} color="var(--saffron)" className="flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial snippet */}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', color: 'rgba(212,160,67,0.2)', lineHeight: 1 }}>&ldquo;</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', maxWidth: '280px', marginTop: '4px' }}>
              The child development report for my son was spot-on. Best investment for our family.
            </p>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>
              — Priya S., Mumbai
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16" style={{ background: 'var(--kutch-white)' }}>
        <div className="w-full max-w-md">
          <h1
            className="mb-1"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '32px', color: 'var(--indigo-deep)' }}
          >
            Create your account
          </h1>
          <p className="mb-8" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(28,30,74,0.5)' }}>
            Your free Tathastu family account — add unlimited family members.
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 font-semibold transition-colors mb-6"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--indigo-deep)',
              background: 'white',
              border: '1px solid var(--outline-variant, #D8D0C8)',
              borderRadius: '8px',
              padding: '12px',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(28,30,74,0.3)'
              el.style.background = 'rgba(var(--warm-sand-rgb, 240,232,220),0.4)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.borderColor = 'var(--outline-variant, #D8D0C8)'
              el.style.background = 'white'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(28,30,74,0.1)' }} />
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '11px', color: 'rgba(28,30,74,0.3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(28,30,74,0.1)' }} />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Full Name" field="name" placeholder="Your name as it appears on your ID" value={form.name} onChange={v => update('name', v)} />
            <Field label="Email Address" field="email" type="email" placeholder="you@example.com" value={form.email} onChange={v => update('email', v)} />
            <Field
              label="Phone / WhatsApp" field="phone" type="tel"
              placeholder="+91 98765 43210"
              value={form.phone} onChange={v => update('phone', v)} required={false}
              helper="Used only for WhatsApp report delivery. Never shared."
            />
            <Field label="Password" field="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={v => update('password', v)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold transition-opacity mt-2"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                background: 'var(--terracotta)',
                color: 'white',
                borderRadius: '8px',
                padding: '13px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating account…' : 'Create My Family Account'}
            </button>
          </form>

          <p className="text-center mt-5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(28,30,74,0.5)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>Sign in →</Link>
          </p>

          <p className="text-center mt-6" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(28,30,74,0.35)' }}>
            By creating an account, you agree to our Terms and Privacy Policy. We never sell your data.
          </p>
        </div>
      </div>

    </div>
  )
}
