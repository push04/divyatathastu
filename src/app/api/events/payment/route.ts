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

  if (action === 'verify') {
    // Verify Razorpay signature and register user
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

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

    try {
      await sendEventRegistrationEmail(email, name, body.eventTitle || 'MahaTathastu Event', body.eventDate || '', true, razorpay_payment_id)
    } catch (e: any) {
      console.warn('[events/payment] Email failed:', e.message)
    }

    return NextResponse.json({ success: true })
  }

  // Create Razorpay order
  if (!process.env.RAZORPAY_KEY_ID) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  try {
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `event-${eventId}-${Date.now()}`,
      notes: { event_id: eventId, name, email },
    })
    return NextResponse.json({ order_id: order.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
