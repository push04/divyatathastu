import Link from 'next/link'
import { YantraDivider } from '@/components/ui/Yantra'
import { REVIEW_COUPON_PERCENT } from '@/lib/constants/rewards'
import { createClient } from '@/lib/supabase/server'

/* ═══════════════════════════════════════════════════════════════════════════
   TESTIMONIALS

   Every card here is a real, admin-approved review pulled from the `reviews`
   table. There is no hardcoded fallback: this section previously shipped six
   invented testimonials (names, cities and quotes) that were appended after
   any genuine reviews to pad the grid to nine, so a visitor could not tell a
   real member from a fabricated one.

   With no approved reviews the grid is omitted entirely and only the
   invitation to write one is shown - an honest empty state rather than
   manufactured social proof.
   ═══════════════════════════════════════════════════════════════════════════ */

interface Card {
  name: string
  location: string
  initials: string
  report: string
  text: string
}

function ReviewCard({ r }: { r: Card }) {
  return (
    <figure
      className="relative flex flex-col h-full rounded-[var(--radius)] p-7 pt-9 overflow-hidden"
      style={{ background: 'var(--surface-light-raised)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Quote glyph in the display serif - the section's own signature mark. */}
      <span
        className="absolute top-1 left-5 pointer-events-none select-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '78px',
          fontWeight: 900,
          lineHeight: 1,
          color: 'var(--primary)',
          opacity: 0.14,
        }}
        aria-hidden="true"
      >
        &ldquo;
      </span>

      {/* Body copy was #1B1233 at 70% opacity (≈3.6:1). Now a real token. */}
      <blockquote className="relative z-10 t-body-sm text-[var(--text-secondary)] flex-1 mb-6">
        {r.text}
      </blockquote>

      <figcaption className="flex items-center justify-between gap-3 mt-auto pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--kumkum-500), var(--saffron-500))', fontFamily: 'var(--font-label)', fontSize: '14px', fontWeight: 700 }}
            aria-hidden="true"
          >
            {r.initials}
          </span>
          <span className="min-w-0">
            <span className="block t-body-sm font-semibold text-[var(--text-primary)] truncate">{r.name}</span>
            <span className="block t-meta text-[var(--text-muted)] truncate">{r.location}</span>
          </span>
        </div>
        <span className="t-data text-[var(--primary-strong)] whitespace-nowrap" style={{ fontSize: '13px' }}>
          {r.report}
        </span>
      </figcaption>
    </figure>
  )
}

/* Approved member reviews, fetched server-side and shown ahead of the seeded
   entries. Failure is non-fatal - the section still renders the curated set. */
interface PublishedReview {
  id: string
  subject_label: string
  rating: number
  title: string | null
  body: string
  author: string
}

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'MT'
}

/** Reads approved reviews straight from the database.
 *
 *  This used to self-fetch `${NEXT_PUBLIC_APP_URL}/api/reviews`, which returned
 *  an empty list whenever that variable was unset - as it is in this project -
 *  so no genuine review had ever reached the homepage. The hardcoded
 *  testimonials that used to pad the grid hid the failure completely. Querying
 *  Supabase directly removes both the env dependency and the extra hop. */
async function fetchPublishedReviews(): Promise<PublishedReview[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
      .from('reviews')
      .select('id, subject_label, rating, title, body, profiles:user_id(full_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(9)
    if (error || !data) return []
    return data.map((r: any) => ({
      id: r.id,
      subject_label: r.subject_label || 'Verified purchase',
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: r.profiles?.full_name || 'Verified member',
    }))
  } catch {
    // A homepage section must never take the whole page down.
    return []
  }
}

export default async function Testimonials() {
  const published = await fetchPublishedReviews()

  const cards: Card[] = published.slice(0, 9).map(r => ({
    name: r.author,
    location: 'Verified member',
    initials: initialsOf(r.author),
    report: r.subject_label,
    text: r.body,
  }))

  return (
    <section className="section-padding" style={{ background: 'var(--surface-light)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        <div className="text-center mb-4 reveal">
          <h2 className="t-display-2 text-[var(--text-primary)]">
            {cards.length ? 'What families are saying' : 'Share your experience'}
          </h2>
          <p className="t-body text-[var(--text-secondary)] mt-3">
            {cards.length
              ? 'Real stories from families across India'
              : 'Reviews from verified members appear here once approved'}
          </p>
        </div>

        <YantraDivider className="mb-12" />

        {cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
            {cards.map((r, i) => (
              <ReviewCard key={`${r.name}-${i}`} r={r} />
            ))}
          </div>
        )}

        {/* Invite members to add their own - reviews are members-only, which
            is also what makes the thank-you discount safe to offer. */}
        <div
          className={`${cards.length ? 'mt-12' : ''} rounded-[var(--radius)] px-6 py-7 text-center reveal`}
          style={{ background: 'var(--surface-light-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <h3 className="t-h4 text-[var(--text-primary)] mb-2">Used a Tathastu report or service?</h3>
          <p className="t-body-sm text-[var(--text-secondary)] max-w-xl mx-auto mb-5">
            Members can leave a review and receive <strong>{REVIEW_COUPON_PERCENT}% off</strong> the next
            service they buy. Refer 10 friends and earn a full report free for one family member.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/reviews" className="btn-divine">Write a review</Link>
            <Link href="/refer" className="btn-outline-divine">Refer &amp; earn</Link>
          </div>
        </div>

      </div>
    </section>
  )
}
