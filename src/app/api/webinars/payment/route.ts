import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  // Admin client for all DB writes — bypasses RLS reliably
  const admin = await createAdminClient()
  const body = await req.json()
  const { action, webinarId } = body

  // Fetch webinar (price is authoritative — never trust client)
  const { data: webinar, error: wErr } = await (admin as any)
    .from('webinars')
    .select('id, title, price, max_participants, status')
    .eq('id', webinarId)
    .single()

  if (wErr || !webinar) return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })

  // ── FREE JOIN ─────────────────────────────────────────────────────────────
  if (action === 'free') {
    if (webinar.price > 0) return NextResponse.json({ error: 'This webinar requires payment' }, { status: 400 })

    const { error } = await (admin as any)
      .from('webinar_registrations')
      .upsert(
        { webinar_id: webinarId, user_id: user.id, payment_status: 'paid', amount: 0 },
        { onConflict: 'webinar_id,user_id' },
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ── CREATE RAZORPAY ORDER ─────────────────────────────────────────────────
  if (action === 'create') {
    if (webinar.price <= 0) return NextResponse.json({ error: 'Webinar is free — use free action' }, { status: 400 })

    // Guard 1: Don't overwrite a paid registration (prevents access revocation bug)
    const { data: existingReg } = await (admin as any)
      .from('webinar_registrations')
      .select('payment_status')
      .eq('webinar_id', webinarId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingReg?.payment_status === 'paid') {
      return NextResponse.json({ success: true, already_paid: true })
    }

    // Guard 2: Enforce max_participants before accepting payment
    if (webinar.max_participants) {
      const { count } = await (admin as any)
        .from('webinar_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('webinar_id', webinarId)
        .eq('payment_status', 'paid')
      if ((count ?? 0) >= webinar.max_participants) {
        return NextResponse.json({ error: 'This webinar is fully booked.' }, { status: 400 })
      }
    }

    const rz = getRazorpay()
    let order: any
    try {
      order = await rz.orders.create({
        amount: Math.round(webinar.price * 100),
        currency: 'INR',
        receipt: `wbn-${Date.now()}`,
        notes: { webinar_id: webinarId, user_id: user.id },
      })
    } catch (err: any) {
      console.error('[webinars/payment] Razorpay error:', err?.error?.description || err.message)
      return NextResponse.json({ error: err?.error?.description || 'Payment gateway error. Please try again.' }, { status: 500 })
    }

    // Safe upsert — only updates pending registrations (paid guard above ensures we never reach here if paid)
    const { error: upsertErr } = await (admin as any).from('webinar_registrations').upsert(
      {
        webinar_id: webinarId,
        user_id: user.id,
        payment_status: 'pending',
        razorpay_order_id: order.id,
        amount: webinar.price,
      },
      { onConflict: 'webinar_id,user_id' },
    )

    if (upsertErr) {
      console.error('[webinars/payment/create] upsert failed:', upsertErr.message)
      return NextResponse.json({ error: 'Registration failed. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ order_id: order.id, amount: order.amount, currency: order.currency })
  }

  // ── VERIFY PAYMENT ────────────────────────────────────────────────────────
  if (action === 'verify') {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    const wSecret = process.env.RAZORPAY_KEY_SECRET
    if (!wSecret) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })

    const sigBody = `${razorpayOrderId}|${razorpayPaymentId}`
    const expectedSig = crypto.createHmac('sha256', wSecret).update(sigBody).digest('hex')
    if (expectedSig !== razorpaySignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Fetch registration and assert order_id matches — blocks cross-webinar signature replay attacks
    const { data: reg } = await (admin as any)
      .from('webinar_registrations')
      .select('razorpay_order_id, payment_status')
      .eq('webinar_id', webinarId)
      .eq('user_id', user.id)
      .single()

    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    if (reg.payment_status === 'paid') return NextResponse.json({ success: true, already_paid: true })
    if (reg.razorpay_order_id !== razorpayOrderId) {
      return NextResponse.json({ error: 'Order mismatch — signature replay rejected' }, { status: 400 })
    }

    const { error } = await (admin as any)
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
