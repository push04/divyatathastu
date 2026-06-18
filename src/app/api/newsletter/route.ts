import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const { email, name, source = 'website' } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const supabase = getAdmin()

  // Check for existing subscriber
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id,status')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) {
    if (existing.status === 'unsubscribed') {
      // Re-subscribe
      await supabase
        .from('newsletter_subscribers')
        .update({ status: 'active', name: name || null, unsubscribed_at: null, subscribed_at: new Date().toISOString() })
        .eq('id', existing.id)
      return NextResponse.json({ success: true, resubscribed: true })
    }
    return NextResponse.json({ error: 'already_subscribed' }, { status: 409 })
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      source,
      status: 'active',
    })

  if (error) {
    console.error('[Newsletter] Insert error:', error.message)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Allow admin to list subscribers
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id,email,name,status,source,subscribed_at')
    .eq('status', 'active')
    .order('subscribed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscribers: data, count: data?.length ?? 0 })
}
