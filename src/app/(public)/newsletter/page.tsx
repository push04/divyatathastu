'use client'

import { useState } from 'react'
import SudarshanLoader from '@/components/SudarshanLoader'
import Link from 'next/link'

import Icon from '@/components/ui/Icon'
const BENEFITS = [
  {
    icon: 'brightness_7',
    title: 'Adhyatmic Digest Every 3 Days',
    desc: 'Spiritual insights on Vedic Astrology, Nakshatra Wisdom, Vastu, Ayurveda, Mantra Science, and more - rotating themes so every digest is fresh.',
  },
  {
    icon: 'self_improvement',
    title: 'Daily Mantra & Practical Tip',
    desc: 'A Sanskrit mantra with transliteration and meaning, plus one actionable spiritual practice you can do today - no app required.',
  },
  {
    icon: 'calendar_month',
    title: 'Exclusive Panchang Alerts',
    desc: 'Notified about powerful muhurtas, eclipse windows, and rare planetary alignments before they happen - so you can prepare spiritually.',
  },
]

const SAMPLE_TOPICS = [
  'Nakshatra Insights & Star Power',
  'Vastu Shastra for Harmony',
  'Mantra Sadhana & Meditation',
  'Ayurveda & Holistic Wellness',
  'Vedic Astrology & Jyotish Wisdom',
  'Chakra Healing & Energy Balance',
]

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'duplicate'

