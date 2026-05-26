'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { FileText, Users, MapPin, CalendarDays } from 'lucide-react'

const CROSS_HATCH = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12L12 0M-3 3L3 -3M9 15L15 9' stroke='white' stroke-width='0.5' stroke-opacity='0.04'/%3E%3C/svg%3E")`

const AWAITING = [
  { Icon: FileText,      text: 'Your personalized reports, always ready' },
  { Icon: Users,         text: 'Your family members and their kundlis' },
  { Icon: MapPin,        text: 'Saved mandirs for your next pilgrimage' },
  { Icon: CalendarDays,  text: 'Daily panchang tailored to your location' },
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
  label, type = 'text', placeholder, value, onChange,
}: {
  label: string; type?: string; placeholder: string
  value: string; onChange: (v: string) => void
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
        required
        style={{
          ...INPUT_BASE,
          borderColor: focused ? 'var(--terracotta)' : 'var(--outline-variant, #D8D0C8)',
          boxShadow: focused ? '0 0 0 3px rgba(198,125,83,0.12)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') {
          router.push('/admin')
          return
        }
      }
      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
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
          <span style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontWeight: 700, fontSize: '16px' }}>MahaTathastu</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>India's holistic platform</span>
        </div>

        {/* Desktop: full panel */}
        <div className="hidden lg:flex flex-col h-full p-10">
          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--terracotta)', fontSize: '14px' }}>ॐ</div>
            <span style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontWeight: 700, fontSize: '18px' }}>MahaTathastu</span>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center py-8">
            {/* Decorative ॐ */}
            <div style={{ fontFamily: 'serif', fontSize: '72px', lineHeight: 1, color: 'rgba(198,125,83,0.15)', marginBottom: '28px', userSelect: 'none' }}>ॐ</div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '26px', color: 'white', lineHeight: 1.25, marginBottom: '8px' }}>
              Welcome back.
            </h2>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '290px', lineHeight: 1.65, marginBottom: '28px' }}>
              Your karmic journey is preserved. Your family, reports, and sacred path — all waiting for you.
            </p>

            <div style={{ height: '1px', width: '48px', background: 'rgba(212,160,67,0.35)', marginBottom: '28px' }} />

            <div className="space-y-1">
              {AWAITING.map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3 py-2">
                  <Icon size={15} color="var(--saffron)" className="flex-shrink-0" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: 'rgba(212,160,67,0.18)', lineHeight: 1 }}>&ldquo;</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', maxWidth: '260px', marginTop: '4px' }}>
              I check my family's panchang every morning before leaving home. It has become a ritual.
            </p>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '8px' }}>
              — Ramesh T., Ahmedabad
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
            Sign in
          </h1>
          <p className="mb-8" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(28,30,74,0.5)' }}>
            Continue your journey on MahaTathastu.
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
              e.currentTarget.style.borderColor = 'rgba(28,30,74,0.3)'
              e.currentTarget.style.background = 'rgba(240,232,220,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--outline-variant, #D8D0C8)'
              e.currentTarget.style.background = 'white'
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

          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
            <Field label="Password" type="password" placeholder="Your password" value={password} onChange={setPassword} />

            <div style={{ textAlign: 'right' }}>
              <Link href="/forgot-password" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--terracotta)', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold transition-opacity"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                background: 'var(--terracotta)',
                color: 'white',
                borderRadius: '8px',
                padding: '13px',
                opacity: loading ? 0.7 : 1,
                marginTop: '4px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(28,30,74,0.5)' }}>
            No account?{' '}
            <Link href="/register" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>Register free →</Link>
          </p>

          <p className="text-center mt-6" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(28,30,74,0.3)' }}>
            Protected by Supabase Auth · Your data is never sold.
          </p>
        </div>
      </div>

    </div>
  )
}
