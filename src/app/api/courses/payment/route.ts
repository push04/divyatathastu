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
      await sendCourseEnrollmentEmail(user.email!, name, courseTitle || 'Course', 0, instructor)
    } catch (e: any) {
      console.warn('[courses/payment] Email failed:', e.message)
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'create') {
    if (!process.env.RAZORPAY_KEY_ID) {
      return NextResponse.json({ error: 'Payment not configured on server' }, { status: 503 })
    }

    const { amount } = body
    const amountPaise = Math.round((Number(amount) || 0) * 100)

    if (amountPaise < 100) {
      return NextResponse.json({ error: 'Course price must be at least ₹1' }, { status: 400 })
    }

    try {
      const razorpay = getRazorpay()
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        // Razorpay receipt limit is 40 chars — keep it short
        receipt: `crs-${Date.now()}`,
        notes: { course_id: courseId, user_id: user.id },
      })
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
    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

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
        amount: coursePrice ?? 0,
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
      })
      if (error) {
        console.error('[courses/payment] Booking insert failed:', error.message)
        return NextResponse.json({ error: 'Payment verified but enrollment failed. Contact support.' }, { status: 500 })
      }
    }

    const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Seeker'
    try {
      await sendCourseEnrollmentEmail(user.email!, name, courseTitle || 'Course', coursePrice ?? 0, instructor)
    } catch (e: any) {
      console.warn('[courses/payment] Email failed:', e.message)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
