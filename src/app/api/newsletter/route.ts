import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, tooManyRequests, clientIp, sanitiseText } from '@/lib/security'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notifyAdmin } from '@/lib/email'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** `source` is written to the database and read back in the admin panel, so it
 *  is an allowlist rather than free text. */
const ALLOWED_SOURCES = new Set([
  // The values the app actually sends today. Anything else is coerced to
  // 'website' rather than stored, so a crafted `source` cannot reach the admin
  // panel - but the real callers must be listed here or attribution is lost.
  'newsletter-page',  // src/app/(public)/newsletter/page.tsx
  'footer-strip',     // src/components/layout/NewsletterStrip.tsx
  'website', 'landing', 'popup', 'checkout', 'blog',
])

export async function POST(req: NextRequest) {
  // Unauthenticated by design - but that also made it a free way to flood the
  // subscriber table, so it is now rate limited per IP.
  const ip = clientIp(req.headers)
  const limit = rateLimit(`newsletter:${ip}`, 3, 10 * 60 * 1000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const body = await req.json()
  const { email } = body
  const name = sanitiseText(body.name, 120)
  const source = ALLOWED_SOURCES.has(body.source) ? body.source : 'website'

  if (!email || typeof email !== 'string' || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  notifyAdmin({
    event: 'Newsletter Subscription',
    summary: `${name?.trim() || 'Someone'} subscribed (${email.toLowerCase().trim()})`,
    details: { 'Email': email.toLowerCase().trim(), 'Name': name?.trim() || '', 'Source': source },
    accent: '#7C3AED',
  })

  return NextResponse.json({ success: true })
}

// Allow admin to list subscribers - protected by Supabase session (role = admin)
export async function GET(req: NextRequest) {
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getAdmin()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id,email,name,status,source,subscribed_at')
    .eq('status', 'active')
    .order('subscribed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscribers: data, count: data?.length ?? 0 })
}
