'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'
import Icon from '@/components/ui/Icon'
import { REFERRAL_MILESTONE, REFERRAL_REWARD_LABEL } from '@/lib/constants/rewards'

interface Credit {
  id: string
  credit_type: string
  source: string
  is_redeemed: boolean
  redeemed_at: string | null
  note: string | null
  created_at: string
  expires_at: string | null
}

interface ReferralState {
  code: string | null
  link: string | null
  milestone: number
  total_referrals: number
  completed_referrals: number
  toward_next: number
  remaining_for_next: number
  rewards_earned: number
  credits: Credit[]
  unredeemed_credits: number
  was_referred: boolean
}

export default function ReferPage() {
  const [state, setState] = useState<ReferralState | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  useEffect(() => {
    fetch('/api/referrals')
      .then(async r => (r.ok ? r.json() : null))
      .then(j => setState(j))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function copy(text: string, what: 'link' | 'code') {
    navigator.clipboard.writeText(text)
    setCopied(what)
    toast.success(what === 'link' ? 'Referral link copied' : 'Referral code copied')
    setTimeout(() => setCopied(null), 2000)
  }

  const shareText = state?.link
    ? `I have been using MahaTathastu for our family's Vedic reports - kundli, numerology, chakra, Vastu and more, all in one place. Join through my link: ${state.link}`
    : ''

  async function nativeShare() {
    if (!state?.link) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'MahaTathastu', text: shareText, url: state.link })
        return
      } catch { /* user dismissed - fall through to copy */ }
    }
    copy(state.link, 'link')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  if (!state?.code) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card-divine p-10 text-center">
          <Icon name="group_add" size={40} className="text-[var(--terracotta)] block mb-3" />
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] mb-2">Refer &amp; Earn</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Please log in to get your personal referral link.
          </p>
          <Link href="/login" className="btn-divine px-6 py-2.5 text-sm">Log in</Link>
        </div>
      </div>
    )
  }

  const milestone = state.milestone || REFERRAL_MILESTONE
  const pct = Math.min(100, Math.round((state.toward_next / milestone) * 100))
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2">
          <Icon name="group_add" size={24} /> Refer &amp; Earn
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Share MahaTathastu with <strong>{milestone} friends</strong> and receive {REFERRAL_REWARD_LABEL.toLowerCase()}.
        </p>
      </div>

      {/* ── The offer ── */}
      <div className="card-divine p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #2d1b69)' }}>
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none">
          <SudarshanLoader px={200} spin={false} />
        </div>
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--saffron)' }}>
            Referral Reward
          </p>
          <h2 className="text-white font-bold mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1.25 }}>
            {milestone} friends → 1 free Full Tathastu Report
          </h2>
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--text-on-dark-secondary)' }}>
            When {milestone} people join MahaTathastu using your link, you earn a complete Full Tathastu Report —
            all 14 reports — free for one member of your family. Every further {milestone} referrals earns another.
          </p>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="card-divine p-5">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Your progress</p>
            <p className="text-[var(--indigo-deep)] font-bold text-lg">
              {state.completed_referrals} friend{state.completed_referrals === 1 ? '' : 's'} joined
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {state.remaining_for_next} more for your next free report
          </p>
        </div>

        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--warm-sand)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--terracotta), var(--saffron))' }} />
        </div>

        {/* Milestone dots */}
        <div className="flex justify-between mt-2.5">
          {Array.from({ length: milestone }).map((_, i) => (
            <span key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: i < state.toward_next ? 'var(--terracotta)' : 'var(--warm-sand)' }}
              title={`Friend ${i + 1}`} />
          ))}
        </div>

        {state.rewards_earned > 0 && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Icon name="workspace_premium" size={20} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800">
              You have earned <strong>{state.rewards_earned}</strong> free report{state.rewards_earned === 1 ? '' : 's'}
              {state.unredeemed_credits > 0 && <> — <strong>{state.unredeemed_credits}</strong> still to claim.</>}
            </p>
          </div>
        )}
      </div>

      {/* ── Share ── */}
      <div className="card-divine p-5">
        <h2 className="font-bold text-[var(--indigo-deep)] mb-3 flex items-center gap-2">
          <Icon name="share" size={18} /> Your Referral Link
        </h2>

        <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-3" style={{ background: 'var(--warm-sand)' }}>
          <Icon name="link" size={16} className="text-[var(--saffron)] shrink-0" />
          <span className="text-xs font-mono text-[var(--indigo-deep)] flex-1 truncate">{state.link}</span>
          <button onClick={() => copy(state.link!, 'link')}
            className="text-xs font-semibold text-[var(--terracotta)] hover:underline inline-flex items-center gap-1 shrink-0">
            <Icon name={copied === 'link' ? 'check' : 'content_copy'} size={14} />
            {copied === 'link' ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: 'var(--warm-sand)', border: '1px dashed rgba(201,153,46,0.5)' }}>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Code</span>
            <span className="font-mono font-black tracking-[0.18em] text-[var(--indigo-deep)]">{state.code}</span>
            <button onClick={() => copy(state.code!, 'code')} className="text-[var(--terracotta)] shrink-0">
              <Icon name={copied === 'code' ? 'check' : 'content_copy'} size={15} />
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 inline-flex items-center gap-2"
            style={{ background: '#25D366' }}>
            <Icon name="chat" size={16} /> Share on WhatsApp
          </a>
          <button onClick={nativeShare} className="btn-divine px-5 py-2.5 text-sm inline-flex items-center gap-2">
            <Icon name="share" size={16} /> Share
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed">
          A referral counts once your friend creates their MahaTathastu account through your link.
          Self-referrals and duplicate accounts do not count.
        </p>
      </div>

      {/* ── Earned credits ── */}
      {state.credits.length > 0 && (
        <div className="card-divine p-5">
          <h2 className="font-bold text-[var(--indigo-deep)] mb-3 flex items-center gap-2">
            <Icon name="card_giftcard" size={18} className="text-[var(--saffron)]" />
            Free Report Credits ({state.credits.length})
          </h2>
          <div className="space-y-2">
            {state.credits.map(c => (
              <div key={c.id} className="flex items-center gap-3 flex-wrap rounded-xl px-4 py-3" style={{ background: 'var(--warm-sand)' }}>
                <Icon name="description" size={18} className="text-[var(--terracotta)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--indigo-deep)]">Full Tathastu Report — 1 family member</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {c.note || 'Referral reward'} · earned {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {c.is_redeemed ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[var(--warm-sand)] text-[var(--text-muted)] border border-[var(--warm-sand)]">
                    Redeemed
                  </span>
                ) : (
                  <Link href="/reports/generate?credit=1"
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-[var(--indigo-deep)] text-white hover:opacity-90 transition-opacity shrink-0">
                    Claim now
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div className="card-divine p-5">
        <h2 className="font-bold text-[var(--indigo-deep)] mb-3 flex items-center gap-2">
          <Icon name="help" size={18} /> How it works
        </h2>
        <ol className="space-y-2.5">
          {[
            'Copy your referral link above and send it to family and friends.',
            'They open the link and create their MahaTathastu account.',
            `Each signup counts as one referral — reach ${milestone} and your reward unlocks automatically.`,
            'Claim your free Full Tathastu Report for any one member of your family.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'var(--terracotta)' }}>{i + 1}</span>
              <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