export default function NewsletterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = email.trim() && emailValid && state !== 'loading'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), source: 'newsletter-page' }),
      })
      const data = await res.json()
      if (res.ok) {
        setState('success')
      } else if (data.error === 'already_subscribed') {
        setState('duplicate')
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--kutch-white)' }}>
        <div className="max-w-lg w-full text-center">
          <div className="mb-6 flex justify-center">
            <SudarshanLoader size="lg" spin={false} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--indigo-deep)] mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Welcome to the Sacred Circle!
          </h1>
          <p className="text-[var(--text-secondary)] mb-3 leading-relaxed">
            You&apos;re now subscribed. Your first Adhyatmic Digest arrives in your inbox within the next 3 days.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Check your email <strong>{email}</strong> to confirm your subscription.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard" className="btn-divine px-7 py-3 flex items-center gap-2">
              <Icon name="dashboard" size={18} />
              Go to Dashboard
            </Link>
            <Link href="/" className="px-7 py-3 rounded-xl border border-[var(--warm-sand)] text-[var(--text-secondary)] hover:bg-white transition-colors text-sm font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1A1535 0%, #1B1233 50%, #2E0C28 100%)', minHeight: '420px' }}>
        {/* Subtle geometric bg */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='0.8'/%3E%3C/svg%3E")` }} />

        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="flex justify-center mb-6">
            <SudarshanLoader size="md" spin={false} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(212,160,23,0.15)', color: '#C9992E', border: '1px solid rgba(212,160,23,0.3)', fontFamily: "var(--font-label)" }}>
            <Icon name="mail" size={14} />
            Free Newsletter
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Your Adhyatmic Digest
          </h1>
          <p className="text-[var(--text-on-dark-secondary)] text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Ancient Vedic wisdom delivered to your inbox every 3 days - mantras, insights, and practical guidance for modern seekers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-on-dark-secondary)]">
            <span className="flex items-center gap-1.5">
              <Icon name="check_circle" size={16} className="text-[var(--saffron)]" />
              Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="check_circle" size={16} className="text-[var(--saffron)]" />
              Every 3 days
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="check_circle" size={16} className="text-[var(--saffron)]" />
              Unsubscribe anytime
            </span>
          </div>
        </div>
      </section>

      {/* Subscription Form */}
      <section className="py-16 px-6">
        <div className="max-w-md mx-auto">
          <div className="card-divine p-8">
            <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-2 text-center" style={{ fontFamily: "var(--font-display)" }}>
              Join the Sacred Circle
            </h2>
            <p className="text-sm text-[var(--text-muted)] text-center mb-8">Subscribe free - no account needed</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase" style={{ fontFamily: "var(--font-label)" }}>
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: 'var(--kutch-white)', border: '1px solid var(--warm-sand)', color: 'var(--indigo-deep)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--terracotta)'; e.target.style.boxShadow = '0 0 0 3px rgba(198,125,83,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--warm-sand)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase" style={{ fontFamily: "var(--font-label)" }}>
                  Email Address <span style={{ color: 'var(--terracotta)' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (state === 'error' || state === 'duplicate') setState('idle') }}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: 'var(--kutch-white)', border: `1px solid ${email && !emailValid ? '#ef4444' : 'var(--warm-sand)'}`, color: 'var(--indigo-deep)' }}
                  onFocus={e => { e.target.style.borderColor = email && !emailValid ? '#ef4444' : 'var(--terracotta)'; e.target.style.boxShadow = '0 0 0 3px rgba(198,125,83,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = email && !emailValid ? '#ef4444' : 'var(--warm-sand)'; e.target.style.boxShadow = 'none' }}
                />
                {email && !emailValid && (
                  <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>Please enter a valid email address</p>
                )}
              </div>

              {(state === 'error' || state === 'duplicate') && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                  {state === 'duplicate'
                    ? 'This email is already subscribed to our newsletter.'
                    : errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: canSubmit ? 'linear-gradient(135deg, var(--indigo-deep), #2E0C28)' : 'var(--warm-sand)',
                  color: canSubmit ? 'white' : 'rgba(61,52,80,0.3)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {state === 'loading' ? (
                  <>
                    <Icon name="progress_activity" size={18} className="animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Icon name="mail" size={18} />
                    Subscribe to Adhyatmic Digest
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-[var(--text-muted)] text-center mt-5 leading-relaxed">
              By subscribing, you agree to receive emails from MahaTathastu. Unsubscribe anytime.
              <br />We never sell or share your email.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] text-center mb-10" style={{ fontFamily: "var(--font-display)" }}>What You&apos;ll Receive</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="card-divine p-6">
                <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center" style={{ background: 'var(--kutch-white)' }}>
                  <Icon name={b.icon} size={24} className="text-[var(--terracotta)]" />
                </div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-base leading-snug" style={{ fontFamily: "var(--font-display)" }}>{b.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topic preview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] text-center mb-4" style={{ fontFamily: "var(--font-display)" }}>Sample Digest Topics</h2>
          <p className="text-sm text-center text-[var(--text-muted)] mb-8">Each digest covers a rotating theme - new insight every 3 days</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {SAMPLE_TOPICS.map(topic => (
              <span key={topic} className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: 'white', border: '1px solid var(--warm-sand)', color: 'var(--warm-charcoal)' }}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sample digest preview */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] text-center mb-8" style={{ fontFamily: "var(--font-display)" }}>Sample Digest Preview</h2>
          <div className="card-divine overflow-hidden">
            {/* Email-like header */}
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, var(--kutch-white), white)', borderBottom: '1px solid var(--warm-sand)' }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--indigo-deep)' }}>
                  <Icon name="mail" size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--indigo-deep)]">MahaTathastu Digest</p>
                  <p className="text-[12px] text-[var(--text-muted)]">info@mahatathastu.com</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--indigo-deep)] mt-2">Your Adhyatmic Digest - Nakshatra Insights | MahaTathastu</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--kutch-white)', border: '1px solid var(--warm-sand)', color: 'var(--warm-charcoal)' }}>
                Nakshatra Insights & Star Power
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                <strong className="text-[var(--indigo-deep)]">Namaste, Priya,</strong><br /><br />
                The 27 Nakshatras are not merely star clusters - they are living cosmic intelligences that shape your personality, dharma, and destiny from the moment of birth. Today, we explore how understanding your birth nakshatra can transform your daily decisions...
              </p>
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FFFCF0, #FFF8E1)', border: '1px solid #E8D5A0' }}>
                <p className="text-[12px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9992E' }}>Today&apos;s Mantra</p>
                <p className="text-base font-bold text-[var(--indigo-deep)] italic mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Om Nakshatra Devataabhyo Namah
                </p>
                <p className="text-xs text-[var(--text-secondary)]">I bow to the divine intelligences of the 27 star clusters - a mantra of cosmic alignment.</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#FFF8F3', borderLeft: '3px solid var(--terracotta)' }}>
                <p className="text-[12px] font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--terracotta)' }}>Practical Tip</p>
                <p className="text-sm text-[var(--text-secondary)]">Tonight, step outside and observe the moon. Notice which nakshatra the moon is transiting (check your MahaTathastu Panchang). Simply breathing deeply and acknowledging that cosmic influence is a powerful spiritual practice.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
