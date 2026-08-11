import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyAdmin } from '@/lib/email'
import { REFERRAL_MILESTONE, referralLink } from '@/lib/constants/rewards'

export const dynamic = 'force-dynamic'

const CODE_RE = /^[A-Z0-9]{4,16}$/

/**
 * GET  /api/referrals        - my code, link, progress and earned credits
 * POST /api/referrals        - { action: 'claim', code } record that the
 *                              signed-in user was referred by `code`
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  // Ensure the caller has a code even if the DB trigger was added after their
  // profile row was created.
  let { data: profile } = await (admin as any).from('profiles')
    .select('referral_code, referred_by')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.referral_code) {
    const { data: generated } = await (admin as any).rpc('generate_referral_code')
    if (generated) {
      await (admin as any).from('profiles').update({ referral_code: generated }).eq('id', user.id)
      profile = { ...(profile || {}), referral_code: generated }
    }
  }

  const [referralsRes, creditsRes] = await Promise.all([
    (admin as any).from('referrals')
      .select('id, referred_id, status, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false }),
    (admin as any).from('report_credits')
      .select('id, credit_type, source, is_redeemed, redeemed_at, note, created_at, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const referrals = referralsRes.data || []
  const credits = creditsRes.data || []
  const completed = referrals.filter((r: any) => r.status === 'complete').length

  // Progress within the CURRENT milestone, so the bar restarts after each
  // reward rather than creeping past 100%.
  const towardNext = completed % REFERRAL_MILESTONE
  const remaining = completed === 0 ? REFERRAL_MILESTONE : (REFERRAL_MILESTONE - towardNext) % REFERRAL_MILESTONE || REFERRAL_MILESTONE

  const code = profile?.referral_code || null

  return NextResponse.json({
    code,
    link: code ? referralLink(code) : null,
    milestone: REFERRAL_MILESTONE,
    total_referrals: referrals.length,
    completed_referrals: completed,
    toward_next: towardNext,
    remaining_for_next: remaining,
    rewards_earned: Math.floor(completed / REFERRAL_MILESTONE),
    credits,
    unredeemed_credits: credits.filter((c: any) => !c.is_redeemed).length,
    was_referred: Boolean(profile?.referred_by),
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, code } = await req.json().catch(() => ({ action: null, code: null }))
  if (action !== 'claim') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const clean = String(code || '').trim().toUpperCase()
  if (!CODE_RE.test(clean)) {
    return NextResponse.json({ error: 'That referral code does not look right.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: me } = await (admin as any).from('profiles')
    .select('referred_by, referral_code')
    .eq('id', user.id)
    .maybeSingle()

  if (me?.referred_by) {
    return NextResponse.json({ error: 'You have already used a referral code.' }, { status: 409 })
  }
  // Self-referral is the obvious way to farm this reward.
  if (me?.referral_code === clean) {
    return NextResponse.json({ error: 'You cannot use your own referral code.' }, { status: 400 })
  }

  const { data: referrer } = await (admin as any).from('profiles')
    .select('id, full_name')
    .eq('referral_code', clean)
    .maybeSingle()

  if (!referrer) {
    return NextResponse.json({ error: 'We could not find that referral code.' }, { status: 404 })
  }
  if (referrer.id === user.id) {
    return NextResponse.json({ error: 'You cannot use your own referral code.' }, { status: 400 })
  }

  // The DB trigger on this insert awards a free-report credit to the referrer
  // on every 10th completed referral.
  const { error: refErr } = await (admin as any).from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: user.id,
    referral_code: clean,
    status: 'complete',
  })

  if (refErr) {
    if (refErr.code === '23505') {
      return NextResponse.json({ error: 'This account has already been referred.' }, { status: 409 })
    }
    console.error('[referrals] insert failed: code=%s', refErr.code)
    return NextResponse.json({ error: 'Could not apply that code. Please try again.' }, { status: 500 })
  }

  await (admin as any).from('profiles').update({ referred_by: referrer.id }).eq('id', user.id)

  const { count } = await (admin as any).from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrer.id)
    .eq('status', 'complete')

  const completed = count ?? 0
  if (completed > 0 && completed % REFERRAL_MILESTONE === 0) {
    notifyAdmin({
      event: 'Referral Reward Earned',
      summary: `${referrer.full_name || referrer.id} reached ${completed} referrals`,
      details: {
        'Referrer': referrer.full_name || referrer.id,
        'Completed referrals': completed,
        'Reward': 'Free Full Tathastu Report for one family member',
      },
      adminPath: '/admin/users',
      accent: '#C9992E',
    })
  }

  return NextResponse.json({
    success: true,
    referrer_name: referrer.full_name || 'a MahaTathastu family',
    message: 'Referral applied. Thank you!',
  })
}
