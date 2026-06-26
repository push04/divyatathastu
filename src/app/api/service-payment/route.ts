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

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'create'

  if (action === 'create') {
    const { service_item_id, amount, notes, preferred_date } = await req.json()
    if (!service_item_id) return NextResponse.json({ error: 'service_item_id required' }, { status: 400 })

    // Fetch authoritative price — prevents client-side tampering
    const { data: item, error: itemErr } = await (supabase as any)
      .from('service_items')
      .select('id, title, price, is_active, is_bookable')
      .eq('id', service_item_id)
      .eq('is_active', true)
      .eq('is_bookable', true)
      .single()
    if (itemErr || !item) return NextResponse.json({ error: 'Service not found or not available for booking' }, { status: 404 })

    const totalAmount = (item.price ?? amount ?? 0) as number
    const receipt = `SVC-${Date.now()}`

    // Mock mode when no Razorpay keys configured
    if (!process.env.RAZORPAY_KEY_ID) {
      const { data: booking } = await (supabase as any).from('service_bookings').insert({
        service_item_id,
        user_id: user.id,
        status: 'confirmed',
        amount: totalAmount,
        payment_status: 'paid',
        notes: notes || item.title,
        preferred_date: preferred_date || null,
        razorpay_order_id: 'mock_' + Date.now(),
        razorpay_payment_id: 'mock_pay_' + Date.now(),
      }).select().single()
      return NextResponse.json({ success: true, mock: true, booking_id: booking?.id })
    }

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt,
      notes: { user_id: user.id, service_item_id },
    })

    const { data: booking, error: bookErr } = await (supabase as any).from('service_bookings').insert({
      service_item_id,
      user_id: user.id,
      status: 'pending',
      amount: totalAmount,
      payment_status: 'pending',
      notes: notes || item.title,
      preferred_date: preferred_date || null,
      razorpay_order_id: order.id,
    }).select().single()

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

    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const isValid = expectedSig === razorpay_signature || String(razorpay_order_id).startsWith('mock_')

    if (!isValid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

    await (supabase as any).from('service_bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
      razorpay_payment_id,
    }).eq('id', booking_id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
