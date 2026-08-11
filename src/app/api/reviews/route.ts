import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyAdmin } from '@/lib/email'
import {
  REVIEW_COUPON_PERCENT,
  REVIEW_COUPON_VALID_DAYS,
  REVIEW_MIN_BODY_LENGTH,
  SUBJECT_TYPES,
  makeCouponCode,
  type SubjectType,
} from '@/lib/constants/rewards'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/reviews                 - approved reviews (public)
 * GET  /api/reviews?mine=1          - the caller's own reviews + rewards
 * POST /api/reviews                 - submit a review (logged-in only).
 *                                     Issues a personal 10% coupon.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === '1'
  const subjectType = searchParams.get('subject_type')
  const subjectId = searchParams.get('subject_id')
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12))

  if (mine) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()
    const [reviewsRes, couponsRes] = await Promise.all([
      (admin as any).from('reviews')
        .select('id, subject_type, subject_id, subject_label, rating, title, body, status, created_at, reward_coupon_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      (admin as any).from('coupons')
        .select('id, code, discount_type, discount_value, expires_at, is_active, used_count, max_uses, source, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      reviews: reviewsRes.data || [],
      coupons: couponsRes.data || [],
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  let q = (supabase as any).from('reviews')
    .select('id, subject_type, subject_id, subject_label, rating, title, body, created_at, profiles:user_id(full_name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (subjectType) q = q.eq('subject_type', subjectType)
  if (subjectId) q = q.eq('subject_id', subjectId)

  const { data, error } = await q
  if (error) {
    console.error('[reviews] list failed:', error.message)
    return NextResponse.json({ reviews: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Only the display name is exposed, never the reviewer's account details.
  const reviews = (data || []).map((r: any) => ({
    id: r.id,
    subject_type: r.subject_type,
    subject_id: r.subject_id,
    subject_label: r.subject_label,
    rating: r.rating,
    title: r.title,
    body: r.body,
    created_at: r.created_at,
    author: r.profiles?.full_name || 'A MahaTathastu seeker',
  }))

  return NextResponse.json({ reviews }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Reviews are registered-users-only by design: it is what makes the 10%
  // reward safe to hand out and keeps the wall honest.
  if (!user) {
    return NextResponse.json({ error: 'Please log in to write a review.' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const subject_type = String(payload?.subject_type || '') as SubjectType
  const subject_id = payload?.subject_id ? String(payload.subject_id).slice(0, 200) : null
  const subject_label = String(payload?.subject_label || '').trim().slice(0, 160)
  const rating = Number(payload?.rating)
  const title = payload?.title ? String(payload.title).trim().slice(0, 140) : null
  const body = String(payload?.body || '').trim()

  if (!SUBJECT_TYPES.includes(subject_type)) {
    return NextResponse.json({ error: 'Please choose what you are reviewing.' }, { status: 400 })
  }
  if (!subject_label) {
    return NextResponse.json({ error: 'Please choose what you are reviewing.' }, { status: 400 })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please give a rating between 1 and 5 stars.' }, { status: 400 })
  }
  if (body.length < REVIEW_MIN_BODY_LENGTH) {
    return NextResponse.json({ error: `Please write at least ${REVIEW_MIN_BODY_LENGTH} characters so your review is useful to others.` }, { status: 400 })
  }
  if (body.length > 4000) {
    return NextResponse.json({ error: 'Please keep your review under 4000 characters.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // One review per subject per user - the unique index enforces this too,
  // but checking first lets us return a friendly message.
  // `subject_id` is frequently NULL (the seeker did not name a specific item),
  // and `.eq('subject_id', '')` never matches a NULL, so the null case needs
  // `.is()` or the check silently passes and the insert 23505s instead.
  let dupQuery = (admin as any).from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('subject_type', subject_type)
  dupQuery = subject_id === null
    ? dupQuery.is('subject_id', null)
    : dupQuery.eq('subject_id', subject_id)

  const { data: existing } = await dupQuery.maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this. Thank you!' }, { status: 409 })
  }

  const { data: review, error: insertErr } = await (admin as any).from('reviews').insert({
    user_id: user.id,
    subject_type,
    subject_id,
    subject_label,
    rating,
    title,
    body,
    status: 'pending',
  }).select('id').single()

  if (insertErr || !review) {
    if (insertErr?.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this. Thank you!' }, { status: 409 })
    }
    console.error('[reviews] insert failed: code=%s', insertErr?.code ?? 'unknown')
    return NextResponse.json({ error: 'Could not save your review. Please try again.' }, { status: 500 })
  }

  // ── Issue the thank-you coupon ──
  // Granted on submission rather than on approval so the promise made on the
  // form is kept immediately. The coupon is personal, single-use and expiring.
  let coupon: { id: string; code: string; expires_at: string } | null = null
  const expiresAt = new Date(Date.now() + REVIEW_COUPON_VALID_DAYS * 86400_000)

  for (let attempt = 0; attempt < 5 && !coupon; attempt++) {
    const code = makeCouponCode('THANKS')
    const { data: c, error: cErr } = await (admin as any).from('coupons').insert({
      code,
      discount_type: 'percentage',
      discount_value: REVIEW_COUPON_PERCENT,
      min_order_amount: 0,
      max_uses: 1,
      used_count: 0,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      user_id: user.id,
      source: 'review',
      description: `${REVIEW_COUPON_PERCENT}% off your next service - thank you for reviewing ${subject_label}`,
    }).select('id, code, expires_at').single()

    if (!cErr && c) coupon = c
    // 23505 = code collision, just try another one.
    else if (cErr && cErr.code !== '23505') {
      console.error('[reviews] coupon insert failed: code=%s', cErr.code)
      break
    }
  }

  if (coupon) {
    await (admin as any).from('reviews').update({
      reward_coupon_id: coupon.id,
      rewarded_at: new Date().toISOString(),
    }).eq('id', review.id)
  }

  notifyAdmin({
    event: 'New Review Submitted',
    summary: `${rating}★ on ${subject_label}`,
    details: {
      'Reviewer': user.email || user.id,
      'Subject': `${subject_label} (${subject_type})`,
      'Rating': `${rating} / 5`,
      'Review': body.slice(0, 400),
      'Coupon issued': coupon?.code || 'none',
    },
    adminPath: '/admin/reviews',
    accent: '#C67D53',
  })

  return NextResponse.json({
    success: true,
    review_id: review.id,
    coupon: coupon ? { code: coupon.code, expires_at: coupon.expires_at } : null,
    message: coupon
      ? `Thank you! Your ${REVIEW_COUPON_PERCENT}% discount code is ready.`
      : 'Thank you for your review!',
  })
}
