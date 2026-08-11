import Link from 'next/link'
import { YantraDivider } from '@/components/ui/Yantra'
import { REVIEW_COUPON_PERCENT } from '@/lib/constants/rewards'

/* ═══════════════════════════════════════════════════════════════════════════
   TESTIMONIALS

   Was: two infinite marquee rows built from the same six reviews - row 1 held
   them twice, row 2 held them four times, so the same six names cycled past
   endlessly. Reading the section made the social proof feel thinner, not
   deeper, and the duplicates were also announced to screen readers.

   Fixed structurally: the loop is gone. Six real reviews, each rendered
   exactly once, in a static editorial grid with a scroll-linked reveal.

   NOTE FOR CONTENT: I deliberately did not pad this out with invented
   reviews - fabricated testimonials are not mine to write. The grid is sized
   to take 9 or 12 gracefully; drop additional genuine entries into REVIEWS
   below and the layout absorbs them with no code change.
   ═══════════════════════════════════════════════════════════════════════════ */

const REVIEWS = [
  {
    name: 'Priya Sharma', location: 'Mumbai', initials: 'PS', report: 'Full Bundle',
    text: 'The Full Tathastu bundle completely changed how I understand my family. The child development report for my son was spot-on - it identified his talent for music, which we had been ignoring.',
  },
  {
    name: 'Rajesh Gupta', location: 'Delhi', initials: 'RG', report: 'Astro-Vastu',
    text: 'The Astro-Vastu report helped us rearrange our office. Within a month business improved noticeably. The remedies were practical and specific, not generic advice.',
  },
  {
    name: 'Anita Verma', location: 'Bangalore', initials: 'AV', report: 'Numerology',
    text: 'My numerology and psychology reports gave me such clarity about my career change. I finally understood why certain paths had felt wrong. Best investment I have made this year.',
  },
  {
    name: 'Suresh Patel', location: 'Ahmedabad', initials: 'SP', report: 'Shakti Chakra',
    text: 'The Shakti Chakra report identified my root chakra blockage precisely. The healing mantras and crystal suggestions have made a real difference to my energy levels.',
  },
  {
    name: 'Meera Krishnan', location: 'Chennai', initials: 'MK', report: 'Prakriti',
    text: 'The Prakriti report revealed that I am primarily Vata-Pitta. The diet and yoga recommendations aligned closely with what actually works for me. Remarkably accurate.',
  },
  {
    name: 'Arun Tiwari', location: 'Varanasi', initials: 'AT', report: 'Pilgrimage',
    text: 'Our family pilgrimage to Char Dham was planned perfectly using the itinerary maker. The panchang timing for each temple made the experience spiritually powerful.',
  },
]

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
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

async function fetchPublishedReviews(): Promise<PublishedReview[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || ''
    if (!base) return []
    const res = await fetch(`${base.replace(/\/$/, '')}/api/reviews?limit=9`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.reviews) ? json.reviews : []
  } catch {
    return []
  }
}

export default async function Testimonials() {
  const published = await fetchPublishedReviews()

  const cards = [
    ...published.map(r => ({
      name: r.author,
      location: 'Verified member',
      initials: initialsOf(r.author),
      report: r.subject_label,
      text: r.body,
    })),
    ...REVIEWS,
  ].slice(0, 9)

  return (
    <section className="section-padding" style={{ background: 'var(--surface-light)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        <div className="text-center mb-4 reveal">
          <h2 className="t-display-2 text-[var(--text-primary)]">What families are saying</h2>
          <p className="t-body text-[var(--text-secondary)] mt-3">
            Real stories from families across India
          </p>
        </div>

        <YantraDivider className="mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
          {cards.map((r, i) => (
            <ReviewCard key={`${r.name}-${i}`} r={r} />
          ))}
        </div>

        {/* Invite members to add their own - reviews are members-only, which
            is also what makes the thank-you discount safe to offer. */}
        <div
          className="mt-12 rounded-[var(--radius)] px-6 py-7 text-center reveal"
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
