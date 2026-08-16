import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, sendWelcomeEmail, sendOrderConfirmation, sendSpiritualDigest, notifyAdmin } from '@/lib/email'
import type { OrderDetails, DigestContent } from '@/lib/email'
import { safeError, rateLimit, tooManyRequests } from '@/lib/security'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, to, subject, html } = body

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!to || !EMAIL_RE.test(to)) return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 })

  // Open-relay fix.
  //
  // `welcome`, `order` and `digest` accepted an arbitrary recipient together
  // with attacker-supplied order and digest content, so any logged-in user
  // could send convincing "Order Confirmed" mail from the MahaTathastu domain
  // to anyone. Non-admins may now only send to their own verified address, and
  // the differing-address case returns the same 403 whether or not the target
  // exists, so this cannot be used to enumerate accounts either.
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    if (!user.email || to.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Even to their own address, a user cannot become a mail pump.
    const limit = rateLimit(`email:${user.id}`, 5, 60 * 60 * 1000)
    if (!limit.ok) return tooManyRequests(limit.retryAfter)
  }

  try {
    switch (type) {
      case 'welcome': {
        const name: string = body.name || to.split('@')[0]
        await sendWelcomeEmail(to, name)
        notifyAdmin({
          event: 'New User Registered',
          summary: `${name} (${to})`,
          details: { 'Name': name, 'Email': to, 'User ID': user.id },
          adminPath: '/admin/users',
          accent: '#D9741A',
        })
        break
      }
      case 'order': {
        const name: string = body.name || to.split('@')[0]
        const order: OrderDetails = body.order
        if (!order) return NextResponse.json({ error: 'Missing order data' }, { status: 400 })
        await sendOrderConfirmation(to, name, order)
        break
      }
      case 'digest': {
        const name: string = body.name || to.split('@')[0]
        const digest: DigestContent = body.digest
        const dateStr: string = body.dateStr || new Date().toLocaleDateString('en-IN')
        if (!digest) return NextResponse.json({ error: 'Missing digest data' }, { status: 400 })
        await sendSpiritualDigest(to, name, digest, dateStr)
        break
      }
      default: {
        // Generic email - admin only; arbitrary subject and HTML.
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        if (!subject || !html) return NextResponse.json({ error: 'Missing subject or html' }, { status: 400 })
        await sendEmail(to, subject, html)
      }
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return safeError('/api/email', err, 'Could not send the email. Please try again.')
  }
}
