import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { sendCourseEnrollmentEmail } from '@/lib/email'

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
  const { action, courseId, courseTitle, coursePrice, instructor } = body

  if (action === 'free') {
    const { data: existing } = await (supabase as any)
      .from('service_bookings')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_item_id', courseId)
      .maybeSingle()

    if (!existing) {
      const { error } = await (supabase as any).from('service_bookings').insert({
        service_item_id: courseId,
        user_id: user.id,
        status: 'confirmed',
        amount: 0,
        payment_status: 'paid',
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Seeker'
    try {
      await sendCourseEnrollmentEmail(user.email!, name, courseTitle || 'Course', 0, instructor, courseId)
    } catch (e: any) {
      console.warn('[courses/payment] Email failed:', e.message)
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'create') {
    if (!process.env.RAZORPAY_KEY_ID) {
      return NextResponse.json({ error: 'Payment not configured on server' }, { status: 503 })
    }

    // Fetch authoritative price — never trust a client-supplied amount
    const { data: course, error: courseErr } = await (supabase as any)
      .from('service_items')
      .select('id, price, is_active')
      .eq('id', courseId)
      .eq('category', 'course')
      .eq('is_active', true)
      .single()
    if (courseErr || !course) return NextResponse.json({ error: 'Course not found or not available' }, { status: 404 })
    if (course.price === null || course.price === undefined || (course.price as number) <= 0) {
      return NextResponse.json({ error: 'Course price not configured. Please contact support.' }, { status: 400 })
    }
    const amountPaise = Math.round((course.price as number) * 100)

    try {
      const razorpay = getRazorpay()
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        // Razorpay receipt limit is 40 chars — keep it short
        receipt: `crs-${Date.now()}`,
        notes: { course_id: courseId, user_id: user.id },
      })

      // Record the pending enrollment now so verify can cross-check the order id
      // instead of trusting whatever the client sends back (blocks signature replay
      // across a different, cheaper order). No unique constraint on (user_id,
      // service_item_id) exists, so check-then-write rather than upsert.
      const { data: existingPending } = await (supabase as any)
        .from('service_bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('service_item_id', courseId)
        .maybeSingle()
      const pendingRow = {
        service_item_id: courseId,
        user_id: user.id,
        status: 'pending',
        amount: course.price,
        payment_status: 'pending',
        razorpay_order_id: order.id,
      }
      const { error: pendingErr } = existingPending
        ? await (supabase as any).from('service_bookings').update(pendingRow).eq('id', existingPending.id)
        : await (supabase as any).from('service_bookings').insert(pendingRow)
      if (pendingErr) {
        console.error('[courses/payment/create] pending booking write failed:', pendingErr.message)
      }

      return NextResponse.json({ order_id: order.id })
    } catch (err: any) {
      // Razorpay throws { error: { description: '...' } }, not a standard Error
      const msg = err?.error?.description || err?.description || err?.message || 'Payment order creation failed'
      console.error('[courses/payment/create] Razorpay error:', JSON.stringify(err))
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  if (action === 'verify') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Ownership + order-id cross-check — the signature alone only proves the
    // order/payment pair is real, not that it belongs to this course enrollment.
    const { data: existing } = await (supabase as any)
      .from('service_bookings')
      .select('id, razorpay_order_id, payment_status')
      .eq('user_id', user.id)
      .eq('service_item_id', courseId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'No matching pending enrollment found. Contact support.' }, { status: 404 })
    }
    if (existing.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 })
    }

    if (existing.payment_status !== 'paid') {
      const { error } = await (supabase as any).from('service_bookings').update({
        status: 'confirmed',
        payment_status: 'paid',
        razorpay_payment_id,
      }).eq('id', existing.id)
      if (error) {
        console.error('[courses/payment] Booking update failed:', error.message)
        return NextResponse.json({ error: 'Payment verified but enrollment failed. Contact support.' }, { status: 500 })
      }
    }

    const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Seeker'
    try {
      await sendCourseEnrollmentEmail(user.email!, name, courseTitle || 'Course', coursePrice ?? 0, instructor, courseId)
    } catch (e: any) {
      console.warn('[courses/payment] Email failed:', e.message)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
