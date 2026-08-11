'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import SudarshanLoader from '@/components/SudarshanLoader'
import Icon from '@/components/ui/Icon'
import {
  REVIEW_COUPON_PERCENT,
  REVIEW_COUPON_VALID_DAYS,
  REVIEW_MIN_BODY_LENGTH,
  SUBJECT_TYPES,
  SUBJECT_TYPE_LABELS,
  type SubjectType,
} from '@/lib/constants/rewards'

interface MyReview {
  id: string
  subject_type: SubjectType
  subject_id: string | null
  subject_label: string
  rating: number
  title: string | null
  body: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface MyCoupon {
  id: string
  code: string
  discount_type: 'percentage' | 'flat'
  discount_value: number
  expires_at: string | null
  is_active: boolean
  used_count: number
  max_uses: number | null
  source: string | null
  description: string | null
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
}

/**
 * The site's icon set is stroke-only — `star` and `star_outline` resolve to the
 * same outline glyph — so colour alone would carry the rating. That fails for
 * anyone who cannot distinguish it, hence the always-present numeric label on
 * the read-only variant and the real radio semantics on the editable one.
 */
function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${value} out of 5`}>
        <span className="flex gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map(n => (
            <Icon
              key={n}
              name="star"
              size={size}
              style={{ color: n <= value ? '#C9992E' : 'rgba(28,30,74,0.18)' }}
            />
          ))}
        </span>
        <span
          aria-hidden="true"
          style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700, color: 'rgba(28,30,74,0.55)' }}
        >
          {value}/5
        </span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Your rating out of 5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-checked={value === n}
          role="radio"
          className="transition-transform hover:scale-110"
          style={{ lineHeight: 0 }}
        >
          <Icon name="star" size={size} style={{ color: n <= value ? '#C9992E' : 'rgba(28,30,74,0.2)' }} />
        </button>
      ))}
      <span
        className="ml-2"
        style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700, color: value ? '#C9992E' : 'rgba(28,30,74,0.4)' }}
      >
        {value ? `${value}/5` : 'Tap to rate'}
      </span>
    </div>
  )
}

export default function ReviewsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [coupons, setCoupons] = useState<MyCoupon[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [form, setForm] = useState({
    subject_type: 'report' as SubjectType,
    subject_label: '',
    rating: 0,
    title: '',
    body: '',
  })

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setAuthed(Boolean(user))
    if (!user) { setLoading(false); return }

    const res = await fetch('/api/reviews?mine=1')
    if (res.ok) {
      const j = await res.json()
      setReviews(j.reviews || [])
      setCoupons(j.coupons || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.rating < 1) { toast.error('Please choose a star rating'); return }
    if (form.body.trim().length < REVIEW_MIN_BODY_LENGTH) {
      toast.error(`Please write at least ${REVIEW_MIN_BODY_LENGTH} characters`); return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_type: form.subject_type,
          subject_label: form.subject_label.trim() || SUBJECT_TYPE_LABELS[form.subject_type],
          subject_id: form.subject_label.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 120) || null,
          rating: form.rating,
          title: form.title.trim() || null,
          body: form.body.trim(),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(j.error || 'Could not submit your review'); return }

      toast.success(j.coupon ? `Thank you! Your code ${j.coupon.code} is ready.` : 'Thank you for your review!')
      setForm({ subject_type: 'report', subject_label: '', rating: 0, title: '', body: '' })
      await load()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success('Coupon code copied')
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  if (!authed) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card-divine p-10 text-center">
          <Icon name="rate_review" size={40} className="text-[var(--terracotta)] block mb-3" />
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] mb-2">Reviews are for registered seekers</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
            Only logged-in members can write a review — it keeps the wall honest and lets us send you your
            {' '}{REVIEW_COUPON_PERCENT}% thank-you discount.
          </p>
          <Link href="/login" className="btn-divine px-6 py-2.5 text-sm">Log in to continue</Link>
        </div>
      </div>
    )
  }

  const usableCoupons = coupons.filter(c => c.is_active && (c.max_uses === null || c.used_count < c.max_uses))
  const bodyLen = form.body.trim().length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2">
          <Icon name="rate_review" size={24} /> Reviews &amp; Rewards
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Share your experience and receive <strong>{REVIEW_COUPON_PERCENT}% off</strong> the next service you buy.
        </p>
      </div>

      {/* ── Reward explainer ── */}
      <div className="card-divine p-5 flex items-start gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(201,153,46,0.10), rgba(198,125,83,0.08))', border: '1px solid rgba(201,153,46,0.3)' }}>
        <Icon name="redeem" size={26} className="text-[var(--saffron)] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[var(--indigo-deep)] mb-1">How the thank-you discount works</p>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1 leading-relaxed">
            <li>• Write an honest review of any report, service, course or consultation you have used.</li>
            <li>• A personal <strong>{REVIEW_COUPON_PERCENT}% discount code</strong> is issued to you immediately.</li>
            <li>• Use it on your next service purchase. Valid for {REVIEW_COUPON_VALID_DAYS} days, one use, yours alone.</li>
          </ul>
        </div>
      </div>

      {/* ── My coupons ── */}
      {usableCoupons.length > 0 && (
        <div className="card-divine p-5">
          <h2 className="font-bold text-[var(--indigo-deep)] mb-3 flex items-center gap-2">
            <Icon name="local_activity" size={18} className="text-[var(--saffron)]" />
            My Discount Codes ({usableCoupons.length})
          </h2>
          <div className="space-y-2">
            {usableCoupons.map(c => (
              <div key={c.id} className="flex items-center gap-3 flex-wrap rounded-xl px-4 py-3"
                style={{ background: 'var(--warm-sand)', border: '1px dashed rgba(201,153,46,0.5)' }}>
                <span className="font-mono font-black tracking-[0.15em] text-[var(--indigo-deep)]">{c.code}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                </span>
                <span className="text-xs text-[var(--text-muted)] flex-1 min-w-0 truncate">
                  {c.description || 'Discount code'}
                  {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString('en-IN')}`}
                </span>
                <button onClick={() => copy(c.code)}
                  className="text-xs font-semibold text-[var(--terracotta)] hover:underline inline-flex items-center gap-1 shrink-0">
                  <Icon name={copied === c.code ? 'check' : 'content_copy'} size={14} />
                  {copied === c.code ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Apply a code at checkout in the <Link href="/shop" className="text-[var(--terracotta)] hover:underline">Shop</Link>.
          </p>
        </div>
      )}

      {/* ── Write a review ── */}
      <form onSubmit={submit} className="card-divine p-5 space-y-4">
        <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <Icon name="edit_note" size={18} /> Write a Review
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">What are you reviewing?</label>
            <select
              value={form.subject_type}
              onChange={e => setForm(f => ({ ...f, subject_type: e.target.value as SubjectType }))}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm bg-white focus:outline-none focus:border-[var(--saffron)]"
            >
              {SUBJECT_TYPES.map(t => <option key={t} value={t}>{SUBJECT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Which one? (optional)</label>
            <input
              value={form.subject_label}
              onChange={e => setForm(f => ({ ...f, subject_label: e.target.value }))}
              placeholder={SUBJECT_TYPE_LABELS[form.subject_type]}
              maxLength={160}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm bg-white focus:outline-none focus:border-[var(--saffron)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Your rating *</label>
          <Stars value={form.rating} onChange={n => setForm(f => ({ ...f, rating: n }))} size={30} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Headline (optional)</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Sum it up in a line"
            maxLength={140}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm bg-white focus:outline-none focus:border-[var(--saffron)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Your experience *</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={5}
            maxLength={4000}
            placeholder="What did you find accurate or useful? What would help another family decide?"
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--warm-sand)] text-sm bg-white focus:outline-none focus:border-[var(--saffron)] resize-y"
          />
          <p className={`text-xs mt-1 ${bodyLen < REVIEW_MIN_BODY_LENGTH ? 'text-[var(--text-muted)]' : 'text-emerald-600'}`}>
            {bodyLen < REVIEW_MIN_BODY_LENGTH
              ? `${REVIEW_MIN_BODY_LENGTH - bodyLen} more characters needed`
              : `${bodyLen} characters — looks good`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1">
          <button type="submit" disabled={submitting} className="btn-divine px-6 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2">
            <Icon name={submitting ? 'hourglass_empty' : 'send'} size={16} />
            {submitting ? 'Submitting...' : `Submit & get ${REVIEW_COUPON_PERCENT}% off`}
          </button>
          <p className="text-xs text-[var(--text-muted)]">
            Reviews appear publicly once approved. Your discount code arrives straight away.
          </p>
        </div>
      </form>

      {/* ── My reviews ── */}
      <div className="card-divine p-5">
        <h2 className="font-bold text-[var(--indigo-deep)] mb-3 flex items-center gap-2">
          <Icon name="history" size={18} /> My Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">You have not written a review yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl p-4" style={{ background: 'var(--warm-sand)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Stars value={r.rating} size={16} />
                    <span className="text-sm font-semibold text-[var(--indigo-deep)]">{r.subject_label}</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                {r.title && <p className="text-sm font-bold text-[var(--indigo-deep)] mb-1">{r.title}</p>}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.body}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
