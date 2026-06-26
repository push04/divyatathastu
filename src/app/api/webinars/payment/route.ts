import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function getRazorpay() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay')
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, webinarId } = body

  // Fetch webinar
  const { data: webinar, error: wErr } = await supabase
    .from('webinars')
    .select('id, title, price, max_participants, status')
    .eq('id', webinarId)
    .single()

  if (wErr || !webinar) return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })

  // ── FREE JOIN ──────────────────────────────────────────────────────────────
  if (action === 'free') {
    if (webinar.price > 0) return NextResponse.json({ error: 'This webinar requires payment' }, { status: 400 })

    const { error } = await (supabase as any)
      .from('webinar_registrations')
      .upsert(
        { webinar_id: webinarId, user_id: user.id, payment_status: 'paid', amount: 0 },
        { onConflict: 'webinar_id,user_id' },
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ── CREATE RAZORPAY ORDER ──────────────────────────────────────────────────
  if (action === 'create') {
    if (webinar.price <= 0) return NextResponse.json({ error: 'Webinar is free' }, { status: 400 })

    const rz = getRazorpay()
    const order = await rz.orders.create({
      amount: Math.round(webinar.price * 100),
      currency: 'INR',
      receipt: `wbn-${Date.now()}`,
      notes: { webinar_id: webinarId, user_id: user.id },
    })

    // Insert pending registration
    await (supabase as any).from('webinar_registrations').upsert(
      {
        webinar_id: webinarId,
        user_id: user.id,
        payment_status: 'pending',
        razorpay_order_id: order.id,
        amount: webinar.price,
      },
      { onConflict: 'webinar_id,user_id' },
    )

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency })
  }

  // ── VERIFY PAYMENT ────────────────────────────────────────────────────────
  if (action === 'verify') {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSig !== razorpaySignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('webinar_registrations')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq('webinar_id', webinarId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
