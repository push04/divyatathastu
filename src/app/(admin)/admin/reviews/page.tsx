'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'
import Icon from '@/components/ui/Icon'

interface Review {
  id: string
  user_id: string
  subject_type: string
  subject_label: string
  rating: number
  title: string | null
  body: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  rewarded_at: string | null
  profiles: { full_name: string } | null
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function AdminReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('reviews')
      .select('*, profiles:user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) toast.error('Failed to load reviews: ' + error.message)
    setReviews((data || []) as Review[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
    setBusy(id)
    const { error } = await (supabase as any).from('reviews').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('Failed: ' + error.message)
    else {
      setReviews(rs => rs.map(r => r.id === id ? { ...r, status } : r))
      toast.success(`Review ${status}`)
    }
    setBusy(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this review permanently?')) return
    const { error } = await (supabase as any).from('reviews').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setReviews(rs => rs.filter(r => r.id !== id)); toast.success('Deleted') }
  }

  const shown = reviews.filter(r => filter === 'all' || r.status === filter)
  const counts = {
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <Icon name="rate_review" size={20} /> Reviews
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected.
          Approved reviews appear publicly on the site.
        </p>
      </div>

      <div className="bento-card p-4 flex items-start gap-3" style={{ background: '#eff6ff', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Icon name="info" size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 leading-relaxed">
          The <strong>10% thank-you coupon</strong> is issued the moment a review is submitted, so a seeker is never
          left waiting on moderation for a reward they were promised. Rejecting a review here hides it from the
          public wall but does not revoke the coupon — revoke it from <strong>Coupons</strong> if a review was abusive.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--text-secondary)] hover:text-[var(--indigo-deep)]'}`}>
            {f}{f !== 'all' && ` (${counts[f]})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-14">
          <Icon name="reviews" size={40} className="text-[var(--warm-charcoal)]/20 block mb-2" />
          <p className="text-[var(--text-muted)] text-sm">No {filter === 'all' ? '' : filter} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(r => (
            <div key={r.id} className="bento-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Numeric value shown alongside — the icon set is stroke
                      only, so the stars differ by colour alone. */}
                  <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${r.rating} out of 5`}>
                    <span className="flex gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Icon key={n} name="star" size={15}
                          style={{ color: n <= r.rating ? '#C9992E' : 'rgba(28,30,74,0.18)' }} />
                      ))}
                    </span>
                    <span aria-hidden="true" className="text-[11px] font-bold text-[var(--text-secondary)]">{r.rating}/5</span>
                  </span>
                  <span className="text-sm font-semibold text-[var(--indigo-deep)]">{r.subject_label}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--warm-sand)] text-[var(--text-secondary)] font-medium">
                    {r.subject_type}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                  {r.rewarded_at && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                      coupon issued
                    </span>
                  )}
                </div>
                <div className="flex gap-2.5 shrink-0">
                  {r.status !== 'approved' && (
                    <button onClick={() => setStatus(r.id, 'approved')} disabled={busy === r.id}
                      className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50">Approve</button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => setStatus(r.id, 'rejected')} disabled={busy === r.id}
                      className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-50">Reject</button>
                  )}
                  <button onClick={() => remove(r.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </div>
              </div>

              {r.title && <p className="text-sm font-bold text-[var(--indigo-deep)] mb-1">{r.title}</p>}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{r.body}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-2">
                {r.profiles?.full_name || 'Unknown'} · {new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
