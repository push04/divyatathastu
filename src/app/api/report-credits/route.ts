import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyAdmin } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * The referral reward — "one free Full Tathastu Report for a family member" —
 * lives here.
 *
 * GET  - how many unredeemed credits the caller holds
 * POST - { action: 'redeem', member_id } atomically consumes one credit and
 *        returns permission to generate the report without paying.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data } = await (admin as any).from('report_credits')
    .select('id, credit_type, source, is_redeemed, redeemed_at, note, created_at, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const credits = data || []
  const now = Date.now()
  const available = credits.filter((c: any) =>
    !c.is_redeemed && (!c.expires_at || new Date(c.expires_at).getTime() > now))

  return NextResponse.json({
    credits,
    available_count: available.length,
    next_credit_id: available[0]?.id ?? null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, member_id, credit_type } = await req.json().catch(() => ({}))
  if (action !== 'redeem') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const admin = await createAdminClient()

  // The family member must belong to this user's family.
  if (member_id) {
    const { data: member } = await (admin as any).from('family_members')
      .select('id, family_id, families!inner(owner_id)')
      .eq('id', member_id)
      .maybeSingle()
    if (!member || member.families?.owner_id !== user.id) {
      return NextResponse.json({ error: 'That family member is not in your family.' }, { status: 403 })
    }
  }

  const wanted = credit_type || 'full_tathastu'

  const { data: candidates } = await (admin as any).from('report_credits')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .eq('credit_type', wanted)
    .eq('is_redeemed', false)
    .order('created_at', { ascending: true })
    .limit(5)

  const now = Date.now()
  const usable = (candidates || []).find((c: any) => !c.expires_at || new Date(c.expires_at).getTime() > now)

  if (!usable) {
    return NextResponse.json({ error: 'You have no free report credits available.' }, { status: 404 })
  }

  // Atomic claim: the `is_redeemed = false` filter means two concurrent
  // requests cannot both consume the same credit.
  const { data: claimed } = await (admin as any).from('report_credits')
    .update({
      is_redeemed: true,
      redeemed_at: new Date().toISOString(),
      redeemed_for_member_id: member_id || null,
    })
    .eq('id', usable.id)
    .eq('is_redeemed', false)
    .select('id')
    .maybeSingle()

  if (!claimed) {
    return NextResponse.json({ error: 'That credit was just used. Please refresh.' }, { status: 409 })
  }

  notifyAdmin({
    event: 'Referral Reward Redeemed',
    summary: `Free ${wanted} report claimed`,
    details: {
      'User': user.email || user.id,
      'Credit': wanted,
      'Family member': member_id || 'not specified',
    },
    adminPath: '/admin/reports',
    accent: '#C9992E',
  })

  return NextResponse.json({ success: true, credit_id: claimed.id })
}
