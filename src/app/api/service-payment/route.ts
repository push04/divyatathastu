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
  // User auth via cookie-session client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin client bypasses RLS for all DB writes — user auth is already verified above
  const admin = await createAdminClient()

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'create'

  if (action === 'create') {
    const { service_item_id, notes, preferred_date, quantity } = await req.json()
    if (!service_item_id) return NextResponse.json({ error: 'service_item_id required' }, { status: 400 })

    // Fetch authoritative price — prevents client-side tampering
    const { data: item, error: itemErr } = await (admin as any)
      .from('service_items')
      .select('id, title, price, is_active, is_bookable')
      .eq('id', service_item_id)
      .eq('is_active', true)
      .single()
    if (itemErr || !item) return NextResponse.json({ error: 'Service not found or not available' }, { status: 404 })

    if (!item.is_bookable) return NextResponse.json({ error: 'This service is not yet open for booking. Please contact us.' }, { status: 400 })

    // Reject if DB price is not set — never trust client-provided amount
    if (item.price === null || item.price === undefined || (item.price as number) <= 0) {
      return NextResponse.json({ error: 'Service price not configured. Please contact support.' }, { status: 400 })
    }

    const qty = Math.max(1, parseInt(quantity) || 1)
    const totalAmount = (item.price as number) * qty
    const receipt = `SVC-${Date.now()}`

    // Mock mode when no Razorpay keys configured
    if (!process.env.RAZORPAY_KEY_ID) {
      const { data: booking, error: bErr } = await (admin as any).from('service_bookings').insert({
        service_item_id,
        user_id: user.id,
        status: 'confirmed',
        amount: totalAmount,
        payment_status: 'paid',
        notes: notes || item.title,
        preferred_date: preferred_date || null,
        razorpay_order_id: 'mock_' + Date.now(),
        razorpay_payment_id: 'mock_pay_' + Date.now(),
      }).select('id').single()
      if (bErr) {
        console.error('[service-payment/mock] insert failed:', bErr.message)
        return NextResponse.json({ error: 'Booking failed. Try again.' }, { status: 500 })
      }
      return NextResponse.json({ success: true, mock: true, booking_id: booking?.id })
    }

    const razorpay = getRazorpay()
    let order: any
    try {
      order = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt,
        notes: { user_id: user.id, service_item_id },
      })
    } catch (err: any) {
      console.error('[service-payment/create] Razorpay error:', err?.error?.description || err.message)
      return NextResponse.json({ error: err?.error?.description || 'Payment gateway error. Please try again.' }, { status: 500 })
    }

    const { data: booking, error: bookErr } = await (admin as any).from('service_bookings').insert({
      service_item_id,
      user_id: user.id,
      status: 'pending',
      amount: totalAmount,
      payment_status: 'pending',
      notes: notes || item.title,
      preferred_date: preferred_date || null,
      razorpay_order_id: order.id,
    }).select('id').single()

    if (bookErr || !booking) {
      console.error('[service-payment/create] booking insert failed:', bookErr?.message)
      return NextResponse.json({ error: 'Booking failed. Try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      booking_id: booking.id,
      key: process.env.RAZORPAY_KEY_ID,
    })
  }

  if (action === 'verify') {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex')
    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Ownership guard: verify this booking belongs to the calling user
    const { data: booking } = await (admin as any).from('service_bookings')
      .select('user_id, razorpay_order_id')
      .eq('id', booking_id)
      .single()
    if (!booking || booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    if (booking.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 })
    }

    const { error: updErr } = await (admin as any).from('service_bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
      razorpay_payment_id,
    }).eq('id', booking_id)

    if (updErr) {
      console.error('[service-payment/verify] update failed:', updErr.message)
      return NextResponse.json({ error: 'Payment recorded but status update failed. Contact support.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
