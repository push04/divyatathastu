import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { sendEventRegistrationEmail } from '@/lib/email'

function getRazorpay() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay')
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, eventId, name, email, phone, amount } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'verify') {
    // Verify Razorpay signature and register user
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // The signature alone only proves order_id+payment_id are a real, matched Razorpay
    // pair — it says nothing about which event they were paid for. Fetch the order back
    // from Razorpay (its notes were set server-side at creation, so they can't be
    // tampered with) and confirm it was actually created for this eventId before
    // trusting the client-supplied eventId to register/fulfil against.
    try {
      const razorpay = getRazorpay()
      const order = await razorpay.orders.fetch(razorpay_order_id)
      if (order?.notes?.event_id !== eventId) {
        return NextResponse.json({ error: 'Order mismatch' }, { status: 400 })
      }
    } catch (err: any) {
      console.error('[events/payment/verify] order fetch failed:', err?.message)
      return NextResponse.json({ error: 'Could not verify order' }, { status: 502 })
    }

    // Idempotency guard — a client retry after a successful verify (e.g. flaky network
    // right after Razorpay's handler fires) should not create a second paid registration.
    const { data: existingReg } = await (supabase as any)
      .from('event_registrations')
      .select('id')
      .eq('order_id', razorpay_order_id)
      .maybeSingle()

    if (!existingReg) {
      const { error: regError } = await (supabase as any).from('event_registrations').insert({
        event_id: eventId,
        name,
        email,
        phone: phone || null,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        paid: true,
      } as any)

      if (regError) {
        console.error('[events/payment] Registration insert failed:', regError.message)
        return NextResponse.json({ error: 'Payment verified but registration record failed. Contact support.' }, { status: 500 })
      }
    }

    try {
      await sendEventRegistrationEmail(email, name, body.eventTitle || 'MahaTathastu Event', body.eventDate || '', true, razorpay_payment_id)
    } catch (e: any) {
      console.warn('[events/payment] Email failed:', e.message)
    }

    return NextResponse.json({ success: true })
  }

  // Create Razorpay order — fetch authoritative event price from DB to prevent tampering
  if (!process.env.RAZORPAY_KEY_ID) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  const { data: event, error: eventErr } = await (supabase as any)
    .from('events')
    .select('price')
    .eq('id', eventId)
    .single()
  if (eventErr || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  const authorizedAmount = event.price as number

  try {
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: Math.round(authorizedAmount * 100),
      currency: 'INR',
      receipt: `event-${eventId}-${Date.now()}`,
      notes: { event_id: eventId, name, email },
    })
    return NextResponse.json({ order_id: order.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
